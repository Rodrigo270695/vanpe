<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CfgVenuePhoto extends Model
{
    use HasUuids;

    public const MAX_PHOTOS = 12;

    protected $connection = 'tenant';

    protected $table = 'cfg_venue_photos';

    protected $fillable = [
        'image_url',
        'caption',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
