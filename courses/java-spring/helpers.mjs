// Authoring helpers for the CometCarpool Java course. Every lesson they build is
// execution-checked by java-spring.test.mjs: examples run, predictions match, references
// pass, and starters fail.
const indent = (text, n) => text.split('\n').map(line => line ? ' '.repeat(n) + line : line).join('\n');

// A complete Main.java. `types` are top-level helper classes; `statics` are static members of Main.
export function program(body, { types = '', statics = '', imports = 'import java.util.*;', throws = false } = {}) {
  const head = imports ? imports.trim() + '\n\n' : '';
  const before = types ? types.trim() + '\n\n' : '';
  const members = statics ? indent(statics.trim(), 4) + '\n\n' : '';
  return `${head}${before}public class Main {\n${members}    public static void main(String[] args)${throws ? ' throws Exception' : ''} {\n${indent(body.trim(), 8)}\n    }\n}\n`;
}

// Hidden Checks.java: plain-Java assertions (JUnit is not available offline).
export function checks(body, { imports = '', types = '' } = {}) {
  return `import java.util.*;
import java.util.function.*;
import java.io.*;
${imports}
${types}
public class Checks {
    static int failures = 0;
    static void eq(String what, Object want, Object got) {
        if (!Objects.equals(want, got)) { failures++; System.err.println(what + ": expected " + want + " but got " + got); }
    }
    static void expectThrows(String what, Class<? extends Throwable> type, String message, Runnable action) {
        try { action.run(); }
        catch (Throwable t) {
            if (!type.isInstance(t)) { failures++; System.err.println(what + ": expected " + type.getSimpleName() + " but got " + t); }
            else if (message != null && !message.equals(t.getMessage())) { failures++; System.err.println(what + ": expected message \\"" + message + "\\" but got \\"" + t.getMessage() + "\\""); }
            return;
        }
        failures++; System.err.println(what + ": expected " + type.getSimpleName() + " but nothing was thrown");
    }
    static String stdout(Runnable action) {
        PrintStream old = System.out; ByteArrayOutputStream buf = new ByteArrayOutputStream();
        System.setOut(new PrintStream(buf, true));
        try { action.run(); } finally { System.setOut(old); }
        return buf.toString();
    }
    public static void main(String[] args) throws Exception {
${indent(body.trim(), 8)}
        if (failures > 0) System.exit(1);
        System.out.println("All checks passed.");
    }
}
`;
}

const problem = p => ({
  title: p.title,
  signature: p.signature,
  description: [].concat(p.description),
  requirements: p.requirements,
  examples: p.examples.map(([input, output, explanation]) => ({ input, output, ...(explanation ? { explanation } : {}) })),
  constraints: p.constraints,
});
const exercise = e => ({ prompt: e.prompt, problem: problem(e), starter: e.starter, reference: e.reference, tests: e.tests, hints: e.hints });

export function learn(o) {
  return {
    overview: o.overview,
    goals: o.goals,
    diagram: { title: o.diagram[0], steps: o.diagram[1].map(([label, detail]) => ({ label, detail })) },
    sections: o.sections.map(([heading, points, code]) => ({ heading, points, ...(code ? { code } : {}) })),
    misconception: o.misconception,
    takeaway: o.takeaway,
    tryIt: o.tryIt,
    ...(o.walkthrough ? { walkthrough: { title: o.walkthrough[0], steps: o.walkthrough[1].map(([code, says]) => ({ ...(code ? { code } : {}), says })) } } : {}),
    ...(o.deeper ? { deeper: o.deeper.map(([heading, points, code]) => ({ heading, points, ...(code ? { code } : {}) })) } : {}),
  };
}

const ORIGIN = 'Built-in · CometCarpool course';

export function lesson(o) {
  return {
    id: o.id, title: o.title, language: 'java', minutes: o.minutes || 6, projectFile: o.file,
    explanation: o.explanation, learn: learn(o),
    example: { code: o.example, notes: o.notes || [] },
    prediction: { code: o.predict.code, question: 'This is a new example of the same idea. What exact output will it print?', expected: o.predict.expected, explanation: o.predict.explanation, version: 1 },
    guided: o.guided.problem ? structuredClone(o.guided) : exercise(o.guided), practice: o.practice.problem ? structuredClone(o.practice) : exercise(o.practice),
    sources: o.sources, validated: true, origin: ORIGIN,
  };
}

// Multiple-choice checkpoint for ideas that need a real Spring/Postgres install to execute.
export function conceptLesson(o) {
  const mc = (stage, q) => ({
    prompt: q.prompt, starter: 'Your answer: ', reference: q.answer, tests: `Conceptual answer: ${q.answer}`, hints: q.hints,
    problem: { title: q.title, description: [q.prompt], signature: 'Answer with one letter: A, B, or C.', requirements: ['Choose the best answer for this CometCarpool scenario.'], examples: [{ input: 'Answer format', output: 'A, B, or C' }, { input: 'Grading', output: 'Your letter is compared with the correct choice; hints explain why.' }], constraints: ['Use one answer letter.'] },
  });
  return {
    id: o.id, title: o.title, language: 'java', minutes: o.minutes || 5, mode: 'conceptual', projectFile: o.file,
    explanation: o.explanation, learn: { format: 'narrative', ...learn(o) },
    example: { code: o.example, notes: [] },
    prediction: { code: o.predict.prompt, question: o.predict.prompt, expected: o.predict.answer, explanation: o.predict.explanation, version: 1 },
    guided: mc('guided', o.guided), practice: mc('practice', o.practice),
    sources: o.sources, validated: true, origin: ORIGIN,
  };
}
