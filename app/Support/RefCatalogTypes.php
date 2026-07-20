<?php

namespace App\Support;

final class RefCatalogTypes
{
    public const CUISINE = 'cuisine';

    public const SERVICE = 'service';

    public const LANGUAGE = 'language';

    public const AMBIANCE = 'ambiance';

    /** @var list<string> */
    public const ALL = [
        self::CUISINE,
        self::SERVICE,
        self::LANGUAGE,
        self::AMBIANCE,
    ];

    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return [
            self::CUISINE => __('messages.catalog.type_cuisine'),
            self::SERVICE => __('messages.catalog.type_service'),
            self::LANGUAGE => __('messages.catalog.type_language'),
            self::AMBIANCE => __('messages.catalog.type_ambiance'),
        ];
    }
}
