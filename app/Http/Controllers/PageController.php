<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

/**
 * Renders the SPA shell pages. Each action hands off to Inertia::render with the
 * route parameters as props so the React side can fetch the matching domain data
 * (servers, channels, DMs, settings) through the API. The actual page components
 * live in resources/js/pages/ and are resolved by the Inertia client loader.
 */
class PageController extends Controller
{
    public function login(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function chatIndex(): Response
    {
        return Inertia::render('Chat/Index');
    }

    public function chatShow(string $server, string $channel): Response
    {
        return Inertia::render('Chat/Show', [
            'server' => $server,
            'channel' => $channel,
        ]);
    }

    public function dmsIndex(): Response
    {
        return Inertia::render('Dms/Index');
    }

    public function dmsShow(string $dm): Response
    {
        return Inertia::render('Dms/Show', [
            'dm' => $dm,
        ]);
    }

    public function settingsIndex(): Response
    {
        return Inertia::render('Settings/Index');
    }

    public function settingsServer(string $server): Response
    {
        return Inertia::render('Settings/ServerShow', [
            'server' => $server,
        ]);
    }
}
