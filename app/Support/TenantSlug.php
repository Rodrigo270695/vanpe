<?php

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Support\Str;

class TenantSlug
{
    /**
     * Genera un slug (subdominio) único a partir de un texto de origen.
     * Cumple el patrón DNS y evita colisiones contra tenants.slug.
     */
    public static function unique(string $source): string
    {
        $base = trim(Str::slug($source), '-');

        if (strlen($base) < 3) {
            $base = 'r-'.$base.'-'.Str::lower(Str::random(4));
        }

        $base = substr($base, 0, 55);

        $slug = $base;
        $i = 2;

        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
