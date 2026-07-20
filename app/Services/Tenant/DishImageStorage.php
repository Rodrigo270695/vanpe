<?php

namespace App\Services\Tenant;

use App\Models\Tenant\MenuDish;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DishImageStorage
{
    public function store(UploadedFile $file, string $tenantSlug, MenuDish $dish): string
    {
        $this->deleteAllForDish($tenantSlug, (string) $dish->id, $dish->image_url);

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = $dish->id.'.'.Str::lower($extension);
        $directory = "tenants/{$tenantSlug}/menu";

        $path = $file->storeAs($directory, $filename, 'public');

        return '/storage/'.$path;
    }

    public function deleteIfExists(?string $imageUrl): void
    {
        if ($imageUrl === null || $imageUrl === '') {
            return;
        }

        $relative = $this->relativePathFromUrl($imageUrl);

        if ($relative !== null && Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }

    public function deleteAllForDish(string $tenantSlug, string $dishId, ?string $imageUrl = null): void
    {
        $this->deleteIfExists($imageUrl);

        $directory = "tenants/{$tenantSlug}/menu";
        $disk = Storage::disk('public');

        if (! $disk->exists($directory)) {
            return;
        }

        foreach ($disk->files($directory) as $path) {
            if (str_starts_with(basename($path), "{$dishId}.")) {
                $disk->delete($path);
            }
        }
    }

    private function relativePathFromUrl(string $imageUrl): ?string
    {
        if (str_contains($imageUrl, '/storage/')) {
            $relative = Str::after($imageUrl, '/storage/');

            return $relative !== $imageUrl ? $relative : null;
        }

        $path = parse_url($imageUrl, PHP_URL_PATH);

        if (! is_string($path) || ! str_contains($path, '/storage/')) {
            return null;
        }

        return Str::after($path, '/storage/');
    }
}
