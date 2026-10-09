<?php

namespace App\Services\Platform;

use App\Models\Craft;
use App\Models\CraftMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CraftMediaStorage
{
    public function storePhoto(
        UploadedFile $file,
        Craft $craft,
        int $sortOrder,
        ?string $titulo,
        float|string|null $precio,
    ): CraftMedia {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = 'photo.'.Str::uuid().'.'.Str::lower($extension);
        $path = $file->storeAs($this->directory($craft->id), $filename, 'public');

        return CraftMedia::query()->create([
            'craft_id' => $craft->id,
            'url' => '/storage/'.$path,
            'titulo' => $titulo,
            'precio' => $precio,
            'sort_order' => $sortOrder,
        ]);
    }

    public function deleteMedia(CraftMedia $media): void
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

    private function directory(string $craftId): string
    {
        return "crafts/{$craftId}";
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
