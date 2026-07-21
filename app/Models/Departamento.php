<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    protected $fillable = ['pais_id', 'name', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function provincias(): HasMany
    {
        return $this->hasMany(Provincia::class);
    }
}
