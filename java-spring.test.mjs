import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { Runner } from './runner.mjs';
import { runtimePaths } from './runtimes.mjs';
import { validateLesson, validatePlan, publicLesson } from './library.mjs';
import { auditExercises } from './courses/llm/audit.mjs';
import { javaCourse, javaLessons, seedJava, javaVersion } from './courses/java-spring/index.mjs';

const clean = s => s.replace(/\r\n/g, '\n').trim();
const only = process.env.JAVA_LESSON;

test('CometCarpool course plan is valid and every ticket maps to authored lessons', () => {
  validatePlan(javaCourse);
  for (const t of javaCourse.tickets) for (const id of t.conceptIds) assert.ok(javaLessons[id], `${t.id} needs lesson ${id}`);
  for (const c of javaCourse.concepts) assert.ok(javaLessons[c.id], `concept ${c.id} has no lesson`);
  for (const t of javaCourse.tickets) assert.match(javaCourse.spec, new RegExp(`## ${t.id}: `), `spec section for ${t.id}`);
});

test('CometCarpool lessons pass structure validation and the stage-separation audit', () => {
  for (const l of Object.values(javaLessons)) {
    validateLesson(structuredClone(l), 'java', { requireStructured: true, requireProblems: true });
    const pub = publicLesson(structuredClone(l));
    assert.equal(pub.guided.reference, undefined);
    assert.equal(pub.prediction.expected, undefined);
  }
  const findings = auditExercises(javaLessons).findings.filter(f => !/metadata|three specified/.test(f.message));
  assert.deepEqual(findings, []);
});

test('seeding adds the course once and replaces lessons only on version change', () => {
  const data = { projects: [], lessons: {}, progress: {} };
  seedJava(data); seedJava(data);
  assert.equal(data.projects.filter(p => p.id === javaCourse.id).length, 1);
  assert.equal(data.lessons[`${javaCourse.id}:main`].courseVersion, javaVersion);
  data.progress[`${javaCourse.id}:main`] = { drafts: { guided: 'mine' }, passes: { guided: true }, hints: {}, revealed: {} };
  seedJava(data);
  assert.equal(data.progress[`${javaCourse.id}:main`].drafts.guided, 'mine');
});

test('every executable CometCarpool lesson runs: example, prediction, reference passes, starter fails', { skip: !runtimePaths().java && 'No JDK 17+ found', timeout: 600000 }, async () => {
  const runner = new Runner(await mkdtemp(path.join(os.tmpdir(), 'cl-java-')));
  for (const l of Object.values(javaLessons)) {
    if (l.mode === 'conceptual' || (only && l.id !== only)) continue;
    const ex = await runner.run({ language: 'java', code: l.example.code });
    assert.ok(ex.ok, `${l.id} example failed:\n${ex.stderr}`);
    const pr = await runner.run({ language: 'java', code: l.prediction.code });
    assert.ok(pr.ok, `${l.id} prediction failed:\n${pr.stderr}`);
    assert.equal(clean(pr.stdout), clean(l.prediction.expected), `${l.id} prediction output`);
    assert.notEqual(clean(pr.stdout), clean(ex.stdout), `${l.id} prediction must differ from Learn`);
    for (const stage of ['guided', 'practice']) {
      const e = l[stage];
      const ref = await runner.run({ language: 'java', code: e.reference, testCode: e.tests });
      assert.ok(ref.ok, `${l.id} ${stage} reference failed:\n${ref.stdout}\n${ref.stderr}`);
      const ran = await runner.run({ language: 'java', code: e.reference });
      assert.ok(ran.ok, `${l.id} ${stage} reference main failed:\n${ran.stderr}`);
      const st = await runner.run({ language: 'java', code: e.starter, testCode: e.tests });
      assert.ok(!st.ok, `${l.id} ${stage} starter already passes`);
    }
  }
});
