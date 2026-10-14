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

---

* **Date:** 2026-10-14
* **Commit:** `feat(services): implement secure, in-memory Dropbox API service`
* **Changes:**
  * Created `site/js/services/DropboxApi.js` as a class-based singleton using the exact public app key, Dropbox OAuth/API/content endpoints, and requested scopes from the configuration reference.
  * Ported OAuth authorization-code with PKCE S256, callback state verification, current-account lookup, folder listing and pagination, file download/upload, revision-aware save, connection checks, and token revocation.
  * Stored the active access token and its expiry exclusively in private in-memory class fields; did not migrate, read, or write access tokens or token expiry values in browser storage.
  * Limited `localStorage` usage to temporary state-specific OAuth PKCE state and verifier keys, and removed those keys after callback handling, sign-out, or revocation.
  * Added beginner-friendly comments, consistent Dropbox API errors, path validation, and safe Dropbox-API-Arg header encoding; no other application files were changed.

---

* **Date:** 2026-10-14
* **Commit:** `fix(ui): restore top bar hover and scroll reveal logic for Focus Mode`
* **Changes:**
  * Cached the existing `.topbar` element in `WorkspaceUI` and ported the legacy scroll direction logic using the current and previous scroll positions.
  * Restored the mouse-near-top reveal check at `event.clientY <= 10`, plus the top bar's `mouseenter`, `mouseleave`, and keyboard `focusin` behavior.
  * Bound reveal and hide behavior to the shared `Store.getState().focusMode` value so the handlers are inactive during normal browsing.
  * Cleared the reveal class when Focus Mode is turned off and added beginner-friendly comments for the new event handling.

---

* **Date:** 2026-10-14
* **Commit:** `fix(security): remove inline scripts and styles from HTML`
* **Changes:**
  * Audited `site/index.html` for inline scripts, HTML event-handler attributes, style blocks, and style attributes; the page already used one external module entry point and contained no inline JavaScript or event-handler attributes.
  * Removed seven inline swatch background styles and moved their exact colors to `site/components/snipping-tool.css`.
  * Moved the YouTube icon fill colors into `site/styles.css` and the screenshot-selection icon's dashed outline into `site/components/snipping-tool.css`, preserving the existing appearance.
  * Reviewed the active JavaScript import boundaries: UI code consumes Core state/events, Core does not import UI or Services, and the Dropbox service remains isolated from UI modules.
  * Confirmed that non-empty JavaScript modules contain frequent beginner-friendly explanatory comments; empty scaffold modules remain intentionally unimplemented.

---

* **Date:** 2026-10-14
* **Commit:** `fix(state): persist focus mode and workspace preferences`
* **Changes:**
  * Compared the current Focus Mode and top-bar behavior with the previous implementation; the reveal and hide event handlers were already present, but state changes were not being saved.
  * Added current application-specific storage keys for the theme, Focus Mode, and sidebar state, while retaining fallback reads so existing preferences can be migrated.
  * Centralized preference persistence in the shared Store, validating values and catching storage errors so the interface remains usable when browser storage is unavailable.
  * Confirmed that restoring Focus Mode applies the saved state before the workspace UI is initialized, allowing the top bar to start hidden and reveal on the same pointer and scroll triggers as before.
 
---

* **Date:** 2026-10-14
* **Commit:** `feat(ui): implement DropboxModalUI and connect top bar to Dropbox API`
* **Changes:**
  * Implemented `site/js/ui/DropboxModalUI.js` as a commented ES6 class that reads the exact Dropbox control and modal IDs from the legacy UI and page markup.
  * Connected the top-bar and sidebar Dropbox buttons to the current service's authorization flow; added connection verification, status text, OAuth callback cleanup, folder browsing, file selection, file uploads, disconnect, and revision-aware Sync behavior.
  * Published `FILE_SELECTED` when a file is selected and `FILE_OPEN_REQUESTED` with the downloaded file Blob, metadata, revision, and target viewport when a destination is chosen, avoiding direct viewport calls from the modal class.
  * Published Dropbox connection and sync lifecycle events for other modules to observe, while keeping access tokens inside the Dropbox API service.
  * Updated `site/js/main.js` to instantiate `DropboxModalUI` alongside `WorkspaceUI` after saved preferences are initialized.
 
---

