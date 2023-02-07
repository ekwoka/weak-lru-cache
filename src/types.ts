export type Entry<T extends object> = {
  value: T | WeakRef<T>;
  next: Entry<T> | null;
  prev: Entry<T> | null;
  key: string;
};

export type LRUCacheOptions = Partial<{
  size: number;
}>;
