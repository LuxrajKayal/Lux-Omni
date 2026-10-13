// Purpose: Run this statement as the next step in the comment-removal process.
"use strict";

// Import Node's file module so the utility can read and rewrite project files.
// Purpose: Declare the value or configuration used by this step.
const fs = require("node:fs");
// Import Node's path module so directory and file paths work on every operating system.
// Purpose: Declare the value or configuration used by this step.
const path = require("node:path");

// Treat the repository root as the parent directory of this dev-tools folder.
// Purpose: Declare the value or configuration used by this step.
const ROOT_DIRECTORY = path.resolve(__dirname, "..");
// Skip directories that must never be modified by this tool.
// Purpose: Declare the value or configuration used by this step.
const IGNORED_DIRECTORIES = new Set(["_legacy_reference", ".git", "node_modules", "dev-tools"]);
// Limit edits to the three source formats requested for comment removal.
// Purpose: Declare the value or configuration used by this step.
const SOURCE_EXTENSIONS = new Set([".html", ".css", ".js"]);

// Match quoted text first so comment-like characters inside strings are preserved.
// Purpose: Declare the value or configuration used by this step.
const JS_COMMENT_PATTERN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g;
// Match quoted CSS values before matching real CSS block comments.
// Purpose: Declare the value or configuration used by this step.
const CSS_COMMENT_PATTERN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\/\*[\s\S]*?\*\//g;
// Match a complete HTML comment, including comments that span multiple lines.
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

// Remove JavaScript comments while keeping ordinary quoted strings and templates intact.
function removeJavaScriptComments(source) {
  // Replace only comment matches; return captured string literals unchanged.
  return source.replace(JS_COMMENT_PATTERN, (match, quotedText) => {
    // Preserve a protected string so a URL such as https://example.com remains untouched.
    if (quotedText) return match;
    // Leave a space where a comment was so neighboring code tokens do not join together.
    return " ";
    // Close the replacement callback after deciding what text should remain.
  });
  // Finish the JavaScript comment-removal helper.
}

// Remove CSS block comments without deleting markers inside quoted property values.
function removeCssComments(source) {
  // Replace comment matches and return quoted values exactly as they were.
  return source.replace(CSS_COMMENT_PATTERN, (match, quotedText) => {
    // Keep text such as content: "/* not a comment */" unchanged.
    if (quotedText) return match;
    // Leave one space so adjacent CSS tokens remain separated.
    return " ";
    // Close the replacement callback after deciding what text should remain.
  });
  // Finish the CSS comment-removal helper.
}

// Remove HTML comments without interpreting markup or changing element attributes.
function removeHtmlComments(source) {
  // HTML comments can safely be removed as complete opening and closing comment pairs.
  return source.replace(HTML_COMMENT_PATTERN, "");
  // Finish the HTML comment-removal helper.
}

// Remove blank lines left after comment removal so the result is compact.
function removeEmptyLines(source) {
  // Split both Windows and Unix line endings into individual lines.
  const lines = source.split(/\r?\n/);
  // Keep every line containing code or text, and discard only whitespace-only lines.
  const compactLines = lines.filter((line) => line.trim().length > 0);
  // Preserve the file's final newline when the original file had one.
  // Purpose: Return the result to the code that called this helper.
  return compactLines.join("\n") + (source.endsWith("\n") ? "\n" : "");
// Purpose: Close the current function, loop, conditional, or callback.
}

