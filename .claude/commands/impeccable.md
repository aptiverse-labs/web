---
description: Run an impeccable design sub-command (polish, audit, critique, animate, bolder, quieter, …) on a target file, page, or component.
argument-hint: "[craft|shape|audit|critique|polish|animate|bolder|colorize|delight|layout|overdrive|quieter|typeset|adapt|clarify|distill|harden|onboard|optimize|teach|document|extract|live] [target]"
---

Run the impeccable design skill's sub-command on a target.

Raw arguments: `$ARGUMENTS`

## How to interpret the arguments

Parse `$ARGUMENTS` as:

```
<sub-command> [target...]
```

- The first whitespace-separated token is the **sub-command** (e.g. `polish`, `audit`, `critique`, `animate`).
- The rest (if any) is the **target** — a file path, page route, component name, or free-text description of the surface in scope.

If `$ARGUMENTS` is empty: list the available sub-commands (see below) and ask which one to run and on what.

If the sub-command isn't recognised: tell the user, list the valid ones, don't guess.

## Valid sub-commands

`craft`, `shape`, `audit`, `critique`, `polish`,
`animate`, `bolder`, `colorize`, `delight`, `layout`, `overdrive`, `quieter`, `typeset`,
`adapt`, `clarify`, `distill`,
`harden`, `onboard`, `optimize`,
`teach`, `document`, `extract`, `live`.

## What to do for any valid sub-command

Follow the impeccable skill's setup procedure in order. Don't skip steps — the SKILL.md is explicit that skipping produces generic output.

1. **Read** `.claude/skills/impeccable/SKILL.md` end to end. The shared design laws, the absolute bans, and the register split (brand vs product) are non-negotiable inputs to every command.

2. **Load project context** by running:

   ```bash
   node .claude/skills/impeccable/scripts/load-context.mjs
   ```

   Consume the full JSON output. The loader returns `hasProduct`, `product`, `hasDesign`, `design` fields. If `hasProduct` is false and the sub-command isn't `teach`, *stop and tell the user* — they need to run `/impeccable teach` first to author `PRODUCT.md`. (Exception: `live` warms its own context.)

3. **Identify register** — brand or product — from the cue in the task itself first, then the surface in focus, then `PRODUCT.md`'s `register` field. Load the matching reference:
   - Brand: `.claude/skills/impeccable/reference/brand.md`
   - Product: `.claude/skills/impeccable/reference/product.md`

4. **Read the sub-command reference**: `.claude/skills/impeccable/reference/<sub-command>.md`. This is non-negotiable — the sub-command's specific workflow lives in that file. Loading it is what makes `/impeccable polish` behave differently from `/impeccable critique`.

5. **Apply the sub-command** to the target. Make real edits, not just suggestions, unless the sub-command's reference explicitly says otherwise (e.g. `critique` and `audit` produce reviews, not edits).

6. **Report back** — what changed, what's still off, what's deferred and why.

## Deterministic anti-pattern detection (optional)

The skill ships with a CLI for catching anti-patterns without an LLM round-trip:

```bash
npx impeccable detect <path>
```

For sub-commands that benefit from this (`audit`, `polish`, `harden`, `critique`), run the CLI alongside the LLM pass so you catch the deterministic stuff (gradient text, side-stripe borders, em-dashes, etc.) for free. The skill's `allowed-tools` frontmatter permits `Bash(npx impeccable *)`.

## A note on this dispatcher

This is a project-scoped slash command living in `.claude/commands/impeccable.md` — it forwards to the in-repo skill at `.claude/skills/impeccable/`. Same behaviour as the upstream `pbakaus/impeccable` plugin (also `/impeccable <sub>`), without requiring a per-user `/plugin install`.
