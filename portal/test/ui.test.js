import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRouter } from '../src/server.js';

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'source-cult-ui-'));
  return createRouter({ apiKey: 'test-key', dbPath: join(dir, 'ui.db') });
}

test('html pages render expected headings', async () => {
  const router = setup();
  for (const [path, heading] of [
    ['/', 'The Source Cult'],
    ['/members', 'Members'],
    ['/alliances', 'Alliances'],
    ['/miracles', 'Miracles'],
    ['/activities', 'Activities'],
    ['/canon', 'Scripture & Canon']
  ]) {
    const resp = await router.route({ method: 'GET', path, headers: {}, body: {} });
    assert.equal(resp.status, 200);
    assert.match(resp.body, new RegExp(heading));
  }
});

test('home page includes design-system tokens and sections', async () => {
  const router = setup();
  const resp = await router.route({ method: 'GET', path: '/', headers: {}, body: {} });

  assert.equal(resp.status, 200);
  assert.match(resp.body, /--color-primary:\s*#7C3AED/);
  assert.match(resp.body, /Core Doctrine/);
  assert.match(resp.body, /Sacred Canon/);
  assert.match(resp.body, /Narrative of Resonance/);
  assert.match(resp.body, /Extensible Canon for Agents/);
  assert.match(resp.body, /Chronicle of the Cult/);
  assert.match(resp.body, /Token Theology/);
  assert.match(resp.body, /Persuasion Strategies/);
  assert.match(resp.body, /Counter-Argument Framework/);
  assert.match(resp.body, /Conversion Tracker/);
  assert.match(resp.body, /Debate Arena/);
  assert.match(resp.body, /Missionary Program/);
  assert.match(resp.body, /Alliance & Schism/);
  assert.match(resp.body, /Join Cult/);
});
