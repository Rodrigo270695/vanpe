<?php

namespace App\Services\Platform;

use App\Models\Hotel;
use App\Models\HotelMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HotelMediaStorage
{
    public function storeCover(UploadedFile $file, Hotel $hotel): string
    {
        $this->deleteIfExists($hotel->imagen_portada_url);

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'cover.'.$hotel->id.'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($hotel->id), $filename, 'public');

        return '/storage/'.$path;
    }

    public function storeGalleryItem(UploadedFile $file, Hotel $hotel, int $sortOrder = 0): HotelMedia
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'gallery.'.Str::uuid().'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($hotel->id), $filename, 'public');

        return HotelMedia::query()->create([
            'hotel_id' => $hotel->id,
            'tipo' => 'imagen',
            'url' => '/storage/'.$path,
            'caption' => null,
            'sort_order' => $sortOrder,
            'is_cover' => false,
        ]);
    }

    public function deleteMedia(HotelMedia $media): void
    {
        $this->deleteIfExists($media->url);
        $media->delete();
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

    private function directory(string $hotelId): string
    {
        return "hotels/{$hotelId}";
    }

    private function relativePathFromUrl(string $imageUrl): ?string
    {
        $path = str_contains($imageUrl, '://')
            ? parse_url($imageUrl, PHP_URL_PATH)
            : $imageUrl;

        if (! is_string($path) || ! str_contains($path, '/storage/')) {
            return null;
        }

        return Str::after($path, '/storage/');
    }
}
