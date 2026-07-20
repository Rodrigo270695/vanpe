<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CfgCatalogSelection extends Model
{
    use HasUuids;

    protected $connection = 'tenant';

    protected $table = 'cfg_catalog_selections';

    protected $fillable = [
        'catalog_item_id',
        'catalog_type',
    ];

    /**
     * @param  list<string>  $catalogItemIds
     * @param  array<string, string>  $typesById  catalog_item_id => type
     */
    public static function syncIds(array $catalogItemIds, array $typesById): void
    {
        $ids = collect($catalogItemIds)
            ->filter(fn (mixed $id): bool => is_string($id) && isset($typesById[$id]))
            ->unique()
            ->values()
            ->all();

        static::query()->whereNotIn('catalog_item_id', $ids)->delete();

        foreach ($ids as $id) {
            static::query()->updateOrCreate(
                ['catalog_item_id' => $id],
                ['catalog_type' => $typesById[$id]],
            );
        }
    }

    /**
     * @return list<string>
     */
    public static function selectedIds(): array
    {
        return static::query()
            ->orderBy('catalog_type')
            ->pluck('catalog_item_id')
            ->all();
    }
}
