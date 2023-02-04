# A simple Weak Reference Least Recently Used Cache

[<img src="https://img.shields.io/npm/v/@ekwoka/weak-lru-cache?label=%20&style=for-the-badge&logo=pnpm&logoColor=white">](https://www.npmjs.com/package/@ekwoka/weak-lru-cache)
<img src="https://img.shields.io/npm/types/@ekwoka/weak-lru-cache?label=%20&logo=typescript&logoColor=white&style=for-the-badge">
<img src="https://img.shields.io/npm/dt/@ekwoka/weak-lru-cache?style=for-the-badge&logo=npm&logoColor=white" >
[<img src="https://img.shields.io/bundlephobia/minzip/@ekwoka/weak-lru-cache?style=for-the-badge&logo=esbuild&logoColor=white">](https://bundlephobia.com/package/@ekwoka/weak-lru-cache)
<img src="https://img.shields.io/badge/coverage-99%25-success?style=for-the-badge&logo=vitest&logoColor=white" alt="99% test coverage">

This cache allows for items to be stored and maintained while in use, but also allowing for unused items to be garbage collected after they have been sufficiently pushed out by more recently used items.
