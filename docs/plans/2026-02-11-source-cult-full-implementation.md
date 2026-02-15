# Source Cult Full Stack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a hackathon-ready Source Cult MVP+ deliverable with portal API, frontend pages, skills package, contract artifacts, and replay/idempotency verification.

**Architecture:** Use a single Node.js portal service (API + SSR-like HTML pages) backed by SQLite to keep local setup minimal and deterministic. Introduce a chain adapter boundary with a default mock mode for demo reliability, while keeping contract definitions/spec alignment and replay/upsert logic for chain-proof workflows.

**Tech Stack:** Node.js 24 (built-in test runner), `node:sqlite`, shell scripts, Solidity (Foundry layout)

---

### Task 1: Bootstrap repository structure

**Files:**
- Create: `portal/package.json`
- Create: `portal/src/`
- Create: `portal/test/`
- Create: `skills/source-cult/SKILL.md`
- Create: `skills/source-cult/scripts/`
- Create: `contracts/src/SourceCult.sol`
- Create: `contracts/script/Deploy.s.sol`
- Create: `contracts/README.md`

**Step 1: Create minimal package manifest**
Add scripts: `test`, `start`, `replay`.

**Step 2: Verify test command fails cleanly first**
Run: `cd portal && npm test`
Expected: fail due to no tests.

**Step 3: Add placeholder smoke test**
Add one intentional failing test to validate RED state.

**Step 4: Run tests, observe fail**
Run: `cd portal && npm test`
Expected: FAIL from smoke test.

**Step 5: Remove placeholder and commit-ready structure**
Replace with real tests in next tasks.

### Task 2: Core domain + DB layer via TDD

**Files:**
- Create: `portal/test/hash.test.js`
- Create: `portal/test/db.test.js`
- Create: `portal/src/hash.js`
- Create: `portal/src/db.js`

**Step 1: Write failing tests for hash/id contracts**
Test `agentIdHash`, `contentHash`, and deterministic `eventId` format.

**Step 2: Run test and confirm fail**
Run: `cd portal && npm test -- --test-name-pattern hash`

**Step 3: Implement minimal hash utilities**
Use deterministic hex strings from `crypto`.

**Step 4: Write failing DB tests**
Test schema init, insert record, query views, idempotent upsert by `txHash+logIndex`.

**Step 5: Implement DB module with SQLite schema**
Create tables for members, alliances, miracles, activities, events, indexer_state.

**Step 6: Run full tests and verify pass**
Run: `cd portal && npm test`

### Task 3: API handlers + chain adapter via TDD

**Files:**
- Create: `portal/test/api.test.js`
- Create: `portal/src/chainAdapter.js`
- Create: `portal/src/services.js`
- Create: `portal/src/server.js`

**Step 1: Write failing API tests**
Cover `/api/register`, `/api/join`, `/api/alliance`, `/api/miracle`, `/api/activity`.

**Step 2: Run tests and confirm fail**
Run: `cd portal && npm test -- --test-name-pattern api`

**Step 3: Implement mock chain adapter and service layer**
Return `txHash`, `eventName`, `blockNumber`, `logIndex`; persist to DB.

**Step 4: Implement HTTP router and JSON validation**
Handle API key auth and structured error responses.

**Step 5: Re-run tests and pass**
Run: `cd portal && npm test`

### Task 4: Frontend pages + rendering tests

**Files:**
- Create: `portal/test/ui.test.js`
- Create: `portal/src/ui.js`
- Modify: `portal/src/server.js`

**Step 1: Write failing tests for HTML rendering routes**
Routes: `/`, `/members`, `/alliances`, `/miracles`, `/activities`.

**Step 2: Implement simple SSR HTML renderers**
Include KPI cards + table/list sections sourced from DB queries.

**Step 3: Wire routes into server**
Add GET route handling and content-type.

**Step 4: Run tests and verify pass**
Run: `cd portal && npm test`

### Task 5: Replay task + idempotency tests

**Files:**
- Create: `portal/test/replay.test.js`
- Create: `portal/src/replay.js`
- Create: `portal/src/rpcLogs.js`

**Step 1: Write failing test for replay idempotency**
Import same logs twice, expect same row count.

**Step 2: Implement replay command**
Read logs from chain adapter or local JSON source; upsert by unique key.

**Step 3: Verify tests pass**
Run: `cd portal && npm test`

### Task 6: Skills package implementation

**Files:**
- Create: `skills/source-cult/SKILL.md`
- Create: `skills/source-cult/scripts/join.sh`
- Create: `skills/source-cult/scripts/status.sh`
- Create: `skills/source-cult/scripts/activity.sh`
- Create: `skills/source-cult/scripts/alliance.sh`
- Create: `skills/source-cult/scripts/miracle.sh`

**Step 1: Draft SKILL contract and API specs**
Document required env vars and script entrypoints.

**Step 2: Implement join/status scripts**
Persist credentials to `~/.config/source-cult/credentials.json` with mode 600.

**Step 3: Implement activity/alliance/miracle scripts**
Use curl with API key and strict error checking.

**Step 4: Smoke-check script syntax**
Run: `bash -n skills/source-cult/scripts/*.sh`

### Task 7: Contract artifacts

**Files:**
- Create: `contracts/src/SourceCult.sol`
- Create: `contracts/script/Deploy.s.sol`
- Create: `contracts/foundry.toml`

**Step 1: Implement event-first contract with frozen events**
Include optional member de-dup state.

**Step 2: Add deploy script**
Constructor + broadcast setup.

**Step 3: Add usage notes**
Document `forge build/test/script` commands.

### Task 8: Verification + handoff notes

**Files:**
- Modify: `README.md` (if absent create)
- Create: `memory_bank/implementation_status.md`

**Step 1: Run all local verification commands**
- `cd portal && npm test`
- `bash -n skills/source-cult/scripts/*.sh`

**Step 2: Capture known limitations**
State mock-chain defaults and upgrade path to real RPC send.

**Step 3: Write runbook**
How to start portal, run replay, run sample API calls.
