# Migration Log

This log chronologically records file creation, removal, moves, modifications, architectural changes, and Git commits for the Lux-Omni migration. Dates use YYYY-MM-DD. Historical entries are retained so the reset of the working tree does not erase the audit trail.

---

* **Date:** 2026-10-14
* **Commit:** `chore: initialize migration log for modular architecture`
* **Changes:**
  * Created `MIGRATION_LOG.md` at the repository root to document migration changes and Git commits.

---

* **Date:** 2026-10-14
* **Commit:** `chore: scaffold event-driven modular architecture and initialize migration log`
* **Changes:**
  * Updated `MIGRATION_LOG.md` with the scaffold record.
  * Created the initial scaffold under the then-used `Luxy/` directory:
    * `Luxy/site/index.html`
    * `Luxy/site/styles.css`
    * `Luxy/site/js/main.js`
    * `Luxy/site/js/core/EventBus.js`
    * `Luxy/site/js/core/Store.js`
    * `Luxy/site/js/services/DropboxApi.js`
    * `Luxy/site/js/services/ClipboardDb.js`
    * `Luxy/site/js/services/CaptureService.js`
    * `Luxy/site/js/adapters/PdfAdapter.js`
    * `Luxy/site/js/adapters/MarkdownAdapter.js`
    * `Luxy/site/js/adapters/ImageAdapter.js`
    * `Luxy/site/js/adapters/YouTubeAdapter.js`
    * `Luxy/site/js/ui/WorkspaceUI.js`
    * `Luxy/site/js/ui/SmartToolbarUI.js`
    * `Luxy/site/js/ui/DropboxModalUI.js`
    * `Luxy/site/js/ui/SnippingEditorUI.js`
    * `Luxy/site/js/ui/ToastUI.js`
    * `Luxy/site/js/utils/FileClassifier.js`
    * `Luxy/site/js/utils/Security.js`
    * `Luxy/site/components/pdf-editor.css`
    * `Luxy/site/components/dropbox-ui.css`
    * `Luxy/site/components/snipping-tool.css`
    * `Luxy/clipboard.html`
    * `Luxy/privacy.html`
  * All 24 scaffold files were empty; no implementation code was added.

---

* **Date:** 2026-10-14
* **Commit:** `chore: scaffold event-driven modular architecture and initialize migration log`
* **Changes:**
  * Removed the 24 incorrectly nested scaffold files under `Luxy/`:
    * `Luxy/site/index.html`
    * `Luxy/site/styles.css`
    * `Luxy/site/js/main.js`
    * `Luxy/site/js/core/EventBus.js`
    * `Luxy/site/js/core/Store.js`
    * `Luxy/site/js/services/DropboxApi.js`
    * `Luxy/site/js/services/ClipboardDb.js`
    * `Luxy/site/js/services/CaptureService.js`
    * `Luxy/site/js/adapters/PdfAdapter.js`
    * `Luxy/site/js/adapters/MarkdownAdapter.js`
    * `Luxy/site/js/adapters/ImageAdapter.js`
    * `Luxy/site/js/adapters/YouTubeAdapter.js`
    * `Luxy/site/js/ui/WorkspaceUI.js`
    * `Luxy/site/js/ui/SmartToolbarUI.js`
    * `Luxy/site/js/ui/DropboxModalUI.js`
    * `Luxy/site/js/ui/SnippingEditorUI.js`
    * `Luxy/site/js/ui/ToastUI.js`
    * `Luxy/site/js/utils/FileClassifier.js`
    * `Luxy/site/js/utils/Security.js`
    * `Luxy/site/components/pdf-editor.css`
    * `Luxy/site/components/dropbox-ui.css`
    * `Luxy/site/components/snipping-tool.css`
    * `Luxy/clipboard.html`
    * `Luxy/privacy.html`
  * Created the corrected scaffold directly at repository root:
    * `site/index.html`
    * `site/styles.css`
    * `site/js/main.js`
    * `site/js/core/EventBus.js`
    * `site/js/core/Store.js`
    * `site/js/services/DropboxApi.js`
    * `site/js/services/ClipboardDb.js`
    * `site/js/services/CaptureService.js`
    * `site/js/adapters/PdfAdapter.js`
    * `site/js/adapters/MarkdownAdapter.js`
    * `site/js/adapters/ImageAdapter.js`
    * `site/js/adapters/YouTubeAdapter.js`
    * `site/js/ui/WorkspaceUI.js`
    * `site/js/ui/SmartToolbarUI.js`
    * `site/js/ui/DropboxModalUI.js`
    * `site/js/ui/SnippingEditorUI.js`
    * `site/js/ui/ToastUI.js`
    * `site/js/utils/FileClassifier.js`
    * `site/js/utils/Security.js`
    * `site/components/pdf-editor.css`
    * `site/components/dropbox-ui.css`
    * `site/components/snipping-tool.css`
    * `clipboard.html`
    * `privacy.html`
  * Kept all 24 corrected scaffold files empty; no implementation code was added.
  * Retained the prior Git commits to preserve the audit trail; the current tree contains only the corrected root-level structure and `MIGRATION_LOG.md`.

