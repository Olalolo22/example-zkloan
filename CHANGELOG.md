# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed — Compatibility-matrix alignment (2026-07-16)

Audited the repo against the [official compatibility matrix](https://docs.midnight.network/relnotes/support-matrix)
(Preprod column) with every version verified against its primary source (npm registry,
Docker Hub, `compact check`, live docs). Closed the gaps found:

- `@midnight-ntwrk/wallet-sdk`: `1.1.0` → `1.2.0` (published on npm but not tagged
  `latest`, so the exact pin is required)
- `standalone.yml` images: `proof-server` `8.0.3` → `8.1.0`, `indexer-standalone`
  `4.0.1` → `4.3.3`, `midnight-node` `0.22.3` → `1.0.0`
- Compact toolchain pin: `0.31.0` → `0.31.1` (README, CI `compact-version`, agent docs)
- CLI test harness (`src/test/commons.ts`): stale `midnightnetwork/proof-server:4.0.0`
  (old Docker org + tag) → `midnightntwrk/proof-server:8.1.0`; verified 8.1.0 still
  accepts `--network` and emits the Actix log line the testcontainers wait strategy greps
- Faucet links: README and the UI wallet gate now link the Nethermind-hosted
  [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/) (verified live;
  note the server rejects HEAD requests with 403 — probe with GET)

**Infra fixes required by the new images:**
- `standalone.env.example`: indexer-standalone 4.3.x fails to start without SPO-node
  config — added `APP__INFRA__SPO_NODE__URL` and `APP__INFRA__SPO_NODE__BLOCKFROST_ID`
  (dummy value, SPO indexing unused locally)
- `standalone.yml`: removed the proof-server exec healthcheck — the 8.1.x image is
  distroless (no `curl`, no shell); readiness is observable via `GET /version`
- `standalone.yml`: added `restart: on-failure` to the indexer — on a cold start its
  spo-indexer sub-process exits if the node hasn't produced its first block yet
  (`Cannot construct OnlineClientAtBlock`); one retry after the node ticks over succeeds

**Verification:** contract compiles on `compact 0.31.1` (8 circuits) with **61/61**
simulator tests passing; attestation API **10/10**; all four workspaces typecheck,
build, and lint clean. Live standalone stack cold-started from scratch
(node 1.0.0 + indexer-standalone 4.3.3 + proof-server 8.1.0, all healthy) and a
wallet-sdk 1.2.0 genesis wallet synced against it end-to-end
(`isSynced=true`, unshielded + shielded NIGHT balances found).

> **Node ≥ 22 is required at runtime, not just in `engines`.** The wallet SDK's
> shielded sync uses the Iterator Helpers API (`Map.values().map(...)`); on Node 20
> wallet sync fails with the cryptic
> `TypeError: state.pendingOutputs.values.map is not a function` and never reaches
> `isSynced` — on any wallet-sdk 1.x version.

### Removed — unused files

All verified unreferenced before removal:

- `zkloan-credit-scorer-ui/contexts/` — internal notes and a saved HTML page pinned to
  the obsolete 3.0.0-alpha SDK; contradicted the current 4.1.1 stack
- `zkloan-credit-scorer-cli/schema.graphql` — accidental npm prompt dump (2 lines of
  captured terminal output, not a schema)
- `zkloan-credit-scorer-cli/indexer.schema` — orphaned GraphQL introspection dump
- `zkloan-credit-scorer-cli/src/address-utils.ts` — dead module; its only export was
  superseded by `parseUserPublicKeyHex` in `cli.ts`
- `contract/managed/` — stale partial compiler output (CommonJS, single circuit) from an
  older layout; the real tree lives in `contract/src/managed/`
- `.gitignore`: added `.claude/` (local Claude Code settings)

### Changed — Midnight JS 4.0.4 → 4.1.1 migration

Upgraded the whole repo (contract, attestation API, CLI, UI) to the Midnight JS
**4.1.1** SDK, aligned with the [official compatibility matrix](https://docs.midnight.network/relnotes/support-matrix)
and the [4.1.0](https://github.com/midnightntwrk/midnight-js/tree/main/docs/releases/v4.1.0)
/ [4.1.1](https://github.com/midnightntwrk/midnight-js/tree/main/docs/releases/v4.1.1)
release notes.

**Protocol imports now go through the `@midnight-ntwrk/midnight-js-protocol` ACL package** (midnight-js #832).
Direct protocol-package imports in hand-written source were rewritten to the
version-agnostic subpaths:

| Before (4.0.4) | After (4.1.1) |
|---|---|
| `@midnight-ntwrk/compact-runtime` | `@midnight-ntwrk/midnight-js-protocol/compact-runtime` |
| `@midnight-ntwrk/ledger-v8` | `@midnight-ntwrk/midnight-js-protocol/ledger` |
| `@midnight-ntwrk/compact-js` | `@midnight-ntwrk/midnight-js-protocol/compact-js` |

`@midnight-ntwrk/compact-runtime` is retained as a direct dependency because the
compiler-generated contract code (`src/managed/.../contract/index.js`) imports it directly.

**Wallet SDK consolidated under the `@midnight-ntwrk/wallet-sdk` barrel** (v1.1.0). The
CLI's five individual `wallet-sdk-*` subpackage imports (`-hd`, `-facade`, `-shielded`,
`-dust-wallet`, `-unshielded-wallet`) are now a single barrel import. The browser UI keeps
the granular `wallet-sdk-address-format` import to avoid pulling the node wallet stack into
the Vite bundle.

**Dependency version changes:**
- `@midnight-ntwrk/midnight-js-*`: `4.0.4` → `4.1.1`
- Added `@midnight-ntwrk/midnight-js-protocol`: `4.1.1`
- `@midnight-ntwrk/ledger-v8` (now via protocol; `overrides`/`resolutions` pin): `8.0.3` → `8.1.0`
- `@midnight-ntwrk/wallet-sdk`: added `1.1.0` (→ facade 4.0.1, shielded 3.0.1, dust 4.1.0, unshielded 3.1.0, hd 3.0.2)
- `@midnight-ntwrk/wallet-sdk-address-format`: `3.1.0` → `3.1.2`
- Removed direct `@midnight-ntwrk/compact-js` and `@midnight-ntwrk/ledger-v8` deps (now provided by `midnight-js-protocol`)

**Required code changes for the 4.1.x APIs:**
- `tsconfig.json` `moduleResolution` switched from `node` → `bundler` in the contract, CLI,
  and attestation-API packages so TypeScript can resolve the protocol package's `exports`
  subpath map (the UI already used `bundler`).
- `deployContract(...)`: the `args` option is now conditionally typed and must be **omitted**
  when the contract constructor takes no arguments — removed `args: []` from the CLI and UI
  deploy calls.
- Wallet config: every wallet variant's default configuration (shielded / unshielded / dust)
  now requires a `txHistoryStorage`; added one per wallet in the CLI.
- `InMemoryTransactionHistoryStorage` moved to `@midnight-ntwrk/wallet-sdk-abstractions`
  (re-exported by the barrel) and its constructor now requires a schema —
  `new InMemoryTransactionHistoryStorage(WalletEntrySchema)`.

**Verification:** contract compiles (`compact 0.31.0`, 8 circuits) and **61/61** simulator
tests pass; attestation-API **10/10** tests pass; all four workspaces typecheck and lint
clean; CLI builds (`tsc`) and the UI builds (`vite`). The CLI's live wallet/deploy flow
against a devnet + proof server was **not** executed here (requires running infrastructure)
and should be smoke-tested before release.
