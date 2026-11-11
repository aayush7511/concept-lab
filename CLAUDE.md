# Concept Lab — lesson authoring rules

## One nanoconcept per lesson
Every lesson teaches exactly **one** idea, small enough to state in a single sentence. Never chain several concepts into one lesson.

- **Bad:** "Classes, main & printing" (three ideas: what a class is, the main entry point, println and string joining).
- **Good:** three lessons: "What `main` is", "`println` prints one line", "`+` joins text left to right".
- Test: if the title needs "&", "and", or a comma, split it.

## Write Learn for a beginner
Reference lesson: `classes` ("new builds an object from a class") in `courses/java-spring/lessons-basics.mjs`. Match its voice and structure.

- Learn is read in about 3–4 minutes: overview + 2–3 goals + 2–3 sections + a step-by-step walkthrough. Stay on this lesson's one idea; no side tours ("in CometCarpool…" is one sentence, not a section).
- Every bullet is a full explanation in plain sentences, not a fragment. Say what the thing is, then why it matters.
- Define every term the first time it appears (field, parameter, constructor, annotation, bean…), in simple words. Don't assume anything not taught in an earlier lesson.
- Explain each piece of syntax in the snippet: keywords, symbols, `this.`, annotations, generics. Comment the snippet's lines.
- `walkthrough`: trace one concrete run of the idea, 4–8 steps, each showing the code and what the program or framework holds or does at that moment, with real values.
- Misconception and takeaway each cover only this lesson's idea.

## Go deeper (optional layer)
Every lesson gets a `deeper` list (3–5 topics), rendered collapsed under "Go deeper". This is where depth lives, so the main Learn stays readable:
- What happens under the hood (JVM, compiler, Spring internals).
- The common bug and the exact error or behavior it produces.
- Edge cases and default behavior.
- Links forward or back to other lessons by title.
- Practical context (e.g. why JPA needs an empty constructor).

Field limits are enforced by `validateLearn` in `public/learn.js` (points ≤240 chars, walkthrough steps ≤280, deeper paragraphs ≤420). After editing lessons, bump `javaVersion` in `courses/java-spring/index.mjs` so saved data reseeds, and run `node --test`.

## Stages stay on the same idea
Predict, Modify, and Practice all exercise the lesson's single idea. They differ in scenario, not in concept. Don't sneak in syntax that hasn't been taught yet. If an exercise needs it, that's a missing prerequisite lesson.

## More lessons, not longer lessons
Splitting a big topic into many nanoconcept lessons is expected. A ticket can map to 10+ tiny lessons. Order them so each one builds on the one before.
