<?php

namespace App\Services\Platform;

use App\Models\TourEvent;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TourEventMediaStorage
{
    public function storeCover(UploadedFile $file, TourEvent $event): string
    {
        $this->deleteIfExists($event->portada_url);

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'cover.'.$event->id.'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($event->id), $filename, 'public');

        return '/storage/'.$path;
    }

    public function storeSponsorLogo(UploadedFile $file, TourEvent $event, int $index): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'sponsor.'.$index.'.'.Str::uuid().'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($event->id), $filename, 'public');

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

    private function directory(string $eventId): string
    {
        return "tour-events/{$eventId}";
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