// Choose the correct comment remover from a source file's extension.
// Purpose: Define a reusable helper for this part of the comment-removal workflow.
function removeCommentsFromFile(filePath) {
  // Read the file as UTF-8 so source text remains readable and consistent.
  // Purpose: Declare the value or configuration used by this step.
  const original = fs.readFileSync(filePath, "utf8");
  // Identify the file type without relying on case-sensitive extensions.
  // Purpose: Declare the value or configuration used by this step.
  const extension = path.extname(filePath).toLowerCase();
  // Select the matching remover while leaving unsupported formats alone.
  // Purpose: Declare the value or configuration used by this step.
  let stripped = original;
  // Purpose: Check this condition before selecting the next action.
  if (extension === ".html") stripped = removeHtmlComments(original);
  // Purpose: Handle the alternative case when the earlier condition did not match.
  else if (extension === ".css") stripped = removeCssComments(original);
  // Purpose: Handle the alternative case when the earlier condition did not match.
  else if (extension === ".js") stripped = removeJavaScriptComments(original);
  // Compact blank lines after the comments have been removed.
  // Purpose: Declare the value or configuration used by this step.
  const cleaned = removeEmptyLines(stripped);
  // Avoid rewriting unchanged files so Git reports only real changes.
  // Purpose: Check this condition before selecting the next action.
  if (cleaned !== original) {
    // Write the compact source back to its original path.
    // Purpose: Run this statement as the next step in the comment-removal process.
    fs.writeFileSync(filePath, cleaned, "utf8");
    // Return true so the summary can count this changed file.
    // Purpose: Return the result to the code that called this helper.
    return true;
  // Purpose: Close the current function, loop, conditional, or callback.
  }
  // Return false when this file did not need any edits.
  // Purpose: Return the result to the code that called this helper.
  return false;
// Purpose: Close the current function, loop, conditional, or callback.
}

// Walk a folder recursively and collect every supported active source file.
// Purpose: Define a reusable helper for this part of the comment-removal workflow.
function findSourceFiles(directoryPath, collectedFiles = []) {
  // Read directory entries with their type so folders can be skipped or visited.
  // Purpose: Declare the value or configuration used by this step.
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  // Check each entry independently so one ignored folder does not stop the scan.
  // Purpose: Repeat this operation for each item in the collection.
  for (const entry of entries) {
    // Ignore the protected reference, dependency, Git, and tool directories by name.
    // Purpose: Check this condition before selecting the next action.
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    // Build the absolute path needed by Node's filesystem operations.
    // Purpose: Declare the value or configuration used by this step.
    const entryPath = path.join(directoryPath, entry.name);
    // Search child folders while keeping the same accumulating file list.
    // Purpose: Check this condition before selecting the next action.
    if (entry.isDirectory()) {
      // Purpose: Run this statement as the next step in the comment-removal process.
      findSourceFiles(entryPath, collectedFiles);
      // Purpose: Skip the rest of this iteration and move to the next entry.
      continue;
    // Purpose: Close the current function, loop, conditional, or callback.
    }
    // Ignore non-files and file extensions outside HTML, CSS, and JavaScript.
    // Purpose: Check this condition before selecting the next action.
    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    // Add the active source file to the list for later processing.
    // Purpose: Run this statement as the next step in the comment-removal process.
    collectedFiles.push(entryPath);
  // Purpose: Close the current function, loop, conditional, or callback.
  }
  // Return every source path discovered below this folder.
  // Purpose: Return the result to the code that called this helper.
  return collectedFiles;
// Purpose: Close the current function, loop, conditional, or callback.
}

// Start the comment-removal run and report a small summary for the user.
// Purpose: Define a reusable helper for this part of the comment-removal workflow.
function main() {
  // Find active source files below the repository while honoring the ignore list.
  // Purpose: Declare the value or configuration used by this step.
  const sourceFiles = findSourceFiles(ROOT_DIRECTORY);
  // Count changed files separately from files that were already compact and clean.
  // Purpose: Declare the value or configuration used by this step.
  let changedFiles = 0;
  // Process the files one at a time so each filesystem operation is easy to trace.
  // Purpose: Repeat this operation for each item in the collection.
  for (const filePath of sourceFiles) {
    // Count each successful rewrite without changing the file's repository-relative path.
    // Purpose: Check this condition before selecting the next action.
    if (removeCommentsFromFile(filePath)) changedFiles += 1;
  // Purpose: Close the current function, loop, conditional, or callback.
  }
  // Print the number of source files inspected and changed.
  // Purpose: Show a message in the terminal so the user can see the result.
  console.log("Comment removal complete: " + changedFiles + " of " + sourceFiles.length + " source files changed.");
  // Remind the user that Git can restore their committed study-mode comments.
  // Purpose: Show a message in the terminal so the user can see the result.
  console.log("To restore tracked files, run: git restore .");
// Purpose: Close the current function, loop, conditional, or callback.
}

// Run the utility only when Node executes this file directly.
// Purpose: Run the utility's final command or exported setup.
main();
