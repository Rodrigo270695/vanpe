<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

/**
 * Catálogo de features configurables por plan (config/plan_features.php).
 */
class PlanFeatureCatalog
{
    /**
     * @return array<string, array{type: string, default?: mixed, options?: array<int, string>}>
     */
    public static function all(): array
    {
        return (array) Config::get('plan_features', []);
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    /**
     * @return array<int, array{key: string, type: string, label: string, options?: array<int, string>}>
     */
    public static function forFrontend(): array
    {
        $items = [];

        foreach (self::all() as $key => $meta) {
            $items[] = [
                'key' => $key,
                'type' => (string) ($meta['type'] ?? 'string'),
                'label' => (string) trans("messages.plan_features.catalog.$key"),
                'options' => $meta['options'] ?? null,
            ];
        }

        return $items;
    }
}
