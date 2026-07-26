<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tourist\CustomerResource;
use App\Models\Customer;
use App\Services\Tourist\CustomerPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function __construct(
        private readonly CustomerPreferenceService $preferences,
    ) {}

    public function show(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        return response()->json([
            'data' => $this->preferences->preferencePayload($customer),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $validated = $request->validate([
            'catalog_item_ids' => ['required', 'array', 'min:1'],
            'catalog_item_ids.*' => ['uuid'],
        ]);

        /** @var list<string> $ids */
        $ids = array_values(array_unique($validated['catalog_item_ids']));

        $this->preferences->sync($customer, $ids);
        $customer->load('catalogPreferences');

        return response()->json([
            'message' => 'Preferencias guardadas.',
            'data' => [
                'preferences' => $this->preferences->preferencePayload($customer),
                'customer' => new CustomerResource($customer),
            ],
        ]);
    }
}
