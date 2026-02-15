import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('next frontend scaffold exists with tailwind config', () => {
  assert.equal(existsSync('package.json'), true);
  assert.equal(existsSync('app/page.tsx'), true);
  assert.equal(existsSync('app/globals.css'), true);

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(pkg.dependencies.next);
  assert.ok(pkg.dependencies.tailwindcss || pkg.devDependencies?.tailwindcss);

  const css = readFileSync('app/globals.css', 'utf8');
  assert.match(css, /@tailwind base;/);
  assert.match(css, /@tailwind components;/);
  assert.match(css, /@tailwind utilities;/);
});
