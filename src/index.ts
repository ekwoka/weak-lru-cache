import { Expirer } from './expirer';
import { Entry, LRUCacheOptions } from './types';

export type WeakLRUCache<T extends object> = {
  set: (key: string, value: T) => WeakLRUCache<T>;
  get: (key: string) => T;
  peek: (key: string) => T;
  peekReference: (key: string) => T | WeakRef<T>;
  has: (key: string) => boolean;
  delete: (key: string) => boolean;
  clear: () => void;
  keys: () => IterableIterator<string>;
  values: () => IterableIterator<T>;
  entries: () => IterableIterator<[string, T]>;
  [Symbol.iterator]: () => IterableIterator<[string, T]>;
  size: number;
  forEach: (
    cb: (value: T, key: string, cache: WeakLRUCache<T>) => void
  ) => void;
};

export const WeakLRUCache = <T extends object>(
  options: LRUCacheOptions<T> = {}
): WeakLRUCache<T> => {
  const cache = new Map<string, Entry<T>>();
  const expirer = Expirer<T>(cache, options);
  const weakLRUCache: WeakLRUCache<T> = {
    set: (key: string, value: T): WeakLRUCache<T> => {
      const entry = cache.get(key) ?? {
        key,
        value,
        next: null,
        prev: null,
        size: 1,
      };
      entry.value = value;
      entry.size = options.getSize?.(value) ?? 1;
      cache.set(key, entry);
      expirer.add(expirer.remove(entry)).value as T;
      return weakLRUCache;
    },
    get: (key: string): T => {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (entry.value instanceof WeakRef) entry.value = entry.value.deref();
      if (!entry.value)
        return cache.delete(expirer.remove(entry).key), undefined;
      return expirer.add(expirer.remove(entry)).value as T;
    },
    peek: (key: string): T => {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (
        !entry.value ||
        (entry.value instanceof WeakRef && !entry.value.deref())
      )
        return cache.delete(expirer.remove(entry).key), undefined;
      if (entry.value instanceof WeakRef) return entry.value.deref();
      return entry.value;
    },
    peekReference: (key: string): T | WeakRef<T> => cache.get(key)?.value,
    has: (key: string): boolean => cache.has(key),
    delete: (key: string): boolean =>
      cache.has(key) ? cache.delete(expirer.remove(cache.get(key)).key) : false,
    clear: (): void => (cache.forEach(expirer.remove), cache.clear()),
    keys: (): IterableIterator<string> => iterateCache(cache, expirer, 0),
    values: (): IterableIterator<T> => iterateCache(cache, expirer, 1),
    entries: (): IterableIterator<[string, T]> => iterateCache(cache, expirer),
    [Symbol.iterator]: (): IterableIterator<[string, T]> =>
      iterateCache(cache, expirer),
    get size() {
      return cache.size;
    },
    forEach: (cb) => {
      for (const [key, value] of iterateCache(cache, expirer))
        cb(value, key, weakLRUCache);
    },
  };
  return weakLRUCache;
};

function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 0
): IterableIterator<string>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 1
): IterableIterator<T>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode?: 2
): IterableIterator<[string, T]>;
function* iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 0 | 1 | 2 = 2
): IterableIterator<[string, T] | string | T> {
  for (const [key, entry] of cache.entries()) {
    const value =
      entry.value instanceof WeakRef ? entry.value.deref() : entry.value;
    if (!value) {
      cache.delete(expirer.remove(entry).key);
      continue;
    }
    if (mode === 0) yield key;
    else if (mode === 1) yield value;
    else yield [key, value];
  }
}

export default WeakLRUCache;
