<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\AppDiagnosticLog;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DiagnosticLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:64'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'app_version' => ['nullable', 'string', 'max:32'],
            'platform' => ['nullable', 'string', 'max:16'],
            'os_version' => ['nullable', 'string', 'max:64'],
            'events' => ['required', 'array', 'min:1', 'max:40'],
            'events.*.level' => ['required', 'string', 'in:info,warning,error,fatal'],
            'events.*.event' => ['required', 'string', 'max:64'],
            'events.*.message' => ['required', 'string', 'max:500'],
            'events.*.payload' => ['nullable', 'array'],
            'events.*.occurred_at' => ['nullable', 'string', 'max:40'],
        ]);

        /** @var Customer|null $customer */
        $customer = $request->user('sanctum');
        if (! $customer instanceof Customer && filled($request->bearerToken())) {
            $tokenable = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken())?->tokenable;
            $customer = $tokenable instanceof Customer ? $tokenable : null;
        }

        $created = 0;
        foreach ($data['events'] as $event) {
            AppDiagnosticLog::query()->create([
                'id' => (string) Str::uuid(),
                'device_id' => $data['device_id'],
                'customer_id' => $customer?->id,
                'session_id' => $data['session_id'] ?? null,
                'level' => $event['level'],
                'event' => $event['event'],
                'message' => mb_substr($event['message'], 0, 500),
                'app_version' => $data['app_version'] ?? null,
                'platform' => $data['platform'] ?? null,
                'os_version' => $data['os_version'] ?? null,
                'payload' => [
                    ...($event['payload'] ?? []),
                    'occurred_at' => $event['occurred_at'] ?? null,
                ],
            ]);
            $created++;
        }

        return response()->json([
            'data' => [
                'accepted' => $created,
            ],
        ], 201);
    }
}
