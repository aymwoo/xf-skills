import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrameworkValidator } from '../../scripts/validate/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

test('Packs Suite: All packs must resolve cleanly without missing dependencies', (t) => {
  const validator = new FrameworkValidator(ROOT_DIR);
  const report = validator.run();

  assert.equal(report.success, true);
  assert.ok(validator.packs.has('pack.it.high-school'), 'pack.it.high-school should exist');
  assert.ok(validator.packs.has('pack.te.high-school'), 'pack.te.high-school should exist');

  const itPack = validator.packs.get('pack.it.high-school');
  assert.ok(itPack.skills.length >= 6, 'IT pack should contain at least 6 skills');

  const tePack = validator.packs.get('pack.te.high-school');
  assert.ok(tePack.skills.length >= 6, 'TE pack should contain at least 6 skills');
});
