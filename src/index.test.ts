import { WeakLRUCache } from '.';

describe('Weak LRU Cache', () => {
  it('caches object', () => {
    const cache = WeakLRUCache<{ foo: string }>();
    const obj = { foo: 'bar' };
    cache.set('obj', obj);
    expect(cache.get('obj')).toBe(obj);
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
    expect(cache.length()).toBe(2000);
  });
  it('weakly references old entries', async () => {
    const cache = WeakLRUCache<{ foo: string }>();
    for (let i = 0; i < 2000; i++) cache.set(`obj${i}`, { foo: 'bar' });
    expect(cache.peek('obj0')).toBeDefined();
    expect(cache.peekReference('obj0') instanceof WeakRef).toBe(true);
  });
});
