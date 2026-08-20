#!/usr/bin/env node
/**
 * CleanSlice boundary check — the architecture invariants of a CleanSlice api,
 * enforced by a program instead of by review.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The two things CleanSlice promises — vertical slices that do not reach
 * sideways, and layers inside a slice that only point inward — are invisible
 * to the compiler. TypeScript is perfectly happy with a controller that
 * injects a gateway from a neighbouring slice: the import resolves, the types
 * line up, the app boots. The damage shows up later, when a change to that
 * gateway breaks a controller nobody expected to be listening.
 *
 * Left to review, this drift is found by eye, one file at a time, usually long
 * after it spread. Left to this script, it is found on the developer's machine
 * the moment `dev` starts.
 *
 * THE SCRIPT IS THE SAME EVERYWHERE, THE CONFIGURATION IS NOT
 * -----------------------------------------------------------
 * Group names and — crucially — their ORDER are project facts. A project with
 * three groups is checked against its three; a project with eight against its
 * eight. Nothing about either is written down here: it is read from
 * `cleanslice.config.cjs` (or `.json`) next to `package.json`. A check you
 * have to edit per project is not a standard, it is a template.
 *
 * WHAT IT CHECKS (three rules — see the constants below for the detail)
 *   1. groups-downward  — a group never imports a group above it.
 *   2. no-circular      — no import cycles anywhere.
 *   3. slice-layers     — presentation never touches `data/`; a controller
 *                         depends on a service, a service on a gateway
 *                         INTERFACE.
 *
 * WHAT IT DOES NOT CHECK
 * ----------------------
 * Deliberately quite a lot; the blind spots are listed in the CleanSlice MCP
 * document `02-standards/boundary-check.md`. Read them before trusting a green
 * run: a green run here means "none of these three rules is broken", never
 * "this code is CleanSlice".
 *
 * USAGE
 *   node scripts/cleanslice-check.cjs
 *
 * EXIT CODES
 *   0  no violations
 *   1  violations found
 *   2  the check could not run (bad or missing configuration)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ config */

const CONFIG_FILES = ['cleanslice.config.cjs', 'cleanslice.config.json'];

/**
 * Reads the project's group order. Everything project-specific enters the
 * check here and nowhere else.
 *
 * Defaults exist for the two paths (`src`, `src/slices`) because every
 * CleanSlice api has the same shape; there is no default for `groups`, because
 * guessing the order is exactly the mistake this file is meant to prevent —
 * the order encodes which group is allowed to depend on which, and only the
 * project knows it.
 */
