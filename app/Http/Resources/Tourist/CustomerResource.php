<?php

namespace App\Http\Resources\Tourist;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;

/**
 * @mixin Customer
 */
class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $preferenceIds = $this->resolveCatalogPreferenceIds();
        $interestGroupIds = $this->resolveInterestGroupIds();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status,
            'has_password' => $this->hasPassword(),
            'has_google' => filled($this->google_id),
            'preferences_completed' => count($interestGroupIds) > 0 || count($preferenceIds) > 0,
            'interest_group_ids' => $interestGroupIds,
            'preference_ids' => $preferenceIds,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /** @return list<string> */
    private function resolveCatalogPreferenceIds(): array
    {
        if (! Schema::hasTable('customer_catalog_preferences')) {
            return [];
        }

        if ($this->relationLoaded('catalogPreferences')) {
            return $this->catalogPreferences->pluck('catalog_item_id')->values()->all();
        }

        return $this->catalogPreferences()->pluck('catalog_item_id')->values()->all();
    }

    /** @return list<string> */
    private function resolveInterestGroupIds(): array
    {
        if (! Schema::hasTable('customer_interest_group_preferences')) {
            return [];
        }

        if ($this->relationLoaded('interestGroupPreferences')) {
            return $this->interestGroupPreferences->pluck('interest_group_id')->values()->all();
        }

        return $this->interestGroupPreferences()->pluck('interest_group_id')->values()->all();
    }
}
