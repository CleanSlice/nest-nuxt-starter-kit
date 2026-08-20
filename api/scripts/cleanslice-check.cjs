#!/usr/bin/env node
/**
 * cleanslice-check — the CleanSlice architecture check.
 *
 * The same file in every CleanSlice project. Everything project-specific — how
 * many slice groups there are, what they are called, in which order they may
 * depend on each other — is read from `cleanslice.json`, never from this file.
 * A check you have to edit per project is not a standard, it is a template, and
 * a template drifts: the eight groups of one app end up hard-coded where the
 * two groups of the next one need to be.
 *
 * Run it:   node scripts/cleanslice-check.cjs
 * Exit code 0 = clean, 1 = violations, 2 = the check itself could not run.
 *
 * Three rules. Each of them exists because something real got through review
 * without it; the comment on each says what it catches and what that cost.
 *
 * WHAT THIS DOES NOT CHECK is written down in the MCP document
 * `02-standards/boundary-check.md`. Read it before you assume a green run means
 * the code is CleanSlice-clean — it means these three things are true, no more.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'cleanslice.json';

/* ── config ──────────────────────────────────────────────────────────────── */

/**
 * Find `cleanslice.json` by walking up from the working directory.
 *
 * Walking up (rather than demanding an exact cwd) is what lets the same command
 * work from the project root, from `api/`, from a `predev` hook and from an
 * editor task — all four are places this gets run from in practice.
 */
function findConfig(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Read and validate the project's group declaration.
 *
 * Every failure here is fatal and loud. A config with a typo'd group name would
 * otherwise produce a check that silently stops guarding that group: it would
 * generate no rules for it, find no violations in it, and print a green tick —
 * the exact "false confidence" failure this whole check exists to prevent.
 *
 * Shape:
 *   {
 *     "srcRoot": "src",              // optional, default "src"
 *     "slicesRoot": "src/slices",    // optional, default `${srcRoot}/slices`
 *     "groups": [                    // required, ORDER IS THE RULE: low → high
 *       "infra",                     // → `${slicesRoot}/infra`
 *       { "name": "user", "path": "src/user" }   // → an explicit path
 *     ]
 *   }
 */
function loadConfig(configPath) {
  const root = path.dirname(configPath);

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    fail(`${CONFIG_FILE} is not valid JSON: ${error.message}`);
  }

  const srcRoot = raw.srcRoot || 'src';
  const slicesRoot = raw.slicesRoot || `${srcRoot}/slices`;

  if (!Array.isArray(raw.groups) || raw.groups.length === 0) {
    fail(`${CONFIG_FILE} must declare a non-empty "groups" array (low → high).`);
  }

  const groups = raw.groups.map((entry, index) => {
    const group =
      typeof entry === 'string'
        ? { name: entry, path: `${slicesRoot}/${entry}` }
        : { name: entry && entry.name, path: entry && (entry.path || `${slicesRoot}/${entry.name}`) };

    if (!group.name || typeof group.name !== 'string') {
      fail(`${CONFIG_FILE}: groups[${index}] has no "name".`);
    }
    if (!fs.existsSync(path.join(root, group.path))) {
      // A group that points nowhere generates rules that can never fire.
      fail(
        `${CONFIG_FILE}: group "${group.name}" points at "${group.path}", which does not exist.\n` +
          '  A group with no directory silently disables every rule about it.',
      );
    }
    return group;
  });

  const duplicate = groups.map((g) => g.name).find((name, i, all) => all.indexOf(name) !== i);
  if (duplicate) {
    fail(`${CONFIG_FILE}: group "${duplicate}" is declared twice — the order would be ambiguous.`);
  }

  if (!fs.existsSync(path.join(root, srcRoot))) {
    fail(`${CONFIG_FILE}: srcRoot "${srcRoot}" does not exist.`);
  }

  return { root, srcRoot, slicesRoot, groups };
}

/* ── rules ───────────────────────────────────────────────────────────────── */