function loadConfig() {
  const found = CONFIG_FILES.map((name) => path.join(PROJECT_ROOT, name)).find(fs.existsSync);

  if (!found) {
    fail(
      `no CleanSlice configuration found — expected one of ${CONFIG_FILES.join(', ')} in ${PROJECT_ROOT}`,
      'Create `cleanslice.config.cjs` declaring your slice groups, lowest first:',
      '',
      "  module.exports = { groups: ['setup', 'user'] };",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require(found);
  const where = path.basename(found);

  if (!Array.isArray(raw.groups) || raw.groups.length === 0) {
    fail(`${where}: \`groups\` must be a non-empty array of slice-group names, lowest first`);
  }
  if (raw.groups.some((group) => typeof group !== 'string' || group.trim() === '')) {
    fail(`${where}: every entry in \`groups\` must be a non-empty string`);
  }
  if (new Set(raw.groups).size !== raw.groups.length) {
    fail(`${where}: \`groups\` contains a duplicate — the order would be ambiguous`);
  }

  const config = {
    where,
    groups: raw.groups,
    sourceDir: raw.sourceDir || 'src',
    slicesDir: raw.slicesDir || 'src/slices',
  };

  // A group named in the configuration but absent from disk means the two have
  // drifted apart, and a rule generated for it silently checks nothing. That is
  // worse than a loud stop, so: stop loudly.
  const missing = config.groups.filter(
    (group) => !fs.existsSync(path.join(PROJECT_ROOT, config.slicesDir, group)),
  );
  if (missing.length > 0) {
    fail(
      `${where}: declared group(s) not found under ${config.slicesDir}/: ${missing.join(', ')}`,
      'Either the group was renamed or moved, or the configuration is stale.',
    );
  }

  return config;
}

/* ------------------------------------------------------------------- rules */

/**
 * RULE 1 — groups-downward.
 *
 * Slice groups are strictly ordered, lowest first, and dependencies may point
 * only DOWNWARD: a group must never import a group above it. `setup` knows
 * nothing about `user`; `user` may use `setup`.
 *
 * What it catches: the upward import that turns two groups into one tangled
 * unit. It is cheap because it is invisible — a single `import` line, added to
 * solve one small problem, and from then on the lower group cannot be extracted,
 * tested, or reasoned about without the higher one.
 */
function groupRules({ groups, slicesDir }) {
  const dir = escapeForRegex(slicesDir);

  return groups.slice(0, -1).map((group, index) => {
    const above = groups.slice(index + 1);

    return {
      name: `no-upward-import-from-${group}`,
      severity: 'error',
      comment: `'${group}' (L${index}) may not import higher groups: ${above.join(', ')}`,
      from: { path: `^${dir}/${group}/` },
      to: { path: `^${dir}/(${above.map(escapeForRegex).join('|')})/` },
    };
  });
}

/**
 * RULE 2 — no-circular.
 *
 * What it catches: cycles, anywhere. A cycle is the point where "which module
 * depends on which" stops having an answer; the modules involved can no longer
 * be understood, moved, or loaded apart from each other.
 */
const CIRCULAR_RULE = {
  name: 'no-circular',
  severity: 'error',
  comment: 'No dependency cycles anywhere',
  from: {},
  to: { circular: true },
};

/**
 * RULE 3 — slice-layers (the path half).
 *
 * A controller is the PRESENTATION layer: it calls a SERVICE. A service is the
 * DOMAIN layer: it depends on a gateway INTERFACE, which the data layer
 * implements. Neither may reach into `data/`.
 *
 * What it catches, and why it is expensive: in agentfy2 six controllers had
 * drifted into holding gateways — four of them a NEIGHBOURING slice's — while
 * the group check stayed green, because `controller -> its own domain/` is a
 * perfectly legal downward edge. Nothing said "not this", so it spread, and it
 * was found by reading code rather than by running anything (AGNT2-138).
 *
 * These two rules see PATHS. The name half below covers what paths cannot.
 */
function layerRules({ slicesDir }) {
  const dir = escapeForRegex(slicesDir);

  return [
    {
      name: 'no-data-layer-in-controller',
      severity: 'error',
      comment: 'A controller may only depend on a service — not on `data/`, not on a gateway module',
      from: { path: '\\.controller\\.ts$' },
      to: { path: '(^|/)data/|\\.gateway\\.ts$' },
    },
    {
      name: 'no-data-layer-in-domain',
      severity: 'error',
      comment: 'The domain layer depends on the gateway INTERFACE it declares, never on `data/`',
      from: { path: `^${dir}/.*/domain/` },
      to: { path: '(^|/)data/' },
    },
  ];
}

/**
 * RULE 3 — slice-layers (the name half).
 *
 * Every one of those six controllers pulled its gateway through the slice's
 * `domain/index.ts` barrel. At module level that import is indistinguishable
 * from importing the service standing next to it — same file, same edge — so
 * no path-based rule can see it. What gives it away is the NAME being imported,
 * which is why this half reads the import statements themselves.
 *
 * It is a deliberately shallow reader: import declarations only, no type
 * checking. That is enough for the shape it is looking for (`{ IUserGateway }`)
 * and it keeps the check free of a parser dependency. Its blind spots are in
 * the MCP document; the honest summary is that renaming a gateway to something
 * that does not end in `Gateway` hides it from this half.
 */
const GATEWAY_NAME = /Gateway$/;
const IMPORT_DECLARATION = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

function checkControllerImports({ slicesDir }) {
  const violations = [];

  for (const file of walk(path.join(PROJECT_ROOT, slicesDir))) {
    if (!file.endsWith('.controller.ts')) continue;

    const source = fs.readFileSync(file, 'utf8');
    const relative = path.relative(PROJECT_ROOT, file);

    for (const [, names, from] of source.matchAll(IMPORT_DECLARATION)) {
      const gateways = names
        .split(',')
        // `{ IUserGateway as Gw }` — the name that matters is the imported one.
        .map((name) => name.trim().split(/\s+as\s+/)[0].trim())
        .filter((name) => GATEWAY_NAME.test(name));

      if (gateways.length > 0) {
        violations.push({
          rule: 'no-gateway-name-in-controller',
          from: relative,
          to: `${from} (${gateways.join(', ')})`,
          comment: 'A controller may not import a gateway — call the owning slice\'s service instead',
        });
      }
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ runner */

async function main() {
  const started = Date.now();
  const config = loadConfig();

  const forbidden = [...groupRules(config), CIRCULAR_RULE, ...layerRules(config)];

  // dependency-cruiser ships as ESM only, so it arrives by dynamic import even
  // though this file is CommonJS (which it is so that `node scripts/…` works in
  // any project, whatever its package `type`).
  const { cruise } = await import('dependency-cruiser');
  const { default: extractTSConfig } = await import(
    'dependency-cruiser/config-utl/extract-ts-config'
  );

  const tsConfigFile = path.join(PROJECT_ROOT, 'tsconfig.json');
  // Without the tsconfig, path aliases (`#setup/prisma`) do not resolve to a
  // file, the edge never lands inside `src/slices/`, and every rule above
  // quietly stops seeing it. Alias-heavy code is precisely where boundaries
  // break, so a missing tsconfig is a stop, not a warning.
  if (!fs.existsSync(tsConfigFile)) {
    fail(`tsconfig.json not found in ${PROJECT_ROOT} — path aliases could not be resolved`);
  }
  const tsConfig = extractTSConfig(tsConfigFile);

  const result = await cruise(
    [config.sourceDir],
    {
      ruleSet: { forbidden },
      validate: true,
      baseDir: PROJECT_ROOT,
      tsConfig: { fileName: tsConfigFile },
      doNotFollow: { path: 'node_modules' },
      // Co-located tests (*.spec.ts / *.e2e-spec.ts) legitimately wire across
      // layers — an AppModule in a bootstrap, a neighbouring slice's fixture.
      // They are not production code and are excluded on purpose. Do not remove
      // this line to "increase coverage": it will fail honest tests.
      exclude: { path: '\\.(e2e-)?spec\\.ts$' },
      tsPreCompilationDeps: true,
      enhancedResolveOptions: {
        exportsFields: ['exports'],
        conditionNames: ['import', 'require', 'node', 'default'],
      },
    },
    {},
    { tsConfig },
  );

  const nameViolations = checkControllerImports(config);
  const modules = result.output?.summary?.totalCruised ?? 0;
  const graphViolations = result.output?.summary?.error ?? 0;
  const elapsed = Date.now() - started;

  const scope = `${config.groups.length} group(s) [${config.groups.join(' -> ')}], ${modules} modules, ${elapsed} ms`;

  if (graphViolations === 0 && nameViolations.length === 0) {
    console.log(`cleanslice-check: OK — ${scope}`);
    return 0;
  }

  console.error(`cleanslice-check: FAILED — ${scope}\n`);

  if (graphViolations > 0) {
    console.error(formatGraphViolations(result.output.summary.violations, forbidden));
  }
  for (const violation of nameViolations) {
    console.error(`  error ${violation.rule}: ${violation.from} -> ${violation.to}`);
    console.error(`    ${violation.comment}\n`);
  }

  console.error(
    `${graphViolations + nameViolations.length} violation(s). Rules and their blind spots: CleanSlice MCP, 02-standards/boundary-check.md`,
  );
  return 1;
}

/**
 * dependency-cruiser hands back the rule NAME that a violation broke, but not
 * the `comment` explaining it. The explanation is the useful half — it says
 * what the developer should have written instead — so it is looked up here.
 */
function formatGraphViolations(violations, rules) {
  const explanation = new Map(rules.map((rule) => [rule.name, rule.comment]));

  return violations
    .map((violation) => {
      const arrow = violation.cycle
        ? violation.cycle.map((step) => step.name ?? step).join(' -> ')
        : violation.to;

      return [
        `  error ${violation.rule.name}: ${violation.from} -> ${arrow}`,
        `    ${explanation.get(violation.rule.name) ?? ''}`,
        '',
      ].join('\n');
    })
    .join('\n');
}

/* ----------------------------------------------------------------- helpers */

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fail(...lines) {
  console.error(`cleanslice-check: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(line);
  process.exit(2);
}

main().then(
  (code) => process.exit(code),
  (error) => fail(`could not run — ${error.message}`),
);
