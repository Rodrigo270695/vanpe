import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_CENTER: [number, number] = [-79.84088, -6.77137]; // Chiclayo
const DEFAULT_ZOOM = 13;

export type MapLocationValue = {
    latitud: number | null;
    longitud: number | null;
    direccion?: string;
};

type Suggestion = {
    id: string;
    place_name: string;
    center: [number, number];
};

type LocationMapPickerProps = {
    token: string | null;
    value: MapLocationValue;
    disabled?: boolean;
    onChange: (next: MapLocationValue) => void;
    className?: string;
    searchPlaceholder?: string;
    hint?: string;
    missingTokenHint?: string;
};

export function LocationMapPicker({
    token,
    value,
    disabled = false,
    onChange,
    className,
    searchPlaceholder = 'Buscar dirección en Perú…',
    hint = 'Busca una dirección o haz clic en el mapa para fijar el pin.',
    missingTokenHint = 'Configura VITE_MAPBOX_TOKEN para activar el mapa.',
}: LocationMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [openList, setOpenList] = useState(false);
    const debounceRef = useRef<number | null>(null);

    const hasCoords = value.latitud != null && value.longitud != null;

    const setMarker = useCallback((lng: number, lat: number) => {
        const map = mapRef.current;
        if (!map) return;

        if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: '#1769E0', draggable: !disabled })
                .setLngLat([lng, lat])
                .addTo(map);

            markerRef.current.on('dragend', () => {
                const pos = markerRef.current?.getLngLat();
                if (!pos) return;
                const lat = Number(pos.lat.toFixed(6));
                const lng = Number(pos.lng.toFixed(6));
                onChange({ latitud: lat, longitud: lng });
                if (token) {
                    void reverseGeocode(token, lng, lat).then((place) => {
                        if (place) {
                            onChange({ latitud: lat, longitud: lng, direccion: place });
                        }
                    });
                }
            });
        } else {
            markerRef.current.setLngLat([lng, lat]);
            markerRef.current.setDraggable(!disabled);
        }
    }, [disabled, onChange, token]);

    useEffect(() => {
        if (!token || !mapContainerRef.current || mapRef.current) return;

        mapboxgl.accessToken = token;
        const center: [number, number] = hasCoords
            ? [value.longitud as number, value.latitud as number]
            : DEFAULT_CENTER;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center,
            zoom: hasCoords ? 15 : DEFAULT_ZOOM,
            attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = map;

        map.on('click', (e) => {
            if (disabled) return;
            const { lng, lat } = e.lngLat;
            setMarker(lng, lat);
            onChange({
                latitud: Number(lat.toFixed(6)),
                longitud: Number(lng.toFixed(6)),
            });
            void reverseGeocode(token, lng, lat).then((place) => {
                if (place) {
                    onChange({
                        latitud: Number(lat.toFixed(6)),
                        longitud: Number(lng.toFixed(6)),
                        direccion: place,
                    });
                }
            });
        });

        if (hasCoords) {
            setMarker(value.longitud as number, value.latitud as number);
        }

        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
            map.remove();
            mapRef.current = null;
        };
        // Solo montar una vez con token.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        if (!mapRef.current || value.latitud == null || value.longitud == null) return;
        setMarker(value.longitud, value.latitud);
        mapRef.current.easeTo({
            center: [value.longitud, value.latitud],
            zoom: Math.max(mapRef.current.getZoom(), 14),
            duration: 500,
        });
    }, [value.latitud, value.longitud, setMarker]);

    useEffect(() => {
        markerRef.current?.setDraggable(!disabled);
    }, [disabled]);

    useEffect(() => {
        if (!token || query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            void searchPlaces(token, query.trim()).then((rows) => {
                setSuggestions(rows);
                setOpenList(rows.length > 0);
                setSearching(false);
            });
            setSearching(true);
        }, 320);

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, [query, token]);

    const pickSuggestion = (item: Suggestion) => {
        const [lng, lat] = item.center;
        setQuery(item.place_name);
        setOpenList(false);
        setSuggestions([]);
        setMarker(lng, lat);
        onChange({
            latitud: Number(lat.toFixed(6)),
            longitud: Number(lng.toFixed(6)),
            direccion: item.place_name,
        });
        mapRef.current?.easeTo({ center: [lng, lat], zoom: 16, duration: 600 });
    };

    if (!token) {
        return (
            <div
                className={cn(
                    'sm:col-span-2 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900',
                    className,
                )}
            >
                {missingTokenHint}
            </div>
        );
    }

    return (
        <div className={cn('space-y-2 sm:col-span-2', className)}>
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpenList(suggestions.length > 0)}
                    placeholder={searchPlaceholder}
                    disabled={disabled}
                    className="bg-card pl-9 pr-9"
                    autoComplete="off"
                />
                {searching ? (
                    <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
                {openList && suggestions.length > 0 ? (
                    <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg">
                        {suggestions.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/70"
                                    onClick={() => pickSuggestion(item)}
                                    disabled={disabled}
                                >
                                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-blue" />
                                    <span>{item.place_name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            <p className="text-xs text-muted-foreground">{hint}</p>

            <div
                ref={mapContainerRef}
                className="h-64 w-full overflow-hidden rounded-xl border border-border bg-muted/30"
            />

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                    Lat:{' '}
                    <strong className="font-mono text-foreground">
                        {value.latitud ?? '—'}
                    </strong>
                </span>
                <span>
                    Lng:{' '}
                    <strong className="font-mono text-foreground">
                        {value.longitud ?? '—'}
                    </strong>
                </span>
            </div>
        </div>
    );
}

async function searchPlaces(token: string, query: string): Promise<Suggestion[]> {
    try {
        const url = new URL(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        );
        url.searchParams.set('access_token', token);
        url.searchParams.set('country', 'pe');
        url.searchParams.set('language', 'es');
        url.searchParams.set('limit', '6');
        url.searchParams.set('types', 'address,poi,place,locality,neighborhood');

        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const json = (await res.json()) as {
            features?: Array<{ id: string; place_name: string; center: [number, number] }>;
        };

        return (json.features ?? []).map((f) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
        }));
    } catch {
        return [];
    }
}

async function reverseGeocode(token: string, lng: number, lat: number): Promise<string | null> {
    try {
        const url = new URL(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        );
        url.searchParams.set('access_token', token);
        url.searchParams.set('language', 'es');
        url.searchParams.set('limit', '1');

        const res = await fetch(url.toString());
        if (!res.ok) return null;
        const json = (await res.json()) as { features?: Array<{ place_name: string }> };
        return json.features?.[0]?.place_name ?? null;
    } catch {
        return null;
    }
}
