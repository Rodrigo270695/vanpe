<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerPushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'platform' => ['nullable', 'string', 'in:ios,android,web'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $row = CustomerPushToken::query()->updateOrCreate(
            [
                'customer_id' => $customer->id,
                'token' => $data['token'],
            ],
            [
                'platform' => $data['platform'] ?? null,
                'device_name' => $data['device_name'] ?? null,
                'last_seen_at' => now(),
            ],
        );

        return response()->json([
            'data' => [
                'id' => $row->id,
                'registered' => true,
            ],
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        CustomerPushToken::query()
            ->where('customer_id', $customer->id)
            ->where('token', $data['token'])
            ->delete();

        return response()->json(['data' => ['removed' => true]]);
    }
}
