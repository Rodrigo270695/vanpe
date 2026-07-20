import { useMemo, useState } from 'react';
import type { SortState } from '@/components/common/data-table';

type UseClientTableOptions<T> = {
    /** Campos a considerar en la búsqueda, o una función que devuelve el texto. */
    searchable?: (keyof T)[] | ((row: T) => string);
    initialPerPage?: number;
    initialSort?: SortState;
    /** Extrae el valor a ordenar para una sortKey dada. */
    sortAccessor?: (row: T, key: string) => string | number | null | undefined;
};

/**
 * Maneja búsqueda, orden y paginación en el cliente para datos ya cargados.
 * Ideal para catálogos pequeños/medianos (roles, usuarios, etc.).
 */
export function useClientTable<T>(
    data: T[],
    options: UseClientTableOptions<T> = {},
) {
    const {
        searchable,
        initialPerPage = 10,
        initialSort = null,
        sortAccessor,
    } = options;

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>(initialSort);
    const [perPage, setPerPageState] = useState(initialPerPage);
    const [page, setPage] = useState(1);

    const searchText = (row: T): string => {
        if (typeof searchable === 'function') return searchable(row);
        if (Array.isArray(searchable)) {
            return searchable
                .map((k) => String((row as Record<string, unknown>)[k as string] ?? ''))
                .join(' ');
        }
        return JSON.stringify(row);
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data.filter((row) => searchText(row).toLowerCase().includes(q));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search]);

    const sorted = useMemo(() => {
        if (!sort) return filtered;
        const accessor =
            sortAccessor ??
            ((row: T, key: string) =>
                (row as Record<string, string | number | null | undefined>)[key]);

        return [...filtered].sort((a, b) => {
            const va = accessor(a, sort.key);
            const vb = accessor(b, sort.key);
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;

            let cmp: number;
            if (typeof va === 'number' && typeof vb === 'number') {
                cmp = va - vb;
            } else {
                cmp = String(va).localeCompare(String(vb), 'es', {
                    numeric: true,
                    sensitivity: 'base',
                });
            }
            return sort.dir === 'asc' ? cmp : -cmp;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, sort]);

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const pageItems = useMemo(
        () => sorted.slice((safePage - 1) * perPage, safePage * perPage),
        [sorted, safePage, perPage],
    );

    const toggleSort = (key: string) => {
        setSort((prev) => {
            if (prev?.key !== key) return { key, dir: 'asc' };
            if (prev.dir === 'asc') return { key, dir: 'desc' };
            return null;
        });
        setPage(1);
    };

    const setSearchAndReset = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const setPerPage = (value: number) => {
        setPerPageState(value);
        setPage(1);
    };

    return {
        search,
        setSearch: setSearchAndReset,
        sort,
        toggleSort,
        page: safePage,
        setPage,
        perPage,
        setPerPage,
        total,
        totalPages,
        pageItems,
    };
}
