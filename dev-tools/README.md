# Lux Omni comment-removal utility

This tool switches tracked source files from the heavily commented study view to a compact view by removing comments from active HTML, CSS, and JavaScript files.

## Before you run it

Open a terminal at the Lux Omni repository root. Commit your study-mode work first, or save any unrelated work with Git, because removing comments changes source files in your working tree.

## Remove comments

Run:

```sh
node dev-tools/remove-comments.js
```

The tool scans active `.html`, `.css`, and `.js` files recursively. It strictly skips `_legacy_reference/`, `.git/`, `node_modules/`, and `dev-tools/`. It preserves ordinary quoted strings and removes empty lines left after comment removal.

The implementation uses regular expressions that protect normal quoted strings and simple template literals before removing JavaScript comments. Regular expressions cannot fully parse every possible JavaScript syntax edge case (for example, comment syntax inside a template literal's `${...}` expression or unusual regular-expression literals). Review the diff before keeping or committing the clean view.

## Restore study mode with Git

After running the tool, do **not** stage the stripped files if you plan to restore them. From the repository root, run:

```sh
git restore .
```

On older Git versions, the equivalent working-tree reset is:

```sh
git checkout .
```

These commands restore tracked working-tree files from the index. They discard **all unstaged edits to tracked files**, not just removed comments, so preserve any other work first. They do not remove new untracked files.

## What the tool changes

The utility edits only source files with `.html`, `.css`, or `.js` extensions outside the ignored directories. It does not delete files or change the ignore list, DOM IDs, CSS selectors, or application logic intentionally.
