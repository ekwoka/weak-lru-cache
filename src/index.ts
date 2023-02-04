import { debounce } from './utils/debounce';

export const WeakLRUCache = <T extends object>() => {
  const cache = new Map<string, Entry<T>>();
  let length = 0;
  let head: Entry<T> | null = null;
  let tail: Entry<T> | null = null;
  let releasedObjects = 0;
  let lastRelease: number;
  const logRelease = debounce((key: string) => {
    console.log([`Released ${releasedObjects} objects from cache`, `Most recently released: ${key}`, lastRelease ? `Time Between Releases: ${((Date.now() - lastRelease) / 1000).toFixed(2)}s` : 'This was the first release'].join('\n'));
    if (!lastRelease) lastRelease = Date.now();
    releasedObjects = 0;
  });
  const registry = new FinalizationRegistry((key: string) => {
    releasedObjects++;
    logRelease(key);
    const entry = cache.get(key);
    if (entry) {
      if (entry.prev) entry.prev.next = entry.next;
      if (entry.next) entry.next.prev = entry.prev;
      if (tail === entry) tail = (entry.next ? entry.next : entry.prev) ?? entry;
      cache.delete(key);
      length--;
    }
  });
  return {
    set: (key: string, value: T) => {
      const oldEntry = cache.get(key);
      if (oldEntry) {
        if (!(oldEntry.value instanceof WeakRef)) length--;
        oldEntry.value = value;
        if (oldEntry.prev) oldEntry.prev.next = oldEntry.next;
        if (oldEntry.next) oldEntry.next.prev = oldEntry.prev;
        if (tail === oldEntry) tail = (oldEntry.next ? oldEntry.next : oldEntry.prev) ?? oldEntry;
        if (!head) head = oldEntry;
        else {
          oldEntry.next = head;
          head.prev = oldEntry;
          head = oldEntry;
          oldEntry.prev = null;
          length++;
        }
      } else {
        const entry: Entry<T> = { key, value, next: head, prev: null };
        if (head) head.prev = entry;
        head = entry;
        if (!tail) tail = entry;
        cache.set(key, entry);
        length++;
      }
      if (length > 1000) {
        if (!(tail.value instanceof WeakRef)) {
          registry.register(tail.value, tail.key, tail.value);
          tail.value = new WeakRef(tail.value);
        }
        tail = tail.prev;
        length--;
      }
    },
    get: (key: string) => {
      const entry = cache.get(key);
      if (entry) {
        if (entry.value instanceof WeakRef) entry.value = entry.value.deref();
        registry.unregister(entry.value);
        if (entry.prev) entry.prev.next = entry.next;
        if (entry.next) entry.next.prev = entry.prev;
        if (tail === entry) tail = (entry.next ? entry.next : entry.prev) ?? entry;
        if (!entry.value) return undefined;
        if (!head) head = entry;
        else {
          entry.next = head;
          head.prev = entry;
          head = entry;
          entry.prev = null;
        }
        return entry.value;
      }
      return undefined;
    },
    peek: (key: string) => {
      const entry = cache.get(key);
      if (entry) {
        if (entry.value instanceof WeakRef) return entry.value.deref();
        return entry.value;
      }
      return undefined;
    },
    peekReference: (key: string) => {
      const entry = cache.get(key);
      if (entry) return entry.value;
      return undefined;
    },
    length: () => {
      let length = 0;
      let current = head;
      while (current) if (current) length++, (current = current.next);
      return length;
    }
  };
};

type Entry<T extends object> = {
  value: T | WeakRef<T>;
  next: Entry<T> | null;
  prev: Entry<T> | null;
  key: string;
};
