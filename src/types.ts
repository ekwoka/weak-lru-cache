export type Entry<T extends object> = {
  value: T | WeakRef<T>;
  next: Entry<T> | null;
  prev: Entry<T> | null;
  key: string;
  timeout?: number | NodeJS.Timeout | null;
  size: number;
};

export type LRUCacheOptions<T> = Partial<{
  size: number;
  maxAge: number;
  getSize: (value: T) => number;
}>;
