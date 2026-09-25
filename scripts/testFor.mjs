import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, relative } from "node:path";

import {
  MANUAL,
  RULES,
  TABLE_END_MARKER,
  TABLE_START_MARKER,
  auditMap,
  extractMarkedTable,
  gapFor,
  invocation,
  listRepositoryFiles,
  manualFor,
  normalizePath,
  renderTierTable,
  resolve,
  rulesFor,
  selfTest,
} from "./testMap.mjs";

/**
 * "I changed these files — what do I have to run?"
 *
 * The answer is a plan by tier, cheapest first, and — just as importantly — the list of what the
 * plan leaves out. Every `AGENTS.md` in this ecosystem says to report what was actually run and to
 * say so when a check was skipped; nothing enforced it. This prints the skipped list for you.
 *
 * It runs nothing. Deciding and executing are separate on purpose: the plan is short enough to read
 * before you commit to most of a minute of browser time, and a resolver that also ran things would be a
 * second, worse `npm run build`.
 *
 * The command is called `test:for` and not `check:for`, even though everything else here is
 * `check:`. One command has to work in any of the three checkouts; a local synonym would be a second
 * name for one thing, which is the defect `INV-5` is about. The *output* speaks the local language:
 * it prints `npm run check:layout` and calls these things checks.
 *
 * Exit codes follow `../scripts/check-ecosystem.mjs`:
 *   0  a plan was produced
 *   1  the audit found the map wrong (`--audit`)
 *   2  a path that still exists on disk is claimed by no rule, so any plan would be a guess
 */

const SELF_TEST_FLAG = "--self-test";
const TESTING_DOC_PATH = "TESTING.md";

const USAGE = `npm run test:for -- [<path>…] [--since <ref>] [--why <path>] [--full] [--list] [--audit] [--write]

  (no arguments)  the working tree against HEAD, staged and untracked included
  <path>…         these paths instead of git
  --since <ref>   diff against <ref> instead of HEAD
  --why <path>    which rules claim one path, and why
  --full          every file the repository owns, i.e. the plan for "I changed everything"
  --list          bare npm commands, one per line, for piping
  --audit         check the map against the repository instead of resolving anything
  --write         regenerate the tier table in TESTING.md from scripts/testMap.mjs
  --self-test     run the map's own self-test and nothing else`;

