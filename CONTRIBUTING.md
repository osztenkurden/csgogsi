# Contributing

[← README](README.md)

## Local setup

The published package declares Node.js `>=22.12.0`. Tests run TypeScript source directly through Node's test runner; use Node 24 for the simplest local setup, matching one CI target. Use Bun `1.4.2`, pinned in the `packageManager` field in `package.json`, to install dependencies and run scripts.

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build
```

`bun run test` runs source tests with Node's built-in type stripping; no type-transformation flag is needed.

`typecheck` emits no JavaScript. `build` uses tsdown to produce `dist/index.mjs` and `dist/index.d.mts`. Test execution on the exact minimum Node version is not established by the moving `22.x` CI target.

## Repository map

| Path                                       | Responsibility                                                       |
| :----------------------------------------- | :------------------------------------------------------------------- |
| [tsc/index.ts](tsc/index.ts)               | Public class, digestion, transition detection, and parser state      |
| [tsc/typedEmitter.ts](tsc/typedEmitter.ts) | Typed listener storage and dispatch                                  |
| [tsc/bombsites.ts](tsc/bombsites.ts)       | Built-in site thresholds, map-name normalization, and resolver types |
| [tsc/utils.ts](tsc/utils.ts)               | Player/team/grenade normalization and round ownership helpers        |
| [tsc/csgo.d.ts](tsc/csgo.d.ts)             | Raw GSI contracts                                                    |
| [tsc/parsed.d.ts](tsc/parsed.d.ts)         | Parsed contracts                                                     |
| [tsc/events.d.ts](tsc/events.d.ts)         | Event callbacks and listener typing                                  |
| [tsc/interfaces.d.ts](tsc/interfaces.d.ts) | Internal type barrel and metadata extensions                         |
| [tsc/**tests**](tsc/__tests__)             | Node tests, packet factories, bombsite coordinates                   |
| [.github/workflows](.github/workflows)     | Tests, PR-title validation, releases                                 |
| [docs](docs)                               | API and integration guides                                           |

The emitter in `tsc/typedEmitter.ts` retains the benchmarked storage and dispatch implementation, with explicit constructor assignments replacing TypeScript parameter properties. Its license attribution ships in `ACKNOWLEDGEMENTS`.

## Making a change

For event or parsing changes, add a focused regression test to the existing suite. Build snapshot fixtures with `createGSIPacket`. Transition tests need the packet before the action and the packet that triggers it; include duplicate and missing-field cases when relevant.

Check public declarations and the package-root exports when changing types. Source imports alone do not prove consumers can import the built package. Keep the API guide's runtime caveats synchronized with fixes.

The existing `bun run prettier-format` formats `tsc/*.ts` except the copied emitter; `bun run format` also runs tests. To format documentation explicitly:

```sh
bun run prettier --write README.md CONTRIBUTING.md "docs/*.md"
```

## CI and releases

- Test CI runs typechecking and `bun run test` on Node `22.x` and `24.x`, installing dependencies with `bun install --frozen-lockfile`.
- Use `bun add --dev <package>` to add development dependencies, or `bun install` after editing `package.json`, and commit the updated `bun.lock`. Bun is the repository package manager; keep `bun.lock` as the only dependency lockfile. Both test and release CI use `bun install --frozen-lockfile` to install without changing it.
- PR titles follow Conventional Commit types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`, or `build`.
- Release Please manages versioning and changelog entries. The publishing workflow typechecks, tests, and builds before `npm publish`.

The current PR checks do not build or inspect the packed artifact.
