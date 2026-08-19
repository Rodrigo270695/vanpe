<?php

namespace App\Http\Controllers\Api\Tourist;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tourist\CustomerResource;
use App\Models\Customer;
use App\Services\Tourist\CustomerPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
            'interest_group_ids' => ['sometimes', 'array', 'min:1'],
            'interest_group_ids.*' => ['uuid'],
            'catalog_item_ids' => ['sometimes', 'array', 'min:1'],
            'catalog_item_ids.*' => ['uuid'],
        ]);

        if (isset($validated['interest_group_ids'])) {
            /** @var list<string> $groupIds */
            $groupIds = array_values(array_unique($validated['interest_group_ids']));
            $this->preferences->syncInterestGroups($customer, $groupIds);
        } elseif (isset($validated['catalog_item_ids'])) {
            /** @var list<string> $ids */
            $ids = array_values(array_unique($validated['catalog_item_ids']));
            $this->preferences->sync($customer, $ids);
        } else {
            throw ValidationException::withMessages([
                'interest_group_ids' => ['Indica al menos un grupo de interés.'],
            ]);
        }

        $customer->unsetRelation('catalogPreferences');
        $customer->unsetRelation('interestGroupPreferences');
        $customer->load(['catalogPreferences', 'interestGroupPreferences']);

        return response()->json([
            'message' => 'Preferencias guardadas.',
            'data' => [
                'preferences' => $this->preferences->preferencePayload($customer),
                'customer' => (new CustomerResource($customer))->resolve(),
            ],
        ]);
    }
}
