import { useCallback, useEffect, useState, type DependencyList } from 'react';

type AsyncState<T> = {
    data: T | undefined;
    loading: boolean;
    error: string | null;
};

/**
 * Loads data and keeps loading / error state.
 * - `loading` is true on the first load and whenever `deps` change
 * - `reload()` refreshes the data silently (no skeleton flash after saving)
 * - `setData()` updates the data locally (optimistic updates)
 */
export const useAsyncData = <T,>(loader: () => Promise<T>, deps: DependencyList = []) => {
    const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: null });
    const [reloadCount, setReloadCount] = useState(0);

    // Show the loading state again when the input changes (adjusting state during render)
    const depsKey = JSON.stringify(deps);
    const [loadedKey, setLoadedKey] = useState(depsKey);
    if (loadedKey !== depsKey) {
        setLoadedKey(depsKey);
        setState((current) => ({ ...current, loading: true, error: null }));
    }

    useEffect(() => {
        let cancelled = false;

        loader()
            .then((data) => {
                if (!cancelled) setState({ data, loading: false, error: null });
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState((current) => ({
                        ...current,
                        loading: false,
                        error: (error as Error)?.message || 'Data se nepodařilo načíst',
                    }));
                }
            });

        return () => {
            cancelled = true;
        };
        // The loader is recreated on every render - deps decide when to load again
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depsKey, reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);

    const setData = useCallback((update: T | ((current: T | undefined) => T)) => {
        setState((current) => ({
            ...current,
            data: typeof update === 'function' ? (update as (current: T | undefined) => T)(current.data) : update,
        }));
    }, []);

    return { ...state, reload, setData };
};