---

* **Date:** 2026-10-14
* **Commit:** `feat(core): implement heavily-commented EventBus and Store for decoupled state management`
* **Changes:**
  * Implemented `site/js/core/EventBus.js` with a private `Map`, per-event callback `Set` collections, and the `subscribe(event, callback)`, `publish(event, data)`, and `unsubscribe(event, callback)` methods.
  * Exported one EventBus singleton for use across application modules.
  * Implemented `site/js/core/Store.js` with private application state and the initial values for `theme`, `focusMode`, `sidebarOpen`, `activeLayout`, and `viewports`.
  * Added `getState()` to return a defensive copy of the state and the nested viewport map.
  * Added `setState(updates)` to merge updates, preserve unmodified viewport slots, publish `STATE_CHANGED` immediately, and return a copy of the updated state.
  * Added `init()` to read the legacy `lux-pdf-viewer-theme`, `lux-pdf-viewer-focus-mode`, and `lux-pdf-viewer-sidebar-open` localStorage keys and restore recognized values safely.
  * Added beginner-friendly explanatory comments throughout both core modules; no other application modules were changed.

---

* **Date:** 2026-10-14
* **Commit:** `feat(ui): implement WorkspaceUI and main.js to handle Theme and Focus Mode via EventBus`
* **Changes:**
  * Implemented `site/js/ui/WorkspaceUI.js` as an ES6 class that caches `#theme-toggle` and `#focus-mode-toggle` and safely handles pages where either button is absent.
  * Connected theme and focus-mode click listeners to `Store.setState()`; click handlers request state changes rather than manipulating the DOM directly.
  * Subscribed `WorkspaceUI` to `STATE_CHANGED` through the shared EventBus and applied the initial state at construction.
  * Added state-driven document attributes for dark theme and focus mode, accessible labels and pressed state, and optional theme-icon updates.
  * Made `handleStateChange()` accept both EventBus payloads shaped as `{ updates, state }` and the raw state snapshot returned by `Store.getState()`.
  * Implemented `site/js/main.js` to wait for `DOMContentLoaded`, call `Store.init()`, and instantiate `WorkspaceUI`.
  * Added beginner-friendly explanatory comments throughout both files; no other application modules were changed.

---

* **Date:** 2026-10-14
* **Commit:** `chore(reference): add legacy app.js reference snapshot`
* **Changes:**
  * Created `_legacy_reference/site/app.js` as a verbatim UTF-8 copy of `LuxrajKayal/Luxy/site/app.js` from the legacy repository's `main` branch.
  * Created `_legacy_reference/REFERENCE_SNAPSHOT.md` with the source blob SHA, source size, and a clear note that this is a partial snapshot rather than a full repository clone.
  * Did not modify the source `LuxrajKayal/Luxy` repository.
  * Documented that the current connector cannot copy binary PNG assets or check out the PDF.js and pdf-lib Git submodules.

---

* **Date:** 2026-10-14
* **Commit:** `feat(ui): implement WorkspaceUI with sidebar, layout switching, and divider, and wire main.js`
* **Changes:**
  * Expanded `site/js/ui/WorkspaceUI.js` to manage the sidebar, Full Screen and Split Screen layout buttons, and the split divider through the shared Store and EventBus.
  * Read the exact workspace control IDs from `_legacy_reference/site/index.html` and ported the original divider pointer-position formula, pointer-capture lifecycle, 20–80% clamp, and ArrowLeft/ArrowRight/Home/End keyboard behavior from `_legacy_reference/site/app.js`.
  * Preserved the existing theme and focus-mode state handling and added sidebar width, grid, and accessibility updates driven by `sidebarOpen`.
  * Added layout visibility, divider visibility, and `aria-pressed` updates driven by `activeLayout`.
  * Updated `site/js/main.js` to initialize saved preferences before creating `WorkspaceUI`, with beginner-friendly comments throughout the updated UI code.

---

* **Date:** 2026-10-14
* **Commit:** `feat(ui): port legacy HTML/CSS to new modular structure and repoint asset paths`
* **Changes:**
  * Copied the existing workspace stylesheet into `site/styles.css` without changing its contents.
  * Copied the PDF editor, cloud integration, snipping tool, and temporary log stylesheets into `site/components/` without changing their CSS rules.
  * Ported the existing page markup into `site/index.html` while preserving visible UI text, class names, DOM IDs, and layout markup.
  * Repointed component stylesheet links to `components/` and replaced the scattered script blocks with the single `js/main.js` module entry point.
  * Kept the CSS files byte-for-byte identical to their reference copies; no interface redesign was made.

---

* **Date:** 2026-10-14
* **Commit:** `chore(deploy): add GitHub Pages workflow for Lux Omni`
* **Changes:**
  * Added `.github/workflows/pages.yml` to publish the contents of `site/` through GitHub Actions when relevant changes reach `main`, with a manual workflow-dispatch option.
  * Restored the three icon assets used by the page into `site/icons/` using exact copies from the reference snapshot.
  * Configured the workflow with the permissions required by GitHub Pages deployment and the `github-pages` deployment environment.
