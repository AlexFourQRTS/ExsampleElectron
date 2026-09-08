# Development Rules

**Description:** General code style rules and decision-making principles  
**Author:** Core team  
**Status:** Always apply  

---

## Objective of Rules

A person cannot hold more than 3–4 chains of logical branching in their head. Beyond that, maintainability falls and the risk of bugs in edits grows.

All rules in this file are first and foremost for **KISS**: code must be readable and changeable without "untangling" logic.

Limits (branching, lines in a file, inheritance, utility-types, function arguments) are not bureaucracy, but protection from cognitive overload.

If two solutions are equal in task scope—choose the simpler one. Exception: security / auth (security rules take priority over brevity).

---

## When Rules Conflict

- **Goal of rules (KISS, branching limit)** is the guiding principle in any choice.
- **Critical bans** (any, interface, complex utility-types, security/auth without tests) take priority over KISS—do not weaken them.
- **New code and refactoring** follow all rules in this file.
- **Legacy fixes without refactoring**: minimal diff and the style of neighboring code; do not add interface, any, default export; if existing else / interface exists in the file, do not touch it; new code in the same file—without else and interface.
- **Do not bloat:** less than 50 lines and one task = do not split into files without cause.

---

## Language and Localization

- All new code is in **English**: source files, comments, commit messages, documentation.
- Existing code in other languages: do not touch without refactoring; when refactoring, conform to these rules.
- No hardcoded UI strings—separate i18n layer (translations, locales, etc.).
- Interface texts, errors, and labels go into translations with keys in English.

---

## Dependencies

Before implementing a large task, check if there is a ready, proven module. Do not write your own for standard domains (Excel, PDF, crypto, HTTP client, complex format parsing, etc.).

**Criterion for "large":** standard protocol/format, cryptography, heavy parsing, OAuth, file operations—look for a package. Project business logic—write in the repository.

For small utilities (1–2 functions, narrow project logic)—do not search for a package.

After adding: depcheck (unused), npm audit (CVE), package reputation and activity; in PR—1–2 sentences on why chosen and what alternatives were considered.

Remove unused dependencies from package.json.

---

## Architecture and Quality

- **File size:** no more than 250 lines. When exceeded—split into modules. Legacy exceeding limit—split on next touch.
- **Classes:** one base class has no more than 5 direct children; a class has no more than one base (extends). implements—minimally.
- **More than 10 cases on one value:** Map or separate strategy file, not switch on dozens of branches or a pack of inheritor classes.
- **SOLID, Clean Architecture, Strategy / Factory / Observer:** only if they simplify code, not for fashion.
- **Declarative style:** no callback hell, no deep nesting.
- **SRP:** each module, component, or function has one zone of responsibility.
- **JSDoc for public API** (services, strategies, shared utils)—exception to the minimal comments rule.
- **File name = main export;** one file—one public entity.
- **Different layers and entry points** (UI, background, API, CLI)—separate files, different responsibility.
- **Common types:** in a separate file when reused in 2+ places or larger than ~30 lines.

---

## UI (Styling)

- **Visual design** through the UI library adopted in the project (MUI, shadcn, Ant Design, etc.): components, theme, styles.
- Do not duplicate from scratch what the library already provides; do not mix multiple UI-kits without cause.
- Styling is separated from business logic.

---

## Security

- **Do not commit secrets, API keys, tokens**—only env (.env, .env.local) and record in .gitignore.
- **Critical:** security / auth—tests before merge to main.

---

## Implementation Principles

- **Minimal diff:** the smallest correct volume of changes; do not touch extra code.
- **No overcomplication:** no premature abstractions, single-call helpers, processing of unrealistic cases.
- **New code and refactoring** follow this file. **Legacy fixes:** see "When Rules Conflict" section.
- **Comments:** code is self-explanatory; comments only for non-obvious logic, plus JSDoc on public API.
- **DRY:** in runtime code and explicit types; not through prohibited utility from TypeScript section.
- **KISS:** main goal (see "Objective of Rules"); **YAGNI**—do not add what code is clear without.
- When refactoring old code, you can comment nearby; after merge—delete, history in git.

---

## Names

- **Variables and functions:** from two words; short names only for locals and conventional (id, url, index).
- **Banned generic names:** handler, handle, process, data, temp—a name tells what it does.
- **camelCase** for JS/TS; in other languages—by adopted language conventions.

---

## Complexity

**Main limit:** a finished logical branch—no more than 4 items (if / switch / loop / ternary; && and || on one line do not count). This follows from "Objective of Rules."

One switch in a function = one position, but case inside—no more than 10 (else Map, see Architecture).

- **Critical:** function with more than 3 arguments—one object parameter.
- **else is banned in new code**—early return; branches complete the scenario explicitly.
- **Inline guard:** if the if body is only an early exit (return, continue, break) and the condition fits one line—one line without braces; else—multi-line block.
- **ESLint and lint rules** of the project—follow them (npm run lint / equivalent).
- **More than 3 ifs on one value:** switch (but no more than 10 cases; beyond—Map).
- **Map / Set:** when you need frequent lookup or uniqueness, not everywhere.
- **Prefer map, filter, reduce** over manual loops where it reads better.

---

## TypeScript

- **any is banned**—unknown + explicit narrowing.
- **Public functions:** explicit return type.
- **Only named export;** default export is banned.
- **Object forms and contracts:** only through type. **interface is banned in new code.**
- **Critical:** derivative types—only one layer of one utility from base type: Partial, Required, Readonly, Pick, or Omit.
- **Critically banned:** utility chains, multiple utilities on one type, Record, Exclude, Extract, Awaited, ReturnType, conditional types, mapped types, template literal types, intersection and union for object type assembly, third-party type-helpers. Union of primitives and string literal union (status, action)—allowed.
- From one base type—no more than 5 derivatives through allowed utilities. More—split the base type or use a named intermediate type (also one utility from its own base).
- **Field combination:** explicit type or several named types, not nested utilities.

---

## Organization

- **Constants:** by domains/zones; no magic strings in code (i18n keys and domain constants—in constants / locales).
- **Imports:** external packages, then types, then local modules; blank line between groups; alias and ESM-suffixes—by repository convention.
- **async/await,** not .then chains.
- **catch is not empty**—errors are not swallowed; log or re-throw with context.
- **console.log:** only in development; on production paths—framework logger.

---

## Tests

- **Critically mandatory:** security / auth.
- When changing non-trivial logic (parsing, normalization, aggregations, public API)—tests in the same PR.
- Otherwise—on request or if behavior is non-obvious from code.

---

## Stack and Environment

- Determine stack from the repository (package.json, pyproject.toml, Cargo.toml, etc.)—do not guess the framework.
- For web/mobile UI—safe-area, tap zones, keyboard—if the project assumes it.
- New npm-script in a task—one line in README in the same PR. Separate .md files—only on user request.

---

## Git and Delivery

- **Commits:** only on explicit user request; message explains why, not a list of files.
- No secrets in commits; warn if .env or keys end up in staging.
- **PRs:** small; test plan—if changed logic from Tests section.

---

## AI Assistant Behavior (when applicable)

- Clean, maintainable code, not one-off hacks.
- Before large features—briefly outline module structure.
- Execute commands yourself: install, build, lint, test.
- Do not give up after the first error.
- Answer scope matched to task: brief / detailed.