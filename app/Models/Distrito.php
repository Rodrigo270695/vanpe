<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Distrito extends Model
{
    protected $fillable = ['provincia_id', 'name', 'status'];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function provincia(): BelongsTo
    {
        return $this->belongsTo(Provincia::class);
    }
}
