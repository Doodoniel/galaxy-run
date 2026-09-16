# Validation · Summer reboot · 2026-09-16

- `node scripts/check-content.mjs`: PASS. 12 unique routes, presentation before practice, board in Practice, planet in Production; 6 concept-check cards and 12 practice items with unique correct options; every referenced original image exists; meteor answer ranges are valid.
- `npm run build`: PASS (TypeScript + Vite production build).
- `npm run lint`: exit 0. Non-blocking warnings remain in existing mixed component/helper modules, animation/render code and legacy expressions. No claim of a warning-free codebase.
- Browser: start opens Radio check; wrong presentation answer keeps Next disabled, correct retry enables it; all six model cards progress to practice.
- Browser: checkpoint run with one deliberately wrong answer returns 11/12. Individual scores are Nova 5/6 and Comet 6/6. Replaying the missed item does not change those scores.
- Browser: planet name, two selected words and postcard can be entered; participation button requires intelligibility and a visitor response; award is 2 stars once and becomes disabled. Reload retains name, words, criteria, postcard, reflection and stars.
- Browser: report shows individual reflection and postcard. Both relaxed and timed word rounds terminate after 10 cards with 10/10; relaxed mode has no countdown.
- Browser: 390 × 844 responsive viewport has document width 390 and no controls beyond the right edge. Original desktop artwork and colours visually checked. Viewport override reset after testing.
- Browser console: no error logs during the checked flows.
- Teacher guide: all headings, Russian text, English teacher prompts, answer key and primary-source links render; print and text-download controls are exposed.
- `git diff --quiet HEAD -- public/art`: PASS. All ten original image files unchanged.
- No real learner data used. Browser checks used sample names and an invented postcard.

Limits: no external CEFR/GSE accreditation, no full-course coverage claim, no automatic speaking or writing assessment. Speech synthesis depends on installed browser voices; teacher read-aloud remains available. The teacher-guide print action and final certificate paper output were not physically printed during validation.
