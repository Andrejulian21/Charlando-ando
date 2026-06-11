<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * OAuth entry point. The redirect method hands off to the provider's authorization
 * endpoint; the callback consumes the response, reconciles the social identity with
 * the local users table, logs the user in, and returns a JWT.
 */
class OAuthController extends Controller
{
    /** Providers we allow through the {provider} route parameter. */
    private const ALLOWED_PROVIDERS = ['google', 'github', 'discord'];

    public function __construct(private readonly JwtService $jwt)
    {
    }

    public function redirect(string $provider): Response
    {
        $this->guardProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider): Response
    {
        $this->guardProvider($provider);

        try {
            $social = Socialite::driver($provider)->user();
        } catch (Throwable $e) {
            Log::warning('OAuth callback failed', ['provider' => $provider, 'error' => $e->getMessage()]);
            return redirect()->route('login')->withErrors(['oauth' => 'OAuth login failed. Please try again.']);
        }

        if (! $social->getId()) {
            return redirect()->route('login')->withErrors(['oauth' => 'Provider did not return a user id.']);
        }

        $user = $this->reconcileUser($provider, $social);
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $token = $this->jwt->generate($user);

        // For the Inertia/SPA flow, stash the token + user in the session and
        // redirect to the frontend Callback page. The page stores the token
        // in localStorage and navigates the browser to /chat. This avoids
        // landing on a raw JSON response in the browser tab.
        $request->session()->put('oauth_result', [
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
            ],
        ]);

        return redirect()->route('auth.callback');
    }

    /**
     * Frontend Inertia page that consumes the session-stashed OAuth result
     * and stores the JWT in localStorage on behalf of the SPA. The actual
     * navigation to /chat happens client-side from Auth/Callback.jsx.
     */
    public function callbackPage(Request $request): Response|RedirectResponse
    {
        $result = $request->session()->pull('oauth_result');

        if (! is_array($result) || empty($result['token'])) {
            return redirect()->route('login')->withErrors([
                'oauth' => 'OAuth session expired. Please try again.',
            ]);
        }

        return Inertia::render('Auth/Callback', [
            'token' => $result['token'],
            'user' => $result['user'] ?? null,
        ]);
    }

    /**
     * Find or create the local user. Email dedup rule:
     *   1. If a user with the same provider+provider_id exists -> use it.
     *   2. Else if a user with the same email exists and provider/provider_id are null,
     *      link the social identity to that account.
     *   3. Else create a new user.
     */
    private function reconcileUser(string $provider, \Laravel\Socialite\Contracts\User $social): User
    {
        $byIdentity = User::query()
            ->where('provider', $provider)
            ->where('provider_id', $social->getId())
            ->first();

        if ($byIdentity !== null) {
            return $byIdentity;
        }

        $email = $social->getEmail();

        if ($email !== null && $email !== '') {
            $byEmail = User::query()->where('email', $email)->first();

            if ($byEmail !== null && $byEmail->provider === null && $byEmail->provider_id === null) {
                $byEmail->forceFill([
                    'provider' => $provider,
                    'provider_id' => $social->getId(),
                    'avatar_url' => $byEmail->avatar_url ?? $social->getAvatar(),
                ])->save();

                return $byEmail;
            }
        }

        $name = $social->getName() ?: $social->getNickname() ?: 'User';
        $baseName = Str::limit($name, 32, '');

        return User::query()->create([
            'name' => $baseName,
            'display_name' => $baseName,
            'email' => $email,
            'provider' => $provider,
            'provider_id' => $social->getId(),
            'avatar_url' => $social->getAvatar(),
            'email_verified_at' => $email ? now() : null,
        ]);
    }

    private function guardProvider(string $provider): void
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404, "Unknown OAuth provider [{$provider}]");
        }
    }
}