function parseArguments(argv) {
  const options = {
    paths: [],
    since: null,
    why: null,
    full: false,
    audit: false,
    list: false,
    write: false,
    help: false,
    unknown: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    switch (argument) {
      case "--since":
        index += 1;
        options.since = argv[index] ?? "HEAD";
        break;
      case "--why":
        index += 1;
        options.why = argv[index] ?? "";
        break;
      case "--full":
        options.full = true;
        break;
      case "--audit":
        options.audit = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "--write":
        options.write = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        // A misspelled flag must not silently become something else. `--wirte` used to fall through
        // to "resolve the working tree", which exits 0 and looks like the command worked.
        if (argument.startsWith("--")) {
          options.unknown.push(argument);
          break;
        }

        // An absolute path is what an editor, a stack trace and a copied error message all produce.
        // Everything downstream is repository-relative, so relativise here rather than teaching the
        // map — which is pure and has no idea where the checkout is — about the filesystem.
        options.paths.push(isAbsolute(argument) ? relative(process.cwd(), argument) : argument);
    }
  }

  return options;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Both commands are required.
 *
 * `git diff --name-only` without a ref compares against the index, so anything already staged
 * disappears from the answer — the exact files you are most likely about to commit. And a diff never
 * lists an untracked file, so a brand-new page in both locales would resolve to nothing at all.
 * `--no-renames` makes a rename show up as both paths, so whatever is attached to the *old* one is
 * still selected — which is the whole point when a page moves and its anchors move with it.
 */
function changedPaths(since) {
  return [
    ...git(["diff", "--name-only", "--no-renames", since ?? "HEAD"]),
    ...git(["ls-files", "--others", "--exclude-standard"]),
  ];
}

/** `git check-ignore` exits 1 when the path is not ignored, which execFileSync raises as an error. */
function isIgnored(path) {
  try {
    execFileSync("git", ["check-ignore", "--quiet", "--", path], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function readTestingDoc() {
  return existsSync(TESTING_DOC_PATH) ? readFileSync(TESTING_DOC_PATH, "utf8") : "";
}

function printPlan(plan, { list }) {
  if (list) {
    // Every line here is meant to be run as it stands, which is why it is the script's invocation
    // and not its name: `npm run test:for` piped into a shell would print a second plan.
    for (const tier of plan.tiers) {
      for (const script of tier.scripts) console.log(invocation(script));
    }
    return;
  }

  const selectedCount = plan.tiers.reduce((total, tier) => total + tier.scripts.length, 0);

  if (selectedCount === 0) {
    console.log("Nothing to run: no changed path maps to a check.");
  }

  for (const tier of plan.tiers) {
    if (tier.scripts.length === 0) continue;

    console.log(`\n${tier.title} — ${tier.why}`);
    for (const script of tier.scripts) {
      console.log(`  ${invocation(script)}${script.cost ? ` (${script.cost})` : ""}`);
      console.log(
        `      because you touched ${script.reasons.map((reason) => reason.prefix).join(", ")}`,
      );
    }
  }

  // Not "skipped". Whatever the gate runs is checked, whether or not a rule selected it, and the
  // list below must not claim otherwise.
  if (plan.coveredByBuild.length > 0) {
    console.log(
      `\nAlso run by \`npm run build\`: ${plan.coveredByBuild
        .map((script) => script.name)
        .join(", ")}.`,
    );

    if (plan.notRepeated.length > 0) {
      console.log(
        `  Not listed above: ${plan.notRepeated.map((script) => script.name).join(", ")} — ` +
          "they read dist/, so before the build they measure the previous version of the site and " +
          "after it the gate has just run them.",
      );
    }

    console.log(
      "  The rest are listed when your change reaches them: tenths of a second each, and a " +
        "mistake found before the gate spends most of a minute is the cheapest kind.",
    );
  }

  if (plan.manual.length > 0) {
    console.log("\nManual — what no check here can reach:");
    for (const item of plan.manual) {
      console.log(`  ${item.id} — ${item.run}`);
      console.log(`      proves: ${item.proves}`);
      console.log(`      costs: ${item.costs}; record: ${item.evidence}`);
    }
  }

  if (plan.documentedGaps.length > 0) {
    console.log("\nNo check by design:");
    for (const gap of plan.documentedGaps) console.log(`  ${gap.path} — ${gap.why}`);
  }

  console.log("\nNot selected, and therefore not checked by this run:");
  for (const script of plan.skipped) console.log(`  ${invocation(script)} — ${script.covers}`);

  console.log(
    "\nThis is not the gate. `npm run build` is, and a green plan here is not a green build.",
  );
}

function printWhy(path) {
  const rules = rulesFor(path);
  const gap = gapFor(path);

  if (rules.length === 0) {
    // A documented gap is an answer, not an absence. Printing only "no rule claims this" would send
    // you off to write the rule that NO_TESTS already decided, with a reason, not to have.
    console.log(gap ? `${gap.prefix} → no check by design.\n  ${gap.why}` : `No rule claims ${path}.`);
  }

  for (const rule of rules) {
    console.log(`${rule.prefix} → ${rule.scripts.join(", ")}`);
    console.log(`  ${rule.why}`);
  }

  for (const item of manualFor(path)) {
    console.log(`${item.id} (manual) — required when ${item.required}`);
  }
}

function runAudit() {
  const { fails, warns } = auditMap({
    packageScripts: JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {},
    files: listRepositoryFiles(),
    testingDoc: readTestingDoc(),
  });

  for (const warning of warns) console.warn(`WARN ${warning}`);
  for (const failure of fails) console.error(`FAIL ${failure}`);

  if (fails.length > 0) {
    console.error(
      `\n${fails.length} problem(s). Until the map is right, no test:for plan means anything.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Test map audit passed: ${RULES.length} rules, ${MANUAL.length} manual checks, ` +
      `${warns.length} warning(s) a human has to classify.`,
  );
}

function writeTable() {
  const document = readTestingDoc();

  if (extractMarkedTable(document) === null) {
    console.error(`${TESTING_DOC_PATH} is missing the generated table markers.`);
    process.exitCode = 1;
    return;
  }

  const start = document.indexOf(TABLE_START_MARKER);
  const end = document.indexOf(TABLE_END_MARKER);
  const updated =
    `${document.slice(0, start + TABLE_START_MARKER.length)}\n\n` +
    `${renderTierTable()}\n\n${document.slice(end)}`;

  writeFileSync(TESTING_DOC_PATH, updated);
  console.log(`Regenerated the tier table in ${TESTING_DOC_PATH}.`);
}

function run() {
  const options = parseArguments(process.argv.slice(2));

  if (options.help) {
    console.log(USAGE);
    return;
  }

  if (options.unknown.length > 0 && !process.argv.includes(SELF_TEST_FLAG)) {
    console.error(`Unknown flag(s): ${options.unknown.join(", ")}\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }

  // Deliberately not an assertion about TESTING.md. The self-test runs first inside every
  // invocation of this script, including `--write`, so a stale table checked here would make the one
  // command that regenerates it unreachable. Table drift is `auditMap`'s job and only its job.
  if (process.argv.includes(SELF_TEST_FLAG)) {
    selfTest();
    // stderr, unlike the other ten checks. `npm run test:for` runs the self-test first, inside the
    // same npm script name, exactly as every check here does — but this one also has `--list`, whose
    // only purpose is to be piped. A status line on stdout would end up in the pipe.
    console.error("Test map self-test passed");
    return;
  }

  if (options.write) {
    writeTable();
    return;
  }

  if (options.audit) {
    runAudit();
    return;
  }

  if (options.why !== null) {
    printWhy(options.why);
    return;
  }

  const paths = options.full
    ? listRepositoryFiles()
    : options.paths.length > 0
      ? options.paths
      : changedPaths(options.since);

  if (paths.length === 0) {
    console.log("No changed paths. Nothing to run.");
    return;
  }

  const plan = resolve(paths);

  // A path the map does not know is only a problem while it is still there. A deleted path resolves
  // by whatever rules still match and is otherwise just gone. Failing on it would make a directory
  // move impossible to finish: the old prefix is dead, the new one is unmapped, and every exit is
  // red whichever order you edit in.
  const present = plan.unmapped.filter((path) => existsSync(normalizePath(path)));
  const generated = present.filter((path) => isIgnored(normalizePath(path)));
  const missingFromMap = present.filter((path) => !generated.includes(path));

  // A gitignored path is not a path this repository owns; `dist/` and `cache` are named in
  // .gitignore for exactly that reason. Demanding a rule for one would be asking for a rule about
  // the build's output rather than about the build.
  for (const path of generated) {
    console.log(`${path} — generated and gitignored. What produces it is what has a rule.`);
  }

  if (missingFromMap.length > 0) {
    console.error("These paths exist but no rule claims them:");
    for (const path of missingFromMap) console.error(`  ${path}`);
    console.error(
      "\nAdd a rule to scripts/testMap.mjs, or a NO_TESTS entry with a reason. Until then a plan " +
        "would be a guess, so there is none.",
    );
    process.exitCode = 2;
    return;
  }

  for (const path of plan.unmapped) {
    if (generated.includes(path)) continue;
    console.log(`${path} — deleted, and no rule matches it any more.`);
  }

  printPlan(plan, options);
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
