import { WeakLRUCache } from '.';

describe('Map API', () => {
  it('can set', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.set('foo', { foo: 'bar' })).toBe(cache);
    expect(cache.has('foo')).toBe(true);
  });
  it('can get', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.get('foo')).toBeUndefined();
    cache.set('foo', { foo: 'bar' });
    expect(cache.get('foo')).toEqual({ foo: 'bar' });
  });
  it('can check if has', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.has('foo')).toBe(false);
    cache.set('foo', { foo: 'bar' });
    expect(cache.has('foo')).toBe(true);
  });
  it('can delete', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    expect(cache.has('foo')).toBe(true);
    expect(cache.delete('foo')).toBe(true);
    expect(cache.has('foo')).toBe(false);
    expect(cache.delete('foo')).toBe(false);
  });
  it('can clear', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    expect(cache.has('foo')).toBe(true);
    cache.clear();
    expect(cache.has('foo')).toBe(false);
  });
  it('can return keys', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    expect([...cache.keys()]).toEqual(['foo']);
  });
  it('can return values', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    expect([...cache.values()]).toEqual([{ foo: 'bar' }]);
  });
  it('can return entries', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    expect([...cache.entries()]).toEqual([['foo', { foo: 'bar' }]]);
  });
  it('can iterate', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    const entries: [string, { foo: string }][] = [];
    for (const entry of cache) entries.push(entry);
    expect(entries).toEqual([['foo', { foo: 'bar' }]]);
  });
  it('can return size', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.size).toBe(0);
    cache.set('foo', { foo: 'bar' });
    expect(cache.size).toBe(1);
  });
  it('can loop over forEach', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    cache.set('foo', { foo: 'bar' });
    const entries: [string, { foo: string }][] = [];
    cache.forEach((value, key) => entries.push([key, value]));
    expect(entries).toEqual([['foo', { foo: 'bar' }]]);
  });
});

describe('Weak LRU Cache', () => {
  it('caches object', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    expect(cache.get('obj')).toBe(obj);
  });
  it('returns undefined for non-existent keys', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.get('obj')).toBeUndefined();
  });
  it('peeks objects', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    expect(cache.peek('obj')).toBeUndefined();
    cache.set('obj', obj);
    expect(cache.peek('obj')).toBe(obj);
  });
  it('caches 1000 objects', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 1000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peek('obj999')).toBeDefined();
  });
  it('caches 2000 objects', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 2000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peek('obj999')).toBeDefined();
    expect(cache.peek('obj1999')).toBeDefined();
  });
  it('weakly references old entries', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 2000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peekReference('obj0') instanceof WeakRef).toBe(true);
  });
  it('can reset values', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    expect(cache.get('obj')).toBe(obj);
    cache.set('obj', { foo: 'baz' });
    expect(cache.get('obj')).not.toBe(obj);
  });
  it('can delete values', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    expect(cache.get('obj')).toBe(obj);
    expect(cache.delete('obj')).toBe(true);
    expect(cache.get('obj')).toBeUndefined();
    expect(cache.delete('obj')).toBe(false);
  });
  it('can tell if it has a value', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    expect(cache.has('obj')).toBe(false);
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    expect(cache.has('obj')).toBe(true);
  });
  it('handles reusing expired cache items', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    for (let i = 0; i < 1000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.get('obj')).toBe(obj);
  });
  it('handles repositioning first and last items', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 3; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.delete('obj2')).toBe(true);
    expect(cache.delete('obj0')).toBe(true);
  });
  it('handles weakrefs', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', new WeakRef(obj) as unknown as { foo: string });
    expect(cache.get('obj')).toBe(obj);
    expect(cache.peekReference('obj') instanceof WeakRef).toBe(false);
  });
  it('accepts size option', () => {
    const cache = WeakLRUCache<{ foo: string }>({ size: 2 });
    for (let i = 0; i < 3; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peekReference('obj0') instanceof WeakRef).toBe(true);
  });
});
