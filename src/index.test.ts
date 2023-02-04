import { WeakLRUCache } from '.';

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
    cache.set('obj', obj);
    expect(cache.peek('obj')).toBe(obj);
  });
  it('caches 1000 objects', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 1000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peek('obj999')).toBeDefined();
    expect(cache.length()).toBe(1000);
  });
  it('caches 2000 objects', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 2000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peek('obj999')).toBeDefined();
    expect(cache.peek('obj1999')).toBeDefined();
  });
  it('weakly references old entries', async () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 2000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peekReference('obj0') instanceof WeakRef).toBe(true);
  });
  it('returns total length of cache', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 100; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.length()).toBe(100);
    for (let i = 100; i < 200; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.length()).toBe(200);
  });
  it('properly delinks entries that are repositioned', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 10; i++) cache.set(`obj${i}`, { foo: 'bar' });
    cache.get('obj0');
    expect(cache.length()).toBe(10);
    for (let i = 10; i < 20; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.length()).toBe(20);
  });
  it('handles setting new values to existing entries', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 3; i++) cache.set(`obj${i}`, { foo: 'bar' });
    cache.get('obj0');
    expect(cache.length()).toBe(3);
    for (let i = 0; i < 3; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.length()).toBe(3);
  });
});
