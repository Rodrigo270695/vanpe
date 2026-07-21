<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
    protected $fillable = ['departamento_id', 'name', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function distritos(): HasMany
    {
        return $this->hasMany(Distrito::class);
    }
}
