# Contributing

Start with `npm run doctor`, then `npm test`. No live OpenAI requests are needed
for the test suite. Use your own account only when intentionally testing AI.

Keep changes focused and include reproduction steps for bugs. For lesson
changes, check that examples and predictions differ, both reference answers
pass, and unfinished starters fail meaningful tests. Avoid teaching syntax that
has not yet been introduced by a prerequisite.

Never commit `.local/`, `.env` files, credentials, imported personal projects,
chat transcripts, or progress. Submit code and synthetic test cases instead.
Retain third-party notices when modifying bundled runtime sources.

The runner currently targets macOS. New platforms need equivalent isolation;
do not add an unrestricted execution fallback. See SECURITY.md for reporting
credential or runner vulnerabilities.
