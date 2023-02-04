export const WeakLRUCache = <T extends object>() => {
  const cache = new Map<string, Entry<T>>();
  const expirer = Expirer<T>(cache);
  return {
    set: (key: string, value: T) => {
      const entry = cache.get(key) ?? { key, value, next: null, prev: null };
      entry.value = value;
      cache.set(key, entry);
      return expirer.add(expirer.remove(entry));
    },
    get: (key: string) => {
      const entry = cache.get(key);
      if (!entry) return undefined;
      if (entry.value instanceof WeakRef) entry.value = entry.value.deref();
      if (!entry.value)
        return cache.delete(expirer.remove(entry).key), undefined;
      return expirer.add(expirer.remove(entry)).value;
    },
    has: (key: string) => cache.has(key),
    delete: (key: string) =>
      cache.has(key) ? cache.delete(expirer.remove(cache.get(key)).key) : false,
    peek: (key: string) => {
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
    peekReference: (key: string) => cache.get(key)?.value,
  };
};

export default WeakLRUCache;

const Expirer = <T extends object>(cache: Map<string, Entry<T>>) => {
  let length = 0;
  let head: Entry<T> | null = null;
  let tail: Entry<T> | null = null;
  const remove = (entry: Entry<T>) => {
    if (!entry.prev && !entry.next) return entry;
    if (entry.prev) entry.prev.next = entry.next;
    if (entry.next) entry.next.prev = entry.prev;
    if (tail === entry) tail = entry.next ?? entry.prev ?? null;
    if (head === entry) head = entry.next ?? null;
    entry.prev = null;
    entry.next = null;
    length--;
    return entry;
  };
  const registry = new FinalizationRegistry(
    (key: string) => cache.has(key) && cache.delete(remove(cache.get(key)).key)
  );
  const prune = () => {
    if (length <= 1000) return;
    registry.register(tail.value, tail.key);
    if (!(tail.value instanceof WeakRef)) tail.value = new WeakRef(tail.value);
    remove(tail);
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
      prune();
      return entry;
    },
    remove,
    head: () => head,
  };
};

type Entry<T extends object> = {
  value: T | WeakRef<T>;
  next: Entry<T> | null;
  prev: Entry<T> | null;
  key: string;
};
