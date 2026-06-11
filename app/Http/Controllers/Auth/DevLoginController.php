<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Development-only authentication controller.
 *
 * Provides email/password registration and login so the app can be tested
 * locally without configuring Google/GitHub/Discord OAuth. This controller
 * is only wired when APP_ENV=local.
 */
class DevLoginController extends Controller
{
    public function __construct(private readonly JwtService $jwt)
    {
    }

    /**
     * Abort if not in local environment. Called at the top of each action.
     */
    private function ensureLocalEnvironment(): void
    {
        abort_unless(app()->environment('local'), 404);
    }

    // ── Registration ──────────────────────────────────────────────────

    public function showRegister(): Response
    {
        $this->ensureLocalEnvironment();

        return Inertia::render('Auth/Register');
    }

    public function register(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $this->ensureLocalEnvironment();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:32'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'display_name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'status' => 'online',
        ]);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $token = $this->jwt->generate($user);
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

    // ── Login ─────────────────────────────────────────────────────────

    public function showLogin(): Response
    {
        $this->ensureLocalEnvironment();

        return Inertia::render('Auth/DevLogin');
    }

    public function login(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $this->ensureLocalEnvironment();

        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return back()->withErrors(['email' => 'Credenciales inválidas.'])->onlyInput('email');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $token = $this->jwt->generate($user);
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
}