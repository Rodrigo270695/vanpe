<?php

namespace App\Support;

final class RefCatalogTypes
{
    public const CUISINE = 'cuisine';

    public const SERVICE = 'service';

    public const LANGUAGE = 'language';

    public const AMBIANCE = 'ambiance';

    public const TOUR_ACCESS = 'tour_access';

    public const TOUR_ROAD = 'tour_road';

    /** Tipos que eligen los restaurantes en su ficha pública. */
    public const RESTAURANT = [
        self::CUISINE,
        self::SERVICE,
        self::LANGUAGE,
        self::AMBIANCE,
    ];

    /** @var list<string> */
    public const ALL = [
        self::CUISINE,
        self::SERVICE,
        self::LANGUAGE,
        self::AMBIANCE,
        self::TOUR_ACCESS,
        self::TOUR_ROAD,
    ];

    /**
     * @param  list<string>|null  $types
     * @return array<string, string>
     */
    public static function labels(?array $types = null): array
    {
        $all = [
            self::CUISINE => __('messages.catalog.type_cuisine'),
            self::SERVICE => __('messages.catalog.type_service'),
            self::LANGUAGE => __('messages.catalog.type_language'),
            self::AMBIANCE => __('messages.catalog.type_ambiance'),
            self::TOUR_ACCESS => __('messages.catalog.type_tour_access'),
            self::TOUR_ROAD => __('messages.catalog.type_tour_road'),
        ];

        if ($types === null) {
            return $all;
        }

        return array_intersect_key($all, array_flip($types));
    }
}
