import { Expirer } from './expirer';
import { Entry, LRUCacheOptions } from './types';

export class WeakLRUCache<T extends object> implements Map<string, T> {
  [Symbol.toStringTag]: 'WeakLRUCache';
  public cache: Map<string, Entry<T>> = new Map();
  public expirer: Expirer<T>;
  constructor(public options: LRUCacheOptions<T> = {}) {
    this.expirer = Expirer(this.cache, this.options);
  }
  set(key: string, value: T): this {
    const entry = this.cache.get(key) ?? {
      key,
      value,
      next: null,
      prev: null,
      size: 1,
    };
    entry.value = value;
    entry.size = this.options.getSize?.(value) ?? 1;
    this.cache.set(key, entry);
    this.expirer.add(this.expirer.remove(entry)).value as T;
    return this;
  }
  get(key: string): T {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.value instanceof WeakRef) entry.value = entry.value.deref();
    if (!entry.value)
      return this.cache.delete(this.expirer.remove(entry).key), undefined;
    return this.expirer.add(this.expirer.remove(entry)).value as T;
  }
  peek(key: string): T {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (
      !entry.value ||
      (entry.value instanceof WeakRef && !entry.value.deref())
    )
      return this.cache.delete(this.expirer.remove(entry).key), undefined;
    if (entry.value instanceof WeakRef) return entry.value.deref();
    return entry.value;
  }
  peekReference(key: string): T | WeakRef<T> {
    return this.cache.get(key)?.value;
  }
  has(key: string): boolean {
    return this.cache.has(key);
  }
  delete(key: string): boolean {
    return this.cache.has(key)
      ? this.cache.delete(this.expirer.remove(this.cache.get(key)).key)
      : false;
  }
  clear(): void {
    this.cache.forEach(this.expirer.remove);
    this.cache.clear();
  }
  keys(): IterableIterator<string> {
    return iterateCache(this.cache, this.expirer, 0);
  }
  values(): IterableIterator<T> {
    return iterateCache(this.cache, this.expirer, 1);
  }
  entries(): IterableIterator<[string, T]> {
    return iterateCache(this.cache, this.expirer);
  }
  [Symbol.iterator](): IterableIterator<[string, T]> {
    return iterateCache(this.cache, this.expirer);
  }
  get size() {
    return this.cache.size;
  }
  forEach(cb: (value: T, key: string, cache: this) => void) {
    for (const [key, value] of iterateCache(this.cache, this.expirer))
      cb(value, key, this);
  }
}

function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 0,
): IterableIterator<string>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 1,
): IterableIterator<T>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode?: 2,
): IterableIterator<[string, T]>;
function* iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: 0 | 1 | 2 = 2,
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
