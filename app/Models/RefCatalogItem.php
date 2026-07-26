<?php

namespace App\Models;

use App\Support\RefCatalogTypes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RefCatalogItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'type',
        'slug',
        'name_es',
        'name_en',
        'icon',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(RefCatalogProposal::class, 'catalog_item_id');
    }

    public function labelForLocale(?string $locale = null): string
    {
        $locale ??= app()->getLocale();
        $code = strtolower(substr((string) $locale, 0, 2));

        // Catálogo base: es / en. Portugués usa español (más cercano en turismo LatAm).
        return $code === 'en' ? $this->name_en : $this->name_es;
    }

    /**
     * @return array<string, mixed>
     */
    public function toCatalogArray(?string $locale = null): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'slug' => $this->slug,
            'name' => $this->labelForLocale($locale),
            'name_es' => $this->name_es,
            'name_en' => $this->name_en,
            'icon' => $this->icon,
            'sort_order' => $this->sort_order,
            'active' => $this->active,
        ];
    }

    public static function isValidType(string $type): bool
    {
        return in_array($type, RefCatalogTypes::ALL, true);
    }
}
