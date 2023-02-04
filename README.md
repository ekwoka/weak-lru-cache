# A simple Weak Reference Least Recently Used Cache

[<img src="https://img.shields.io/npm/v/@ekwoka/weak-lru-cache?label=%20&style=for-the-badge&logo=pnpm&logoColor=white">](https://www.npmjs.com/package/@ekwoka/weak-lru-cache)
<img src="https://img.shields.io/npm/types/@ekwoka/weak-lru-cache?label=%20&logo=typescript&logoColor=white&style=for-the-badge">
<img src="https://img.shields.io/npm/dt/@ekwoka/weak-lru-cache?style=for-the-badge&logo=npm&logoColor=white" >
[<img src="https://img.shields.io/bundlephobia/minzip/@ekwoka/weak-lru-cache?style=for-the-badge&logo=esbuild&logoColor=white">](https://bundlephobia.com/package/@ekwoka/weak-lru-cache)
<img src="https://img.shields.io/badge/coverage-99%25-success?style=for-the-badge&logo=vitest&logoColor=white" alt="99% test coverage">

This cache allows for items to be stored and maintained while in use, but also allowing for unused items to be garbage collected after they have been sufficiently pushed out by more recently used items.

## Installation

```bash
pnpm add @ekwoka/weak-lru-cache
```

## Usage

```ts
import WeakLRUCache from '@ekwoka/weak-lru-cache';
// or
import { WeakLRUCache } from '@ekwoka/weak-lru-cache';

const cache = WeakLRUCache<CrazyObjectType>();

cache.set('key', crazyObject);
cache.get('key'); // => crazyObject
```

## What is a Weak LRU Cache?

A Weak LRU Cache is a cache based on the 'Least Recently Used' caching strategy, where cached items are put into a queue, and once they progress out of the queue (like having more items than the cache allows), they are discarged. However, if the item is accessed again while in the cache, it is moved back to the start of the queue, where it can earn some more time to live.

Where the Weak LRU differs is that it uses Weak References to hold items after they have exited the queue. Weak References allow the object to be accessed if needed, but also allow the normal garbage collection system to clean them up if they've become truly unreferenced. This means that if you application is still using the item, even if it has become very old, it will still exist in the cache to be reaccessed by other parts of the application, but once the rest of the application is done with it, it will likely be garbage collected.

## API

The goal is to have the API be nearly identical to that of the native `Map` object, except with the different constructor signature, as well as some unique methods that fit with the goal of the cache.

### `WeakLRUCache<T>(options?: WeakLRUCacheOptions)`

This function creates the cache object. It accepts the optional argument of cache options, as well a generic type that types the items stored within the cache. The options are as follows:

- `size?: number` - The maximum number of items that can be stored in the cache. If this is not provided, the cache will be defaulted to 1000 items. As mentioned, this is a soft limit, and more items may be kept in the cache so long as they are still being used.

### `.set(key: string, value: T)`

Rather straightforward, this method sets the value of the key in the cache. If the key already exists, it will be overwritten, and moved to the front of the queue. If this causes the cache to exceed the size limit, the oldest item will be replaced with a `WeakRef` to the value and await cleanup.

```ts
cache.set('key', { foo: 'bar' });
```

### `.get(key: string)`

This method returns the value of the key in the cache, if it exists. If the value is a `WeakRef`, it will be dereferenced and returned. If the value is not found, `undefined` will be returned. If they key is found, it will be moved to the front of the queue. If the value was await garbage collection (from being outside the size of the cache queue), it will be strong referenced and moved back to the front of the queue.

```ts
cache.get('key'); // => { foo: 'bar' }
```

### `.peek(key: string)`

This is a unique method for this cache that does not exist on the `Map`. This is very similar to the `.get` method, except that it will not move the key to the front of the queue or strongly reference any accessed data. This likely has little benefit in most cases, but does allow you to retrieve a value from the cache without affecting the cache's internal state.

```ts
cache.peek('key'); // => { foo: 'bar' }
```

### `.has(key: string)`

This method returns a boolean indicating if the key exists in the cache. This will not move the key to the front of the queue, or strongly reference any accessed data. One factor of note is that it is possible for this method to return `true` even if the value has been garbage collected, as this is evaluated lazily.

```ts
cache.has('key'); // => true
```

### `.delete(key: string)`

This method deletes the key from the cache, regardless of it's position in the queue or reference status. This will return a boolean indicating if the key was found and deleted.

```ts
cache.delete('key'); // => true
```

### Others incoming
