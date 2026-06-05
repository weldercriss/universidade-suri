import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/api";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function clearApiCache() {
  cache.clear();
}

export function useCachedRequest<T>(
  url: string | null,
  ttlSeconds: number,
) {
  const getInitialData = (): T | null => {
    if (!url) return null;
    const entry = cache.get(url) as CacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < ttlSeconds * 1000) {
      return entry.data;
    }
    return null;
  };

  const [data, setData] = useState<T | null>(getInitialData);
  const [loading, setLoading] = useState<boolean>(!getInitialData());
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!url) return;

    if (!force) {
      const entry = cache.get(url) as CacheEntry<T> | undefined;
      if (entry && Date.now() - entry.timestamp < ttlSeconds * 1000) {
        if (mountedRef.current) {
          setData(entry.data);
          setLoading(false);
        }
        return;
      }
    } else {
      cache.delete(url);
    }

    if (mountedRef.current) setLoading(true);
    try {
      const result = await apiRequest<T>(url);
      cache.set(url, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) setError(e as Error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url, ttlSeconds]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  return { data, loading, error, refetch };
}
