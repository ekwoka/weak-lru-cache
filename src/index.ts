import { Expirer, Entry } from './expirer';
import type { LRUCacheOptions } from './types';

export class WeakLRUCache<T extends object> implements Map<string, T> {
  [Symbol.toStringTag]: 'WeakLRUCache';
  public cache: Map<string, Entry<T>> = new Map();
  public expirer: Expirer<T>;
  constructor(public options: LRUCacheOptions<T> = {}) {
    this.expirer = new Expirer(this.cache, this.options);
  }
  set(key: string, value: T): this {
    const entry = this.cache.get(key) ?? new Entry(value, key, 1);
    entry.value = value;
    entry.size = this.options.getSize?.(value) ?? 1;
    this.cache.set(key, entry);
    this.expirer.reset(entry);
    return this;
  }
  get(key: string): T {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (!entry.strengthen().value)
      return this.cache.delete(this.expirer.remove(entry).key), undefined;
    return this.expirer.reset(entry).value as T;
  }
  peek(key: string): T {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.finalized)
      return this.cache.delete(this.expirer.remove(entry).key), undefined;
    return entry.peek();
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
    return iterateCache(this.cache, this.expirer, IteratorMode.KEYS);
  }
  values(): IterableIterator<T> {
    return iterateCache(this.cache, this.expirer, IteratorMode.VALUES);
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

enum IteratorMode {
  ENTRIES = 0,
  KEYS = 1,
  VALUES = 2,
}

function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: IteratorMode.KEYS,
): IterableIterator<string>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: IteratorMode.VALUES,
): IterableIterator<T>;
function iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode?: IteratorMode.ENTRIES,
): IterableIterator<[string, T]>;
function* iterateCache<T extends object>(
  cache: Map<string, Entry<T>>,
  expirer: Expirer<T>,
  mode: IteratorMode = IteratorMode.ENTRIES,
): IterableIterator<[string, T] | string | T> {
  for (const [key, entry] of cache.entries()) {
    if (entry.finalized) {
      cache.delete(expirer.remove(entry).key);
      continue;
    }
    if (mode === IteratorMode.KEYS) yield key;
    else if (mode === IteratorMode.VALUES) yield entry.peek();
    else yield [key, entry.peek()];
  }
}

export default WeakLRUCache;
