<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class DevEmitController extends Controller
{
    public function emit(Request $request): \Illuminate\Http\JsonResponse
    {
        $channel = $request->input('channel', 'chat');
        $event = $request->input('event', 'message');
        $data = $request->input('data', []);

        $payload = json_encode([
            'event' => $event,
            'channel' => $channel,
            'data' => $data,
        ]);

        Redis::publish($channel, $payload);

        return response()->json(['status' => 'ok']);
    }
}