const escape = (literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * RULE 1 — group dependencies point DOWNWARD only.
 *
 * The declared order IS the layering: groups[0] is the lowest, and a group may
 * import only groups below it. An upward import is how a foundation slice ends
 * up unable to move without dragging a feature slice with it, and how a
 * "shared" group quietly becomes the place where everything lives.
 *
 * Catches: `infra/` importing `agent/`; `setup/` reaching into `billing/`.
 */
function groupDirectionRules(groups) {
  return groups.slice(0, -1).map((group, index) => {
    const above = groups.slice(index + 1);
    return {
      name: `no-upward-import-from-${group.name}`,
      severity: 'error',
      comment:
        `'${group.name}' (L${index}) may not import higher groups: ` +
        above.map((g) => g.name).join(', '),
      from: { path: `^${escape(group.path)}/` },
      to: { path: `^(${above.map((g) => escape(g.path)).join('|')})/` },
    };
  });
}

/**
 * RULE 2 — no dependency cycles, anywhere.
 *
 * A cycle means two modules cannot be read, tested, or deleted apart. It is
 * also the failure that a human reviewer has the least chance of spotting: no
 * single import in the loop looks wrong, only the loop does.
 */
const NO_CIRCULAR = {
  name: 'no-circular',
  severity: 'error',
  comment: 'No dependency cycles anywhere',
  from: {},
  to: { circular: true },
};

/**
 * RULE 3 — the three layers INSIDE a slice: presentation → domain → data.
 *
 * The rule the other two could not see, and the expensive one. A controller
 * that injects a gateway imports it from its OWN slice folder, so to a
 * group-level graph that is a legal edge pointing nowhere in particular. In one
 * codebase that gap let SIX controllers drift into holding gateways — four of
 * them another slice's — with a fully green gate. It was found by eye, not by a
 * check (agentfy2, AGNT2-138).
 *
 * 3a. A controller (presentation) depends on a SERVICE. Never on `data/`, never
 *     on a gateway. CleanSlice MCP, `03-patterns/controller.md`: "Calls SERVICE
 *     only (never gateway)".
 * 3b. Domain depends on the gateway INTERFACE, which lives beside it in
 *     `domain/`. Never on the implementation in `data/`. CleanSlice MCP,
 *     `03-patterns/service.md`: "Services ONLY depend on gateway interfaces,
 *     never implementations."
 *
 * Both are path rules here, and 3a's path form has a blind spot: a gateway
 * pulled in through the slice's `domain/index.ts` barrel is, at module level,
 * indistinguishable from importing the service next to it. Every one of those
 * six controllers imported through the barrel. `checkControllerImports()` below
 * closes that hole by reading the imported NAMES; the two halves together are
 * the rule.
 */
const PRESENTATION_RULES = [
  {
    name: 'no-data-layer-in-controller',
    severity: 'error',
    comment: 'A controller may only depend on a service — not on `data/` and not on a gateway module',
    from: { path: '\\.controller\\.ts$' },
    to: { path: '(^|/)data/|\\.gateway\\.ts$' },
  },
  {
    name: 'no-data-layer-in-domain',
    severity: 'error',
    comment: 'Domain depends on the gateway INTERFACE in `domain/` — never on the `data/` implementation',
    from: { path: '(^|/)domain/' },
    to: { path: '(^|/)data/' },
  },
];

/* ── rule 3a, the half that reads names ──────────────────────────────────── */

/**
 * The barrel-import half of rule 3a.
 *
 * dependency-cruiser sees modules; this sees the identifiers. A controller
 * importing `IUserGateway` from `./domain` is a legal-looking module edge and an
 * illegal import — it is how the gateway gets into the constructor. The check is
 * a parse, not a type-check: no program, no checker, single-digit milliseconds
 * for the whole tree.
 *
 * `typescript` is required, not optional. Skipping this half when the parser is
 * missing would turn the rule green on exactly the code it exists to catch.
 */
function checkControllerImports(root, srcRoot) {
  let ts;
  try {
    ts = require('typescript');
  } catch {
    fail(
      'cannot load `typescript`, which rule 3 needs to read import names.\n' +
        '  Install it (`npm i -D typescript`) — skipping this half would make the rule green on broken code.',
    );
  }

  const violations = [];
  for (const file of walk(path.join(root, srcRoot))) {
    if (!file.endsWith('.controller.ts') || /\.(e2e-)?spec\.ts$/.test(file)) continue;

    const text = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      const from = statement.moduleSpecifier.text;
      const at = () => {
        const { line } = ts.getLineAndCharacterOfPosition(source, statement.getStart(source));
        return `${path.relative(root, file)}:${line + 1}`;
      };

      // Direct forms. dependency-cruiser reports these too; keeping them here as
      // well means the rule reads as one rule wherever you meet it.
      if (/(^|\/)data(\/|$)/.test(from)) {
        violations.push(`${at()}  imports the data layer — \`${from}\``);
      } else if (/\.gateway$/.test(from)) {
        violations.push(`${at()}  imports a gateway module — \`${from}\``);
      }

      // The barrel form: the path is innocent, the name is not.
      const bindings = statement.importClause && statement.importClause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const imported = (element.propertyName || element.name).text;
          if (/Gateway$/.test(imported)) {
            violations.push(`${at()}  imports \`${imported}\` from \`${from}\` — call the owning slice's service instead`);
          }
        }
      }
    }
  }
  return violations;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/* ── run ─────────────────────────────────────────────────────────────────── */

