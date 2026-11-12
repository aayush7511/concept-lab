// Beginner-first Learn rewrites for tickets T4–T8. Exercises are untouched.
import { learn } from './helpers.mjs';
import { rewritesT4T5 } from './learn-t4-t5.mjs';
import { rewritesT6 } from './learn-t6.mjs';
import { rewritesT7T8 } from './learn-t7-t8.mjs';

export const rewrites = { ...rewritesT4T5, ...rewritesT6, ...rewritesT7T8 };

// Replace only the Learn text of a lesson that has a rewrite and does not already use it.
export function applyRewrite(l) {
  const o = rewrites[l.id];
  if (!o || l.learn.walkthrough) return l;
  l.learn = { ...(l.mode === 'conceptual' ? { format: 'narrative' } : {}), ...learn({ ...o, tryIt: o.tryIt || l.learn.tryIt }) };
  return l;
}
