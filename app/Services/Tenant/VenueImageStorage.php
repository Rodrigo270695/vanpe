<?php

namespace App\Services\Tenant;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VenueImageStorage
{
    public function storeBranded(UploadedFile $file, string $tenantSlug, string $kind): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = $kind.'.'.Str::lower($extension);
        $directory = "tenants/{$tenantSlug}/venue";

        $this->deleteBrandedFiles($tenantSlug, $kind);

        $path = $file->storeAs($directory, $filename, 'public');

        return '/storage/'.$path;
    }

    public function storeGallery(UploadedFile $file, string $tenantSlug, string $photoId): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = $photoId.'.'.Str::lower($extension);
        $directory = "tenants/{$tenantSlug}/venue/gallery";

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

    public function deleteBranded(string $tenantSlug, string $kind, ?string $imageUrl = null): void
    {
        $this->deleteIfExists($imageUrl);
        $this->deleteBrandedFiles($tenantSlug, $kind);
    }

    public function deleteGalleryPhoto(string $tenantSlug, string $photoId, ?string $imageUrl = null): void
    {
        $this->deleteIfExists($imageUrl);

        $directory = "tenants/{$tenantSlug}/venue/gallery";
        $disk = Storage::disk('public');

        if (! $disk->exists($directory)) {
            return;
        }

        foreach ($disk->files($directory) as $path) {
            if (str_starts_with(basename($path), "{$photoId}.")) {
                $disk->delete($path);
            }
        }
    }

    private function deleteBrandedFiles(string $tenantSlug, string $kind): void
    {
        $directory = "tenants/{$tenantSlug}/venue";
        $disk = Storage::disk('public');

        if (! $disk->exists($directory)) {
            return;
        }

        foreach ($disk->files($directory) as $path) {
            if (str_starts_with(basename($path), "{$kind}.")) {
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