function fail(message) {
  process.stderr.write(`\ncleanslice-check: ${message}\n\n`);
  process.exit(2);
}

async function main() {
  const started = Date.now();

  const configPath = findConfig(process.cwd());
  if (!configPath) {
    fail(
      `no ${CONFIG_FILE} found in ${process.cwd()} or any parent directory.\n` +
        '  It declares the project\'s slice groups, low → high; the check cannot guess them.',
    );
  }
  const config = loadConfig(configPath);

  // dependency-cruiser is ESM-only from v16; this file stays .cjs so that any
  // project can run it with plain `node`, whatever its own module setting is.
  let cruise, extractTsConfig;
  try {
    ({ cruise } = await import('dependency-cruiser'));
    ({ default: extractTsConfig } = await import('dependency-cruiser/config-utl/extract-ts-config'));
  } catch (error) {
    fail(`cannot load \`dependency-cruiser\`: ${error.message}\n  Install it: npm i -D dependency-cruiser`);
  }

  // Run from the project root, exactly as `depcruise src` would: every rule
  // path below is written relative to it, and so is every path in the report.
  process.chdir(config.root);

  // Two things about the shape below, both of which cost a whole afternoon and
  // neither of which announces itself — a check wired up the obvious way runs,
  // reports, and passes on any code you give it:
  //
  //  * `validate: true`. Without it the rule set is parsed, echoed back in the
  //    result, and never applied. Every module comes back valid. It is the one
  //    option whose absence looks exactly like success.
  //  * `ruleSet.options.tsConfig.fileName`. The tsconfig filename has to sit
  //    THERE — nested, in the shape a `.dependency-cruiser.cjs` file has — because
  //    that is the one place the resolver looks for it. Set it anywhere else and
  //    the tsconfig's `paths` are never loaded, so every aliased import
  //    (`#user/auth`, `#prisma`) fails to resolve. An import that does not
  //    resolve is an edge that does not exist, and an edge that does not exist is
  //    one no rule can forbid: on a codebase where slices reach each other by
  //    alias, that silently turns the group-direction rule off altogether.
  const tsConfigFile = path.join(config.root, 'tsconfig.json');
  if (!fs.existsSync(tsConfigFile)) fail(`no tsconfig.json next to ${CONFIG_FILE} — the check needs it to resolve imports.`);

  const options = {
    doNotFollow: { path: 'node_modules' },
    // Co-located specs (*.spec.ts / *.e2e-spec.ts) legitimately wire across
    // layers — a test builds the whole module, or reaches for another slice's
    // fixture. They are not production code, and including them would force
    // every project to weaken the real rules to keep its tests compiling.
    // Do not "fix" this exclusion back out.
    exclude: { path: '\\.(e2e-)?spec\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  };

  const result = await cruise([config.srcRoot], {
    validate: true,
    outputType: 'err-long',
    ruleSet: {
      forbidden: [...groupDirectionRules(config.groups), ...PRESENTATION_RULES, NO_CIRCULAR],
      options,
    },
    ...options,
  }, {}, { tsConfig: extractTsConfig(tsConfigFile) });

  const nameViolations = checkControllerImports(config.root, config.srcRoot);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const graphFailed = result.exitCode !== 0;
  if (graphFailed) process.stdout.write(result.output);

  if (nameViolations.length > 0) {
    process.stdout.write(
      '\n  error no-gateway-name-in-controller: a controller may not import a gateway.\n' +
        '  A gateway reached through the slice\'s `domain/` barrel is invisible to the module graph;\n' +
        '  this is the same rule as no-data-layer-in-controller, read off the import names.\n\n' +
        nameViolations.map((v) => `    ${v}`).join('\n') +
        `\n\n  ${nameViolations.length} violation${nameViolations.length === 1 ? '' : 's'}\n\n`,
    );
  }

  if (graphFailed || nameViolations.length > 0) {
    process.stderr.write(`✘ cleanslice-check failed (${config.groups.length} groups, ${elapsed}s)\n`);
    process.exit(1);
  }

  process.stdout.write(
    `✔ cleanslice-check: ${config.groups.length} groups ` +
      `(${config.groups.map((g) => g.name).join(' → ')}), no violations (${elapsed}s)\n`,
  );
}

main().catch((error) => fail(error && error.stack ? error.stack : String(error)));