* **Date:** 2026-10-14
* **Commit:** `docs/build: enforce codebase-wide comments and add dev-tools for comment removal`
* **Changes — Step 1, study-mode documentation:**
  * Added beginner-friendly HTML comments around the active document tags in `site/index.html`, explaining the page structure, controls, dialogs, icon shapes, and accessible labels without changing IDs, classes, attributes, or behavior.
  * Added comments describing every active CSS selector/rule and each CSS property declaration in `site/styles.css` and the four stylesheets under `site/components/`, preserving the original selectors and declarations.
  * Added a plain-English purpose comment before each executable JavaScript source line in the active modules under `site/js/`, and added intentional-scaffold notes to empty modules so learners know they are not implemented yet.
  * Added placeholder explanations to the currently empty root-level `clipboard.html` and `privacy.html` pages.
  * Explicitly excluded `_legacy_reference/` from this documentation pass.
* **Changes — Step 2, developer utility:**
  * Created `dev-tools/remove-comments.js` using Node's built-in `fs` and `path` modules to recursively process active HTML, CSS, and JavaScript files, strip comment patterns, and remove empty lines.
  * Configured the utility to ignore `_legacy_reference/`, `.git/`, `node_modules/`, and `dev-tools/`.
  * Created `dev-tools/README.md` explaining how to run the utility and restore tracked study-mode files with Git, including a warning that restore commands discard other unstaged tracked edits too.
  * Documented regex parsing limitations so that template-literal edge cases are not presented as universally safe.
 
---

* **Date:** 2026-10-14
* **Commit:** `feat(adapters): implement event-driven PdfAdapter with strict separation and commenting`
* **Changes:**
  * Read `_legacy_reference/site/pdf-engine.js` and the matching viewport markup in `_legacy_reference/site/index.html` before implementing the adapter.
  * Ported the Mozilla PDF.js viewing and annotation workflow into `site/js/adapters/PdfAdapter.js`, including page navigation, zoom, rotation, search, supported annotation tools, export, dirty-state tracking, and PDF document cleanup.
  * Added the `PdfAdapter` ES6 class, which subscribes to `FILE_OPEN_REQUESTED`, identifies PDFs from MIME type, filename, or file signature, and renders to the requested Full, Left, or Right viewport.
  * Added cancellation checks so a slow or superseded PDF load cannot overwrite a newer document, and added `PDF_OPENED`, `PDF_DOCUMENT_DIRTY`, `PDF_DOCUMENT_EDITED`, and `FILE_OPEN_FAILED` events for decoupled consumers.
  * Removed the legacy JavaScript `root.style` assignments and moved the equivalent host layout and background values into `site/components/pdf-editor.css`; the viewer loads CSS files rather than injecting CSS text.
  * Wired `PdfAdapter` into `site/js/main.js` alongside the UI classes and maintained beginner-friendly explanations for new executable lines and CSS declarations.



---

* **Date:** 2026-10-14
* **Commit:** `fix(ui): restore viewport window controls, sidebar viewport toggles, and initial empty state`
* **Changes — legacy investigation:**
  * Read `_legacy_reference/site/app.js` and `_legacy_reference/site/index.html` before editing active files; the reference snapshot remains unchanged.
  * Confirmed the legacy controller began with `activeViewportMode = null` and hid `#viewport-composition` when no active window or minimized restore tile existed, preserving `.workspace-empty-state`.
  * Confirmed the window-control IDs are `#viewport-minimize-full`, `#viewport-minimize-left`, `#viewport-minimize-right`, `#viewport-close-full`, `#viewport-close-left`, and `#viewport-close-right`. Restore entries live in `#viewport-minimized-items` inside `#viewport-minimized-dock`.
  * Confirmed the sidebar layout buttons are `#viewport-fullscreen` and `#viewport-split-screen`, routed by the legacy controller to `setViewportMode("full")` and `setViewportMode("split")`.
* **Changes — active implementation:**
  * Changed `Store.activeLayout` from `"full"` to `null` so startup remains a welcome/empty workspace.
  * Restored minimize/close click handlers, minimized dock restore buttons, Full/Split layout transitions, and the solo-pane Split Screen state in `WorkspaceUI`.
  * Subscribed the workspace to `FILE_OPEN_REQUESTED` and `PDF_OPENED` so it activates at the request stage and remains active after a PDF renderer confirms success.
  * Added `VIEWPORT_CLOSE_REQUESTED` handling to `PdfAdapter` so closing a viewport invalidates pending PDF renders and releases the active PDF.js renderer. The adapter stores and clears the viewport filename for restore labels.
  * Removed direct JavaScript style-property writes from `WorkspaceUI`; the sidebar remains CSS-controlled and split-pane resizing selects stylesheet classes in `site/styles.css`.
