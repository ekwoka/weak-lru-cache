import { Entry, LRUCacheOptions } from './types';
export type Expirer<T extends object> = ReturnType<typeof Expirer<T>>;
export const Expirer = <T extends object>(
  cache: Map<string, Entry<T>>,
  options: LRUCacheOptions<T>
) => {
  let length = 0;
  let head: Entry<T> | null = null;
  let tail: Entry<T> | null = null;
  const remove = (entry: Entry<T>) => {
    if (entry.timeout) clearTimeout(entry.timeout);
    if (!entry.prev && !entry.next) return entry;
    if (entry.prev) entry.prev.next = entry.next;
    if (entry.next) entry.next.prev = entry.prev;
    if (tail === entry) tail = entry.next ?? entry.prev;
    if (head === entry) head = entry.next;
    entry.prev = null;
    entry.next = null;
    length--;
    return entry;
  };
  const registry = new FinalizationRegistry(
    (key: string) => cache.has(key) && cache.delete(remove(cache.get(key)).key)
  );
  const expireEntry = (entry: Entry<T>) => {
    registry.register(entry.value, entry.key);
    if (!(entry.value instanceof WeakRef))
      entry.value = new WeakRef(entry.value);
    remove(entry);
  };
  const prune = () => {
    if (length <= (options.size ?? 1000)) return;
    expireEntry(tail);
  };
  return {
    add: (entry: Entry<T>) => {
      registry.register(entry.value, `entry: ${entry.key}`);
      if (entry.value instanceof WeakRef) entry.value = entry.value.deref();
      if (head) {
        entry.next = head;
        head.prev = entry;
      }
      head = entry;
      if (!tail) tail = entry;
      length++;
      if (options.maxAge)
        entry.timeout = setTimeout(expireEntry, options.maxAge, entry);
      prune();
      return entry;
    },
    remove,
  };
};
