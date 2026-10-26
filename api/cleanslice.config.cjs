/**
 * CleanSlice project configuration — read by `scripts/cleanslice-check.cjs`.
 *
 * `groups` is the slice groups of THIS project, LOWEST FIRST. The order is the
 * rule: a group may depend on everything before it and on nothing after it.
 *
 *   setup  — infrastructure every feature needs (prisma, error, response, health).
 *            It must not know that features exist.
 *   user   — the feature group (auth, user), built on top of setup.
 *
 * Adding a group means adding it here, in its rightful place in the order —
 * the check itself stays untouched.
 */
module.exports = {
  groups: ['setup', 'user'],
};
