import type { LRUCacheOptions } from './types';

export class Expirer<T extends object> {
  size = 0;
  head: Entry<T> | null = null;
  tail: Entry<T> | null = null;
  registry: FinalizationRegistry<string> = new FinalizationRegistry(
    (key: string) =>
      this.cache.has(key) &&
      this.cache.delete(this.remove(this.cache.get(key)).key),
  );

  constructor(
    public cache: Map<string, Entry<T>>,
    public options: LRUCacheOptions<T>,
  ) {}
  add(entry: Entry<T>) {
    this.registry.register(entry.value, `entry: ${entry.key}`);
    entry.strengthen().setNext(this.head?.setPrev(entry));
    this.head = entry;
    if (!this.tail) this.tail = entry;
    this.size += entry.size;
    entry.clearTimeout();
    if (this.options.maxAge)
      entry.timeout = setTimeout(
        this.expireEntry.bind(this),
        this.options.maxAge,
        entry,
      );
    this.prune();
    return entry;
  }
  remove(entry: Entry<T>) {
    entry.clearTimeout();
    if (entry.disconnected) return entry;
    if (this.tail === entry) this.tail = entry.next ?? entry.prev;
    if (this.head === entry) this.head = entry.next;
    this.size -= entry.size;
    return entry.remove();
  }
  reset(entry: Entry<T>) {
    return this.add(this.remove(entry));
  }
  prune() {
    if (this.size <= (this.options.size ?? 1000)) return;
    this.expireEntry(this.tail);
  }
  expireEntry(entry: Entry<T>) {
    this.registry.register(entry.value, entry.key);
    entry.weaken();
    this.remove(entry);
    return this;
  }
}

export class Entry<T extends object> {
  next: Entry<T> | null;
  prev: Entry<T> | null;
  timeout: number | NodeJS.Timeout | null = null;
  constructor(
    public value: T | WeakRef<T>,
    public key: string,
    public size: number,
  ) {}
  setNext(next: Entry<T> | null) {
    this.next = next;
    return this;
  }
  setPrev(prev: Entry<T> | null) {
    this.prev = prev;
    return this;
  }
  remove() {
    if (this.timeout) clearTimeout(this.timeout);
    this.prev?.setNext(this.next);
    this.next?.setPrev(this.prev);
    return this.disconnect();
  }
  clearTimeout() {
    clearTimeout(this.timeout);
  }
  disconnect() {
    this.prev = null;
    this.next = null;
    return this;
  }
  get disconnected() {
    return !this.prev && !this.next;
  }
  weaken() {
    if (!(this.value instanceof WeakRef)) this.value = new WeakRef(this.value);
    return this;
  }
  strengthen() {
    if (this.value instanceof WeakRef) this.value = this.value.deref();
    return this;
  }
}
