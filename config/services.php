<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'socketio' => [
        // Public URL the browser uses to reach the Socket.io sidecar.
        'url' => env('SOCKETIO_URL', 'http://localhost:3000'),
        // Comma-separated allowed origins, or `*`. Forwarded to the sidecar
        // so it can build its CORS allow-list.
        'cors_origin' => env('SOCKETIO_CORS_ORIGIN', '*'),
        // Presence + heartbeat tuning forwarded to the sidecar at boot.
        'heartbeat_ms' => (int) env('SOCKETIO_HEARTBEAT_MS', 15_000),
        'presence_ttl_sec' => (int) env('SOCKETIO_PRESENCE_TTL_SEC', 30),
        'idle_timeout_ms' => (int) env('SOCKETIO_IDLE_TIMEOUT_MS', 5 * 60_000),
    ],

    'sidecar' => [
        // Shared secret for sidecar -> Laravel API calls (e.g. presence disconnect).
        'secret' => env('SIDECAR_SECRET'),
        // Internal URL the sidecar uses to reach the Laravel API.
        'laravel_url' => env('SIDECAR_LARAVEL_URL', 'http://laravel.test'),
    ],

];
