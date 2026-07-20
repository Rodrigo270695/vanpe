<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PubMenuHighlight extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';

    protected $fillable = [
        'tenant_id',
        'dish_ref',
        'nombre',
        'descripcion',
        'precio',
        'imagen_url',
        'categoria_nombre',
        'featured',
        'sort_order',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'featured' => 'boolean',
            'sort_order' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
