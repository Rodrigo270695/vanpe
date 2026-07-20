<?php

namespace App\Services\Tenant;

use App\Models\Tenant\MenuComboStep;
use App\Models\Tenant\MenuComboStepOption;
use App\Models\Tenant\MenuDish;
use Illuminate\Support\Str;

class MenuComboService
{
    /**
     * @param  array<int, array<string, mixed>>  $stepsData
     */
    public function syncSteps(MenuDish $combo, array $stepsData): void
    {
        if ($combo->type !== 'combo') {
            $combo->comboSteps()->delete();

            return;
        }

        $keptStepIds = [];

        foreach ($stepsData as $index => $stepData) {
            $step = $this->resolveStep($combo, $stepData);
            $slug = $this->resolveSlug($stepData, $index);

            $step->fill([
                'combo_dish_id' => $combo->id,
                'name' => $stepData['name'],
                'slug' => $slug,
                'min_picks' => (int) ($stepData['min_picks'] ?? 1),
                'max_picks' => (int) ($stepData['max_picks'] ?? 1),
                'included_picks' => (int) ($stepData['included_picks'] ?? 1),
                'extra_pick_price' => $stepData['extra_pick_price'] ?? 0,
                'sort_order' => (int) ($stepData['sort_order'] ?? $index),
            ]);
            $step->save();

            $keptStepIds[] = $step->id;
            $this->syncOptions($step, $stepData['options'] ?? []);
        }

        $combo->comboSteps()
            ->whereNotIn('id', $keptStepIds)
            ->delete();
    }

    /**
     * @param  array<string, mixed>  $stepData
     */
    private function resolveStep(MenuDish $combo, array $stepData): MenuComboStep
    {
        if (! empty($stepData['id'])) {
            $existing = MenuComboStep::query()
                ->where('combo_dish_id', $combo->id)
                ->where('id', $stepData['id'])
                ->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        return new MenuComboStep;
    }

    /**
     * @param  array<string, mixed>  $stepData
     */
    private function resolveSlug(array $stepData, int $index): string
    {
        if (! empty($stepData['slug'])) {
            return Str::slug((string) $stepData['slug'], '_');
        }

        return Str::slug((string) $stepData['name'], '_') ?: "step_{$index}";
    }

    /**
     * @param  array<int, array<string, mixed>>  $optionsData
     */
    private function syncOptions(MenuComboStep $step, array $optionsData): void
    {
        $keptOptionIds = [];

        foreach ($optionsData as $index => $optionData) {
            $option = $this->resolveOption($step, $optionData);

            $option->fill([
                'step_id' => $step->id,
                'dish_id' => $optionData['dish_id'],
                'supplement' => $optionData['supplement'] ?? 0,
                'sort_order' => (int) ($optionData['sort_order'] ?? $index),
            ]);
            $option->save();

            $keptOptionIds[] = $option->id;
        }

        $step->options()
            ->whereNotIn('id', $keptOptionIds)
            ->delete();
    }

    /**
     * @param  array<string, mixed>  $optionData
     */
    private function resolveOption(MenuComboStep $step, array $optionData): MenuComboStepOption
    {
        if (! empty($optionData['id'])) {
            $existing = MenuComboStepOption::query()
                ->where('step_id', $step->id)
                ->where('id', $optionData['id'])
                ->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        return new MenuComboStepOption;
    }
}
