import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { RECALL, PRACTICE } from '../src/data/bridge.ts';
import { PHASES, ALL_ACTIVITIES, nextActivity, phaseOf } from '../src/data/lesson.ts';
import { WORDS, METEOR_CARDS } from '../src/data/content.ts';

assert.equal(new Set(ALL_ACTIVITIES).size, ALL_ACTIVITIES.length, 'Routes must be unique');
assert.equal(nextActivity('crew'), 'warmup');
assert.equal(phaseOf('recall').id, 'presentation');
assert.equal(phaseOf('reboot').id, 'practice');
assert.equal(phaseOf('run').id, 'practice');
assert.equal(phaseOf('planet').id, 'production');
assert(ALL_ACTIVITIES.indexOf('recall') < ALL_ACTIVITIES.indexOf('reboot'));
assert.equal(PHASES.length, 5);
for (const card of [...RECALL, ...PRACTICE]) {
  assert.equal(card.options.filter(o => o === card.answer).length, 1, `Exactly one correct option: ${card.id}`);
  assert.equal(new Set(card.options).size, card.options.length, `No duplicate options: ${card.id}`);
}
for (const q of PRACTICE) assert(RECALL.some(r => r.id === q.topic), `Taught before practice: ${q.id}`);
for (const card of [...RECALL, ...WORDS]) assert(existsSync(`public/art/${card.image}.webp`), `Artwork exists: ${card.image}`);
for (const card of METEOR_CARDS) {
  assert(card.wrong[0] >= 0 && card.wrong[1] < card.tokens.length);
  assert(!card.distractors.includes(card.fix));
}
console.log(`PASS: ${ALL_ACTIVITIES.length} routes, ${RECALL.length} presentation cards, ${PRACTICE.length} questions, original artwork references and meteor answer integrity.`);
