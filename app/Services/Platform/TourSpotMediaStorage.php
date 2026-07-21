<?php

namespace App\Services\Platform;

use App\Models\TourSpot;
use App\Models\TourSpotMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TourSpotMediaStorage
{
    public function storeCover(UploadedFile $file, TourSpot $spot): string
    {
        $this->deleteIfExists($spot->imagen_portada_url);

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'cover.'.$spot->id.'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($spot->id), $filename, 'public');

        return '/storage/'.$path;
    }

    public function storeGalleryItem(UploadedFile $file, TourSpot $spot, int $sortOrder = 0): TourSpotMedia
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'gallery.'.Str::uuid().'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($spot->id), $filename, 'public');

        return TourSpotMedia::query()->create([
            'tour_spot_id' => $spot->id,
            'tipo' => 'imagen',
            'url' => '/storage/'.$path,
            'caption' => null,
            'sort_order' => $sortOrder,
            'is_cover' => false,
        ]);
    }

    public function deleteMedia(TourSpotMedia $media): void
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

    private function directory(string $spotId): string
    {
        return "tour-spots/{$spotId}";
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
