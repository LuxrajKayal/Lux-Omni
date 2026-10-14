// Use the shared Dropbox service so this class never handles access tokens directly.
// Purpose: Import a shared module so this file can reuse its functionality.
import DropboxApi from '../services/DropboxApi.js';
// Publish file actions through the application's shared event system.
// Purpose: Import a shared module so this file can reuse its functionality.
import EventBus from '../core/EventBus.js';

// Keep the icon SVG namespace in one place when building safe, static icons.
// Purpose: Declare a variable that stores a value needed by this logic.
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Connect Dropbox controls, the file manager, and the shared event system.
// Purpose: Run this statement as the next step in the surrounding operation.
export class DropboxModalUI {
  // Find the existing page controls and wire their user actions.
  // Purpose: Run this statement as the next step in the surrounding operation.
  constructor() {
    // Cache the non-interactive top-bar region that reports Dropbox connection status.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.topbarStatus = document.querySelector('#dropbox-topbar-status');
    // Cache the connection label displayed inside the status region.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.statusIndicator = document.querySelector('#dropbox-status-indicator');
    // Cache the action that saves edited viewport content back to Dropbox.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.syncButton = document.querySelector('#dropbox-sync-button');
    // Cache the action that disconnects the current Dropbox session.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.disconnectButton = document.querySelector('#dropbox-disconnect-button');
    // Cache the sidebar shortcut that opens the same Dropbox browser.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.sidebarButton = document.querySelector('#dropbox-sidebar-button');

    // Cache the modal and all controls used to browse the account's files.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.modal = document.querySelector('#dropbox-file-manager');
    // Cache the modal close button so focus can be restored when it closes.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.modalClose = document.querySelector('#dropbox-file-manager-close');
    // Cache the label showing the current Dropbox folder.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.currentLocation = document.querySelector('#dropbox-current-location');
    // Cache the navigation button that moves to a parent folder.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.backButton = document.querySelector('#dropbox-folder-back');
    // Cache the file input used to upload a file from this device.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.uploadInput = document.querySelector('#dropbox-upload-input');
    // Cache the list where folder and file rows will be rendered.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.fileList = document.querySelector('#dropbox-file-list');
    // Cache the message shown when a folder has no entries.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.emptyState = document.querySelector('#dropbox-empty-state');
    // Cache the accessible status line inside the file manager.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.managerStatus = document.querySelector('#dropbox-file-manager-status');
    // Cache the footer that appears after a file is selected.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.selectionActions = document.querySelector('#dropbox-selection-actions');
    // Cache the name of the selected file displayed in that footer.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.selectedName = document.querySelector('#dropbox-selected-name');
    // Cache the action that requests a file for the left viewport.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.addLeftButton = document.querySelector('#dropbox-add-left');
    // Cache the action that requests a file for the right viewport.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.addRightButton = document.querySelector('#dropbox-add-right');
    // Cache the action that requests a file for the full viewport.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.addFullButton = document.querySelector('#dropbox-add-full');
    // Cache the toast used for feedback outside the modal.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.toast = document.querySelector('#dropbox-ui-toast');

    // Track the current connection and browser location without exposing tokens.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isConnected = false;
    // Start browsing at the root of the Dropbox account.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.currentPath = '';
    // Keep the selected Dropbox entry until the user chooses another one.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.selectedFile = null;
    // Remember which Dropbox file was assigned to each viewport.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.activeSources = new Map();
    // Remember the most recent destination chosen for syncing.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.latestRoutedViewport = null;
    // Keep the element that had focus before opening the modal.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.previousFocus = null;
    // Count browser requests so stale folder responses cannot replace newer ones.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.browseRequestId = 0;
    // Give every open request an identifier for consumers of the event.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.assignmentRequestId = 0;
    // Prevent repeated disconnect actions from running at the same time.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isDisconnecting = false;
    // Prevent repeated sync actions from running at the same time.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isSyncing = false;
    // Keep the toast timer so a newer toast can replace the older one.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.toastTimer = null;

    // Connect every existing button to this class's corresponding action.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.wireEvents();
    // Paint a safe initial state before checking the current account.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.updateTopbarStatus(false);
    // Check for a Dropbox OAuth callback or an existing in-memory session.
    // Purpose: Run this statement as the next step in the surrounding operation.
    void this.initialize();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Turn errors into readable text without exposing internal stack traces.
  // Purpose: Run this statement as the next step in the surrounding operation.
  errorText(error) {
    // Prefer a service-provided summary, then a normal Error message.
    // Purpose: Return the result to the code that called this function.
    return error?.errorSummary || error?.message || String(error || 'Unknown error');
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Display a temporary message without injecting any HTML.
  // Purpose: Run this statement as the next step in the surrounding operation.
  setToast(message, kind = 'info') {
    // Stop if this page version does not include the toast element.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.toast) return;
    // Cancel the previous toast timer before replacing its message.
    // Purpose: Run this statement as the next step in the surrounding operation.
    window.clearTimeout(this.toastTimer);
    // Assign the message as text so file names cannot become markup.
    // Purpose: Set visible text without interpreting the supplied value as HTML.
    this.toast.textContent = message;
    // Let the stylesheet distinguish success, information, and error messages.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    this.toast.dataset.kind = kind;
    // Use the built-in hidden attribute to show or hide the toast.
    // Purpose: Show or hide this interface element using its hidden state.
    this.toast.hidden = !message;
    // Hide a visible message after six seconds.
    // Purpose: Check this condition before choosing which branch should run.
    if (message) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.toastTimer = window.setTimeout(() => {
        // Do not leave old feedback on the page after its timeout.
        // Purpose: Show or hide this interface element using its hidden state.
        this.toast.hidden = true;
      // Purpose: Close the current block, handler, object, or expression.
      }, 6000);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Update the modal's live status line and its visual status kind.
  // Purpose: Run this statement as the next step in the surrounding operation.
  setManagerStatus(message, kind = 'info') {
    // Leave the page usable even if the status element is not present.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.managerStatus) return;
    // Use text content for messages, including any Dropbox-provided names.
    // Purpose: Set visible text without interpreting the supplied value as HTML.
    this.managerStatus.textContent = message;
    // Match the state to the existing stylesheet's status colors.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    this.managerStatus.dataset.kind = kind;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Update the top-bar connection label and the actions that need a session.
  // Purpose: Run this statement as the next step in the surrounding operation.
  updateTopbarStatus(isConnected) {
    // Normalize any service result to a strict boolean.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isConnected = Boolean(isConnected);

    // Update the visible connection text and data attribute together.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.statusIndicator) {
      // Purpose: Set visible text without interpreting the supplied value as HTML.
      this.statusIndicator.textContent = this.isConnected ? 'Connected 🟢' : 'Disconnected 🔴';
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.statusIndicator.dataset.state = this.isConnected ? 'connected' : 'disconnected';
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Keep the status-only region's accessible label synchronized with the verified state.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.topbarStatus) {
      // Describe the connection state without suggesting that this region opens files or connects.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.topbarStatus.setAttribute(
        // Purpose: Run this statement as the next step in the surrounding operation.
        'aria-label',
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.isConnected ? 'Dropbox connection status: Connected' : 'Dropbox connection status: Disconnected',
      // Purpose: Close the current call or grouped expression.
      );
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Sync requires a working session and must not run twice at once.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.syncButton) {
      // Purpose: Enable or disable this control to match the current application state.
      this.syncButton.disabled = !this.isConnected || this.isSyncing;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Disconnect requires a working session and must not run twice at once.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.disconnectButton) {
      // Purpose: Enable or disable this control to match the current application state.
      this.disconnectButton.disabled = !this.isConnected || this.isDisconnecting;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Let other modules react when the verified connection state changes.
    // Purpose: Publish an event so other modules can respond without direct coupling.
    EventBus.publish('DROPBOX_CONNECTION_CHANGED', { connected: this.isConnected });
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Remove OAuth callback details from the address bar after processing.
  // Purpose: Run this statement as the next step in the surrounding operation.
  cleanOAuthCallbackParameters() {
    // Parse the current URL so unrelated query parameters are preserved.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const url = new URL(window.location.href);
    // Remove only values used by the Dropbox authorization redirect.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const oauthKeys = ['code', 'state', 'error', 'error_description', 'scope', 'token_access_type'];
    // Remember whether the address needs to be updated.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let changed = false;

    // Check each callback parameter instead of clearing the whole query string.
    // Purpose: Repeat this operation for each item in the loop.
    for (const key of oauthKeys) {
      // Purpose: Check this condition before choosing which branch should run.
      if (url.searchParams.has(key)) {
        // Purpose: Run this statement as the next step in the surrounding operation.
        url.searchParams.delete(key);
        // Purpose: Run this statement as the next step in the surrounding operation.
        changed = true;
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Replace the visible address only when a Dropbox parameter was found.
    // Purpose: Check this condition before choosing which branch should run.
    if (changed) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Ask Dropbox to verify the short-lived token restored or cached by the service.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async refreshConnectionStatus({ notifyOnError = false } = {}) {
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // The service checks the account instead of revealing its private token.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const result = await DropboxApi.checkConnection();
      // Update button states only from the service's verified result.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(Boolean(result?.connected));
      // Return the normalized status for callers that need to branch.
      // Purpose: Return the result to the code that called this function.
      return Boolean(result?.connected);
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Treat an unverified connection as disconnected in the visible UI.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(false);
      // Show the technical reason only when the current action needs feedback.
      // Purpose: Check this condition before choosing which branch should run.
      if (notifyOnError) {
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.setToast('Could not verify the Dropbox connection: ' + this.errorText(error), 'error');
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Report that the connection could not be verified.
      // Purpose: Return the result to the code that called this function.
      return false;
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Handle the OAuth callback or verify the saved session on a normal page load.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async initialize() {
    // Look for the authorization code or error returned by Dropbox.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const params = new URLSearchParams(window.location.search);
    // Recognize both successful and denied authorization callbacks.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const hasOAuthCallback = params.has('code') || params.has('error') || params.has('error_description');

    // Handle the callback only when the URL contains OAuth response fields.
    // Purpose: Check this condition before choosing which branch should run.
    if (hasOAuthCallback) {
      // Keep any error so the connection status can still be refreshed afterward.
      // Purpose: Declare a variable that stores a value needed by this logic.
      let callbackError = null;
      // Purpose: Start a protected operation so failures can be handled cleanly.
      try {
        // Verify state and exchange the authorization code using PKCE.
        // Purpose: Wait for the asynchronous operation to finish before continuing.
        await DropboxApi.handleOAuthCallback();
      // Purpose: Close the current block, handler, object, or expression.
      } catch (error) {
        // Remember the error instead of skipping the status refresh.
        // Purpose: Run this statement as the next step in the surrounding operation.
        callbackError = error;
      // Purpose: Close the current block, handler, object, or expression.
      } finally {
        // Ensure OAuth parameters are removed even if callback validation fails.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.cleanOAuthCallbackParameters();
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Confirm the account after the callback has completed.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const connected = await this.refreshConnectionStatus();
      // Tell the user when the authorization could not be completed.
      // Purpose: Check this condition before choosing which branch should run.
      if (callbackError) {
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.setToast('Dropbox sign-in did not complete: ' + this.errorText(callbackError), 'error');
      // Purpose: Close the current block, handler, object, or expression.
      } else if (!connected) {
        // Avoid claiming a connection when the API could not verify it.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.setToast('Dropbox sign-in returned, but the connection could not be verified.', 'error');
      // Purpose: Close the current block, handler, object, or expression.
      }
      // The callback attempt is complete, so do not run a second initialization path.
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Normal page loads restore a valid saved session when available, then verify it with Dropbox.
    // Purpose: Wait for the asynchronous operation to finish before continuing.
    await this.refreshConnectionStatus();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Convert Dropbox root paths to the empty path accepted by the API.
  // Purpose: Run this statement as the next step in the surrounding operation.
  normalizePath(path) {
    // Dropbox represents the account root as an empty string or a slash.
    // Purpose: Check this condition before choosing which branch should run.
    if (!path || path === '/') return '';
    // Remove trailing slashes without altering an internal folder path.
    // Purpose: Return the result to the code that called this function.
    return String(path).replace(/\/+$/, '');
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Find the parent folder while keeping the account root as the final level.
  // Purpose: Run this statement as the next step in the surrounding operation.
  getParentPath(path) {
    // Normalize the path before looking for its last separator.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const normalized = this.normalizePath(path);
    // The root has no parent folder to navigate to.
    // Purpose: Check this condition before choosing which branch should run.
    if (!normalized) return '';
    // Find the position of the final path separator.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const separatorIndex = normalized.lastIndexOf('/');
    // A top-level folder's parent is the root; deeper folders lose one segment.
    // Purpose: Return the result to the code that called this function.
    return separatorIndex <= 0 ? '' : normalized.slice(0, separatorIndex);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Get a consistent Dropbox path for either normal or shared entries.
  // Purpose: Run this statement as the next step in the surrounding operation.
  getEntryPath(entry) {
    // Prefer the display path and use the lowercase form only as a fallback.
    // Purpose: Return the result to the code that called this function.
    return entry?.path_display || entry?.path_lower || '';
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Choose a stable identifier for marking the selected row.
  // Purpose: Run this statement as the next step in the surrounding operation.
  getEntryKey(entry) {
    // Prefer Dropbox's file ID, then its paths, and finally its name.
    // Purpose: Return the result to the code that called this function.
    return String(entry?.id || entry?.path_lower || entry?.path_display || entry?.name || '');
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Enable the Back button only after the user has entered a subfolder.
  // Purpose: Run this statement as the next step in the surrounding operation.
  updateBackButton() {
    // The root folder has no valid parent to navigate to.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.backButton) this.backButton.disabled = !this.currentPath;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Show or hide the selected-file actions at the bottom of the modal.
  // Purpose: Run this statement as the next step in the surrounding operation.
  updateSelectionBar() {
    // Convert the selected entry into a simple yes-or-no condition.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const hasSelection = Boolean(this.selectedFile);
    // Reveal the target buttons only when a file is selected.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.selectionActions) this.selectionActions.hidden = !hasSelection;
    // Use a safe text label instead of displaying file metadata as markup.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.selectedName) {
      // Purpose: Set visible text without interpreting the supplied value as HTML.
      this.selectedName.textContent = hasSelection
        // Purpose: Run this statement as the next step in the surrounding operation.
        ? this.selectedFile.name || 'Selected file'
        // Purpose: Run this statement as the next step in the surrounding operation.
        : 'No file selected';
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Create a static SVG icon without using HTML copied from external data.
  // Purpose: Run this statement as the next step in the surrounding operation.
  createEntryIcon(isFolder) {
    // Build an SVG element using the standard namespace.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    // Preserve the same icon coordinate system as the legacy user interface.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    svg.setAttribute('viewBox', '0 0 24 24');
    // Hide the decorative icon from assistive technology.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    svg.setAttribute('aria-hidden', 'true');

    // Draw the folder icon with its original simple outline.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const folderPaths = [
      // Purpose: Run this statement as the next step in the surrounding operation.
      'M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z',
    // Purpose: Run this statement as the next step in the surrounding operation.
    ];
    // Draw the file icon with its page outline and two short text lines.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const filePaths = [
      // Purpose: Run this statement as the next step in the surrounding operation.
      'M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20Z',
      // Purpose: Run this statement as the next step in the surrounding operation.
      'M14 3.5V8h4',
      // Purpose: Run this statement as the next step in the surrounding operation.
      'M9 13h6M9 16.5h6',
    // Purpose: Run this statement as the next step in the surrounding operation.
    ];

    // Choose the paths for the kind of entry being rendered.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const paths = isFolder ? folderPaths : filePaths;
    // Create every path node through the DOM API.
    // Purpose: Repeat this operation for each item in the loop.
    for (const pathData of paths) {
      // Purpose: Declare a variable that stores a value needed by this logic.
      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      // Use only the static path data defined in this module.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      path.setAttribute('d', pathData);
      // Add the path to the icon before adding the icon to the row.
      // Purpose: Update the element's children to display the current content.
      svg.append(path);
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Return the completed folder or file icon.
    // Purpose: Return the result to the code that called this function.
    return svg;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Format bytes into a readable file size for the row's secondary label.
  // Purpose: Run this statement as the next step in the surrounding operation.
  formatBytes(bytes) {
    // Ignore values that are absent, negative, or not numeric.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const value = Number(bytes);
    // Purpose: Check this condition before choosing which branch should run.
    if (!Number.isFinite(value) || value < 0) return 'File';
    // Small files are easier to read as bytes.
    // Purpose: Check this condition before choosing which branch should run.
    if (value < 1024) return value + ' B';

    // Convert larger sizes through the common binary units.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const units = ['KB', 'MB', 'GB', 'TB'];
    // Purpose: Declare a variable that stores a value needed by this logic.
    let size = value / 1024;
    // Purpose: Declare a variable that stores a value needed by this logic.
    let unitIndex = 0;
    // Continue converting until the value fits or the largest unit is reached.
    // Purpose: Repeat the operation while its condition remains true.
    while (size >= 1024 && unitIndex < units.length - 1) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      size /= 1024;
      // Purpose: Run this statement as the next step in the surrounding operation.
      unitIndex += 1;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Keep the displayed result compact without hiding the chosen unit.
    // Purpose: Return the result to the code that called this function.
    return size.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' ' + units[unitIndex];
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Build a clickable row for one folder or file returned by Dropbox.
  // Purpose: Run this statement as the next step in the surrounding operation.
  createFileRow(entry) {
    // Distinguish a folder from a downloadable file using Dropbox's tag.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isFolder = entry?.['.tag'] === 'folder';
    // Create the list item that will contain the row button.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const item = document.createElement('li');
    // Purpose: Run this statement as the next step in the surrounding operation.
    item.className = 'dropbox-ui-file-item';

    // Use a button so each row works with the keyboard as well as the mouse.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const button = document.createElement('button');
    // Purpose: Run this statement as the next step in the surrounding operation.
    button.type = 'button';
    // Purpose: Run this statement as the next step in the surrounding operation.
    button.className = 'dropbox-ui-file-row';
    // Keep the entry identifier on the button so the selected row can be updated.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    button.dataset.entryKey = this.getEntryKey(entry);
    // Communicate the current selection state to assistive technology.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    button.setAttribute('aria-pressed', 'false');
    // Make the action clear even if the row's visual labels are clipped.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    button.setAttribute(
      // Purpose: Run this statement as the next step in the surrounding operation.
      'aria-label',
      // Purpose: Run this statement as the next step in the surrounding operation.
      (isFolder ? 'Open folder ' : 'Select file ') + (entry.name || 'unnamed item'),
    // Purpose: Close the current call or grouped expression.
    );

    // Create the icon and describe its kind for the existing styles.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const icon = document.createElement('span');
    // Purpose: Run this statement as the next step in the surrounding operation.
    icon.className = 'dropbox-ui-file-icon';
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    icon.dataset.kind = isFolder ? 'folder' : 'file';
    // Purpose: Update the element's children to display the current content.
    icon.append(this.createEntryIcon(isFolder));

    // Keep the primary and secondary text in separate spans for responsive layout.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const copy = document.createElement('span');
    // Purpose: Run this statement as the next step in the surrounding operation.
    copy.className = 'dropbox-ui-file-copy';
    // Purpose: Declare a variable that stores a value needed by this logic.
    const name = document.createElement('span');
    // Purpose: Run this statement as the next step in the surrounding operation.
    name.className = 'dropbox-ui-file-name';
    // Purpose: Set visible text without interpreting the supplied value as HTML.
    name.textContent = entry.name || 'Unnamed item';
    // Purpose: Declare a variable that stores a value needed by this logic.
    const meta = document.createElement('span');
    // Purpose: Run this statement as the next step in the surrounding operation.
    meta.className = 'dropbox-ui-file-meta';
    // Purpose: Set visible text without interpreting the supplied value as HTML.
    meta.textContent = isFolder ? 'Folder' : (entry.size != null ? this.formatBytes(entry.size) : 'File');

    // Assemble the row before attaching its click handler.
    // Purpose: Update the element's children to display the current content.
    copy.append(name, meta);
    // Purpose: Update the element's children to display the current content.
    button.append(icon, copy);

    // Opening a folder refreshes the list without selecting it as a document.
    // Purpose: Check this condition before choosing which branch should run.
    if (isFolder) {
      // Purpose: Register a handler so the application reacts when this event occurs.
      button.addEventListener('click', () => {
        // Purpose: Run this statement as the next step in the surrounding operation.
        void this.renderFileBrowser(this.getEntryPath(entry));
      // Purpose: Close the current block, handler, object, or expression.
      });
    // Purpose: Close the current block, handler, object, or expression.
    } else {
      // Selecting a file publishes an event instead of opening a viewport directly.
      // Purpose: Register a handler so the application reacts when this event occurs.
      button.addEventListener('click', () => this.selectFile(entry));
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Attach the finished button to its list item.
    // Purpose: Update the element's children to display the current content.
    item.append(button);
    // Return the item so the full result list can be assembled efficiently.
    // Purpose: Return the result to the code that called this function.
    return item;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Select a file and tell other modules which Dropbox entry the user chose.
  // Purpose: Run this statement as the next step in the surrounding operation.
  selectFile(entry) {
    // Keep the full metadata object because later API calls need its ID or path.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.selectedFile = entry;
    // Update the visible file name and selected-action controls.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.updateSelectionBar();

    // Mark the chosen row and clear the pressed state from other rows.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.fileList) {
      // Purpose: Repeat this operation for each item in the loop.
      for (const button of this.fileList.querySelectorAll('.dropbox-ui-file-row')) {
        // Purpose: Declare a variable that stores a value needed by this logic.
        const isSelected = button.dataset.entryKey === this.getEntryKey(entry);
        // Purpose: Update an HTML attribute or data field to reflect the current state.
        button.setAttribute('aria-pressed', String(isSelected));
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Publish only the selected file metadata; the token remains inside DropboxApi.
    // Purpose: Publish an event so other modules can respond without direct coupling.
    EventBus.publish('FILE_SELECTED', {
      // Purpose: Set this named property in the surrounding object or configuration.
      provider: 'dropbox',
      // Purpose: Set this named property in the surrounding object or configuration.
      file: entry,
      // Purpose: Set this named property in the surrounding object or configuration.
      path: this.getEntryPath(entry),
    // Purpose: Close the current block, handler, object, or expression.
    });
    // Tell the user which file is now selected for a viewport action.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.setManagerStatus('Selected ' + (entry.name || 'file') + '. Choose a viewport below.');
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Load a folder through the Dropbox service and draw the returned entries.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async renderFileBrowser(path = '') {
    // Remember the normalized location before starting the request.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.currentPath = this.normalizePath(path);
    // A new folder means no old file should remain selected.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.selectedFile = null;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.updateSelectionBar();
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.updateBackButton();

    // Update the folder label while avoiding any HTML interpretation.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.currentLocation) {
      // Purpose: Set visible text without interpreting the supplied value as HTML.
      this.currentLocation.textContent = this.currentPath || 'My Dropbox';
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.currentLocation.title = this.currentPath || 'My Dropbox';
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Remove old rows while the new folder is being loaded.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.fileList) this.fileList.replaceChildren();
    // Hide the empty-state message until the request completes.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.emptyState) this.emptyState.hidden = true;

    // Keep this request ID to ignore an older response that arrives too late.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const requestId = ++this.browseRequestId;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.setManagerStatus('Loading folder…');

    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Ask the service to combine all pages for this folder only.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const entries = await DropboxApi.listAllFolderEntries({
        // Purpose: Set this named property in the surrounding object or configuration.
        path: this.currentPath,
        // Purpose: Set this named property in the surrounding object or configuration.
        recursive: false,
        // Purpose: Set this named property in the surrounding object or configuration.
        limit: 1000,
      // Purpose: Close the current block, handler, object, or expression.
      });
      // Do not render this answer if another folder request has started.
      // Purpose: Check this condition before choosing which branch should run.
      if (requestId !== this.browseRequestId) return;

      // Sort folders before files and sort each group by display name.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const sorted = [...entries].sort((first, second) => {
        // Purpose: Declare a variable that stores a value needed by this logic.
        const firstIsFolder = first?.['.tag'] === 'folder';
        // Purpose: Declare a variable that stores a value needed by this logic.
        const secondIsFolder = second?.['.tag'] === 'folder';
        // Purpose: Check this condition before choosing which branch should run.
        if (firstIsFolder !== secondIsFolder) return firstIsFolder ? -1 : 1;
        // Purpose: Return the result to the code that called this function.
        return String(first?.name || '').localeCompare(String(second?.name || ''));
      // Purpose: Close the current block, handler, object, or expression.
      });

      // Build the full list off-screen before adding it to the page.
      // Purpose: Check this condition before choosing which branch should run.
      if (this.fileList) {
        // Purpose: Declare a variable that stores a value needed by this logic.
        const fragment = document.createDocumentFragment();
        // Purpose: Repeat this operation for each item in the loop.
        for (const entry of sorted) {
          // Ignore deleted entries because they are not selectable files or folders.
          // Purpose: Check this condition before choosing which branch should run.
          if (entry?.['.tag'] === 'deleted') continue;
          // Purpose: Update the element's children to display the current content.
          fragment.append(this.createFileRow(entry));
        // Purpose: Close the current block, handler, object, or expression.
        }
        // Purpose: Update the element's children to display the current content.
        this.fileList.append(fragment);
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Count only entries that are not marked as deleted.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const visibleEntries = sorted.filter(entry => entry?.['.tag'] !== 'deleted');
      // Purpose: Declare a variable that stores a value needed by this logic.
      const isEmpty = visibleEntries.length === 0;
      // Show the empty illustration only when no visible entries remain.
      // Purpose: Check this condition before choosing which branch should run.
      if (this.emptyState) this.emptyState.hidden = !isEmpty;
      // Report a helpful item count for non-empty folders.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus(
        // Purpose: Run this statement as the next step in the surrounding operation.
        isEmpty
          // Purpose: Run this statement as the next step in the surrounding operation.
          ? 'This folder has no files or folders.'
          // Purpose: Run this statement as the next step in the surrounding operation.
          : visibleEntries.length + ' item' + (visibleEntries.length === 1 ? '' : 's') + ' in this folder.',
      // Purpose: Close the current call or grouped expression.
      );
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Do not replace a newer request's status with an older error.
      // Purpose: Check this condition before choosing which branch should run.
      if (requestId !== this.browseRequestId) return;
      // Clear incomplete results so an error is not mistaken for an empty folder.
      // Purpose: Check this condition before choosing which branch should run.
      if (this.fileList) this.fileList.replaceChildren();
      // Purpose: Check this condition before choosing which branch should run.
      if (this.emptyState) this.emptyState.hidden = true;
      // Explain the failure in the modal without interrupting the user.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus('Could not load this folder: ' + this.errorText(error), 'error');
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Open the file manager only when the connection has been verified.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async openFileManager() {
    // Ignore the request if the markup or Dropbox connection is unavailable.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.isConnected || !this.modal) return;
    // Save the current element so focus can return after the dialog closes.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.previousFocus = document.activeElement;
    // Reveal the modal and stop background page scrolling.
    // Purpose: Show or hide this interface element using its hidden state.
    this.modal.hidden = false;
    // Purpose: Run this statement as the next step in the surrounding operation.
    document.body.classList.add('dropbox-ui-open');
    // Move focus into the dialog once the browser can lay out its controls.
    // Purpose: Run this statement as the next step in the surrounding operation.
    window.requestAnimationFrame(() => this.modalClose?.focus());
    // Load the account root so opening the modal always starts predictably.
    // Purpose: Wait for the asynchronous operation to finish before continuing.
    await this.renderFileBrowser('');
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Hide the modal and restore focus to the control that opened it.
  // Purpose: Run this statement as the next step in the surrounding operation.
  closeFileManager() {
    // Nothing needs to happen when this page has no file-manager modal.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.modal) return;
    // Hide the dialog and restore ordinary background scrolling.
    // Purpose: Show or hide this interface element using its hidden state.
    this.modal.hidden = true;
    // Purpose: Run this statement as the next step in the surrounding operation.
    document.body.classList.remove('dropbox-ui-open');
    // Clear the selection so reopening the modal starts without a stale target.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.selectedFile = null;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.updateSelectionBar();

    // Restore focus when the previous element still supports focus().
    // Purpose: Check this condition before choosing which branch should run.
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.previousFocus.focus();
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Release the reference after restoring focus.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.previousFocus = null;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Use the sidebar Dropbox button to browse files or begin authorization.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async handleDropboxButtonClick() {
    // Avoid navigating away while the user is disconnecting.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.isDisconnecting) return;
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Verify the account rather than trusting only a cached UI label.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const result = await DropboxApi.checkConnection();
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(Boolean(result?.connected));
      // An active session opens the file browser; otherwise begin OAuth.
      // Purpose: Check this condition before choosing which branch should run.
      if (result?.connected) {
        // Purpose: Wait for the asynchronous operation to finish before continuing.
        await this.openFileManager();
      // Purpose: Close the current block, handler, object, or expression.
      } else {
        // Purpose: Wait for the asynchronous operation to finish before continuing.
        await DropboxApi.beginAuthorization();
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Show a disconnected state if the check itself cannot be completed.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(false);
      // Explain the problem without starting a second authorization flow.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Could not check Dropbox. Please try again: ' + this.errorText(error), 'error');
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Upload the selected local file into the currently open Dropbox folder.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async handleUploadChange() {
    // Read the first file and stop if the file picker was cancelled.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const file = this.uploadInput?.files?.[0];
    // Purpose: Check this condition before choosing which branch should run.
    if (!file) return;

    // Build an absolute Dropbox path without creating a duplicate root slash.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const folder = this.normalizePath(this.currentPath);
    // Purpose: Declare a variable that stores a value needed by this logic.
    const destination = (folder || '') + '/' + file.name;

    // Disable the input during upload so the same control cannot overlap requests.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.uploadInput) this.uploadInput.disabled = true;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.setManagerStatus('Uploading ' + file.name + '…');

    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Add the file and let Dropbox rename it if the chosen name already exists.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const result = await DropboxApi.uploadFile({
        // Purpose: Set this named property in the surrounding object or configuration.
        path: destination,
        // Purpose: Run this statement as the next step in the surrounding operation.
        file,
        // Purpose: Set this named property in the surrounding object or configuration.
        mode: 'add',
        // Purpose: Set this named property in the surrounding object or configuration.
        autorename: true,
      // Purpose: Close the current block, handler, object, or expression.
      });
      // Show the name returned by Dropbox in case it had to be renamed.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus('Uploaded ' + (result?.name || file.name) + '.', 'success');
      // Refresh the current folder so the new file appears immediately.
      // Purpose: Wait for the asynchronous operation to finish before continuing.
      await this.renderFileBrowser(this.currentPath);
      // Provide a second confirmation in the unobtrusive toast.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Uploaded ' + file.name + ' to Dropbox.', 'success');
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Keep the modal open so the user can retry after seeing the error.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus('Upload failed: ' + this.errorText(error), 'error');
    // Purpose: Close the current block, handler, object, or expression.
    } finally {
      // Re-enable the file picker and clear the previous selection.
      // Purpose: Check this condition before choosing which branch should run.
      if (this.uploadInput) {
        // Purpose: Enable or disable this control to match the current application state.
        this.uploadInput.disabled = false;
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.uploadInput.value = '';
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Download a selected file and publish an event asking another module to open it.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async requestFileOpen(viewportType) {
    // Accept only the three viewport targets exposed in the page markup.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const allowedViewports = new Set(['left', 'right', 'full']);
    // Purpose: Check this condition before choosing which branch should run.
    if (!allowedViewports.has(viewportType)) {
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError('viewportType must be left, right, or full.');
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Require a file selection before asking for a viewport assignment.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const fileData = this.selectedFile;
    // Purpose: Check this condition before choosing which branch should run.
    if (!fileData || fileData['.tag'] !== 'file') {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Select a file before choosing a viewport.', 'info');
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Tell the user that bytes are being requested from Dropbox.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.setManagerStatus('Downloading ' + (fileData.name || 'file') + '…');
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Prefer a stable Dropbox file ID; use the original path if needed.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const fileId = typeof fileData.id === 'string' ? fileData.id.trim() : '';
      // Purpose: Declare a variable that stores a value needed by this logic.
      const identifier = fileId
        // Purpose: Run this statement as the next step in the surrounding operation.
        ? (fileId.startsWith('id:') ? fileId : 'id:' + fileId)
        // Purpose: Run this statement as the next step in the surrounding operation.
        : (fileData.path_lower || fileData.path_display);
      // Stop before the API call if Dropbox supplied no usable identifier.
      // Purpose: Check this condition before choosing which branch should run.
      if (!identifier) throw new Error('The selected entry has no usable Dropbox file ID or path.');

      // Get the bytes and metadata without passing an access token through the UI.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const downloaded = await DropboxApi.downloadFile(identifier);
      // The original path is required later to save edited content to the source file.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const originalPath = fileData.path_display || fileData.path_lower;
      // Purpose: Check this condition before choosing which branch should run.
      if (!originalPath) throw new Error('Dropbox did not provide the source path for this file.');

      // Prefer the downloaded revision so later saves can guard against overwrites.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const originalRevision = downloaded.metadata?.rev || fileData.rev || null;
      // Assign an ID so an independent event consumer can correlate its response.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const requestId = ++this.assignmentRequestId;
      // Package data for a renderer without exposing the Dropbox access token.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const assignment = {
        // Purpose: Run this statement as the next step in the surrounding operation.
        requestId,
        // Purpose: Set this named property in the surrounding object or configuration.
        provider: 'dropbox',
        // Purpose: Run this statement as the next step in the surrounding operation.
        fileData,
        // Purpose: Set this named property in the surrounding object or configuration.
        blob: downloaded.blob,
        // Purpose: Set this named property in the surrounding object or configuration.
        metadata: downloaded.metadata,
        // Purpose: Run this statement as the next step in the surrounding operation.
        originalPath,
        // Purpose: Run this statement as the next step in the surrounding operation.
        originalRevision,
        // Purpose: Run this statement as the next step in the surrounding operation.
        viewportType,
      // Purpose: Close the current block, handler, object, or expression.
      };

      // Save this source for the Sync button, without calling a viewport directly.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.activeSources.set(viewportType, {
        // Purpose: Run this statement as the next step in the surrounding operation.
        fileData,
        // Purpose: Run this statement as the next step in the surrounding operation.
        originalPath,
        // Purpose: Run this statement as the next step in the surrounding operation.
        originalRevision,
        // Purpose: Set this named property in the surrounding object or configuration.
        originalBlob: downloaded.blob,
        // Purpose: Run this statement as the next step in the surrounding operation.
        viewportType,
      // Purpose: Close the current block, handler, object, or expression.
      });
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.latestRoutedViewport = viewportType;

      // Ask the rest of the app to open the already-downloaded file.
      // Purpose: Publish an event so other modules can respond without direct coupling.
      EventBus.publish('FILE_OPEN_REQUESTED', assignment);
      // Confirm the request was published, not that a renderer finished opening it.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const targetName = viewportType === 'full' ? 'Full' : viewportType === 'left' ? 'Left' : 'Right';
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus(
        // Purpose: Run this statement as the next step in the surrounding operation.
        'Sent ' + (fileData.name || 'file') + ' to the ' + targetName + ' viewport request event.',
        // Purpose: Run this statement as the next step in the surrounding operation.
        'success',
      // Purpose: Close the current call or grouped expression.
      );
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Keep failures visible so an unsuccessful request is never reported as complete.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setManagerStatus('Could not prepare file: ' + this.errorText(error), 'error');
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Save edited viewport bytes to the original Dropbox file, if an exporter is wired.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async handleSync() {
    // A valid Dropbox session is required before uploading edits.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.isConnected) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Connect Dropbox before syncing.', 'error');
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Get the source assigned most recently using a viewport action.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const viewportType = this.latestRoutedViewport;
    // Purpose: Declare a variable that stores a value needed by this logic.
    const source = viewportType ? this.activeSources.get(viewportType) : null;
    // Purpose: Check this condition before choosing which branch should run.
    if (!source) {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Choose a Dropbox file and assign it to a viewport before syncing.', 'info');
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Reuse the legacy export bridge when the workspace integration provides it.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const viewportBridge = window.LuxOmniViewportBridge;
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof viewportBridge?.exportEditedBlob !== 'function') {
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('The viewport export integration is not available yet. No file was uploaded.', 'error');
      // Purpose: Return the result to the code that called this function.
      return;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Mark Sync as busy while the exporter and Dropbox API are working.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isSyncing = true;
    // Purpose: Check this condition before choosing which branch should run.
    if (this.syncButton) {
      // Purpose: Enable or disable this control to match the current application state.
      this.syncButton.disabled = true;
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.syncButton.setAttribute('aria-busy', 'true');
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.setToast('Preparing viewport content for Dropbox…', 'info');

    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Ask the viewport integration for the current edited document bytes.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const editedBlob = await viewportBridge.exportEditedBlob(viewportType, source.fileData);
      // Upload APIs accept binary content, so reject unexpected exporter results.
      // Purpose: Check this condition before choosing which branch should run.
      if (!(editedBlob instanceof Blob)) {
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new TypeError('The viewport exporter must return a Blob.');
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Prevent a misleading success when the bridge returns the original bytes.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const isOriginalBlob = editedBlob === source.originalBlob;
      // Purpose: Check this condition before choosing which branch should run.
      if (isOriginalBlob) {
        // Purpose: Declare a variable that stores a value needed by this logic.
        const confirmed = window.confirm(
          // Purpose: Run this statement as the next step in the surrounding operation.
          'This viewport has no edited document bytes ready to save. Continuing will upload the original, unchanged file as a Dropbox API test; it will not save edits from a read-only preview. Continue?',
        // Purpose: Close the current call or grouped expression.
        );
        // Purpose: Check this condition before choosing which branch should run.
        if (!confirmed) {
          // Purpose: Run this statement as the next step in the surrounding operation.
          this.setToast('Sync cancelled. The read-only preview did not export edits.', 'info');
          // Purpose: Return the result to the code that called this function.
          return;
        // Purpose: Close the current block, handler, object, or expression.
        }
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Require a revision to protect against overwriting newer Dropbox changes.
      // Purpose: Check this condition before choosing which branch should run.
      if (!source.originalRevision) {
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new Error('Dropbox did not return a file revision. Reload the file before syncing.');
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Upload to the exact source path and match the revision from the downloaded file.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const result = await DropboxApi.saveEditedFile({
        // Purpose: Set this named property in the surrounding object or configuration.
        originalPath: source.originalPath,
        // Purpose: Set this named property in the surrounding object or configuration.
        content: editedBlob,
        // Purpose: Set this named property in the surrounding object or configuration.
        originalRevision: source.originalRevision,
      // Purpose: Close the current block, handler, object, or expression.
      });

      // Keep the source revision fresh so subsequent saves can protect newer changes.
      // Purpose: Run this statement as the next step in the surrounding operation.
      source.originalRevision = result?.rev || source.originalRevision;
      // Purpose: Run this statement as the next step in the surrounding operation.
      source.fileData = { ...source.fileData, rev: source.originalRevision };
      // Purpose: Run this statement as the next step in the surrounding operation.
      source.originalBlob = editedBlob;
      // Tell the optional workspace bridge that these bytes were saved.
      // Purpose: Run this statement as the next step in the surrounding operation.
      viewportBridge.markSaved?.(viewportType, editedBlob, result);

      // Avoid claiming the original file was edited if only a read-only preview was exported.
      // Purpose: Check this condition before choosing which branch should run.
      if (isOriginalBlob) {
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.setToast(
          // Purpose: Run this statement as the next step in the surrounding operation.
          'Dropbox upload test completed. The original bytes were uploaded unchanged; viewport edits were not saved.',
          // Purpose: Run this statement as the next step in the surrounding operation.
          'info',
        // Purpose: Close the current call or grouped expression.
        );
      // Purpose: Close the current block, handler, object, or expression.
      } else {
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.setToast('Saved edited ' + (source.fileData.name || 'file') + ' to Dropbox.', 'success');
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Let other modules know that the Dropbox save completed.
      // Purpose: Publish an event so other modules can respond without direct coupling.
      EventBus.publish('DROPBOX_SYNC_COMPLETED', {
        // Purpose: Set this named property in the surrounding object or configuration.
        provider: 'dropbox',
        // Purpose: Set this named property in the surrounding object or configuration.
        file: source.fileData,
        // Purpose: Run this statement as the next step in the surrounding operation.
        viewportType,
        // Purpose: Run this statement as the next step in the surrounding operation.
        result,
      // Purpose: Close the current block, handler, object, or expression.
      });
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Surface API or export failures in the toast without hiding the modal.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast('Could not sync edits: ' + this.errorText(error), 'error');
    // Purpose: Close the current block, handler, object, or expression.
    } finally {
      // Restore the button state even when export or upload fails.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.isSyncing = false;
      // Purpose: Check this condition before choosing which branch should run.
      if (this.syncButton) this.syncButton.removeAttribute('aria-busy');
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(this.isConnected);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Revoke the Dropbox session and clear the interface even if revocation fails.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async handleDisconnect() {
    // Ignore repeated clicks while revocation is already in progress.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.isDisconnecting) return;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.isDisconnecting = true;
    // Keep the button disabled while the service clears the local session.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.disconnectButton) {
      // Purpose: Enable or disable this control to match the current application state.
      this.disconnectButton.disabled = true;
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.disconnectButton.setAttribute('aria-busy', 'true');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Start with the normal successful feedback and refine it if needed.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let feedback = 'Dropbox disconnected.';
    // Purpose: Declare a variable that stores a value needed by this logic.
    let feedbackKind = 'success';
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Revoke the active token using the service's current method name.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const result = await DropboxApi.revokeToken();
      // Purpose: Check this condition before choosing which branch should run.
      if (!result?.revoked && result?.reason === 'no-active-token') {
        // Purpose: Run this statement as the next step in the surrounding operation.
        feedback = 'The local Dropbox session was cleared; there was no active token to revoke.';
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // The service clears its private token in a finally block; repeat safely.
      // Purpose: Start a protected operation so failures can be handled cleanly.
      try {
        // Purpose: Run this statement as the next step in the surrounding operation.
        DropboxApi.clearSession();
      // Purpose: Close the current block, handler, object, or expression.
      } catch {
        // The UI can still return to a disconnected appearance.
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Purpose: Run this statement as the next step in the surrounding operation.
      feedback = 'The local session was cleared, but Dropbox could not confirm token revocation: ' +
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.errorText(error);
      // Purpose: Run this statement as the next step in the surrounding operation.
      feedbackKind = 'error';
    // Purpose: Close the current block, handler, object, or expression.
    } finally {
      // Forget source assignments so Sync cannot save a file after disconnect.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.activeSources.clear();
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.latestRoutedViewport = null;
      // Close the browser and restore focus before updating the button states.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.closeFileManager();
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.isDisconnecting = false;
      // Always show the disconnected state after the service clears its session.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.updateTopbarStatus(false);
      // Purpose: Check this condition before choosing which branch should run.
      if (this.disconnectButton) this.disconnectButton.removeAttribute('aria-busy');
      // Publish the final result for any other connected UI components.
      // Purpose: Publish an event so other modules can respond without direct coupling.
      EventBus.publish('DROPBOX_DISCONNECTED', { connected: false });
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setToast(feedback, feedbackKind);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Attach click and keyboard handlers to the existing legacy-compatible controls.
  // Purpose: Run this statement as the next step in the surrounding operation.
  wireEvents() {
    // The sidebar shortcut starts authorization or opens the Dropbox file manager.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.sidebarButton?.addEventListener('click', () => void this.handleDropboxButtonClick());
    // Connect the top-bar actions to their actual service workflows.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.syncButton?.addEventListener('click', () => void this.handleSync());
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.disconnectButton?.addEventListener('click', () => void this.handleDisconnect());

    // Connect modal navigation and upload controls.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.modalClose?.addEventListener('click', () => this.closeFileManager());
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.backButton?.addEventListener('click', () => {
      // Purpose: Check this condition before choosing which branch should run.
      if (this.currentPath) void this.renderFileBrowser(this.getParentPath(this.currentPath));
    // Purpose: Close the current block, handler, object, or expression.
    });
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.uploadInput?.addEventListener('change', () => void this.handleUploadChange());

    // Route target-button clicks to the event-driven file-open request.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.addLeftButton?.addEventListener('click', () => void this.requestFileOpen('left'));
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.addRightButton?.addEventListener('click', () => void this.requestFileOpen('right'));
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.addFullButton?.addEventListener('click', () => void this.requestFileOpen('full'));

    // Keep every marked close target, including the backdrop, connected to closeFileManager().
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.modal?.querySelectorAll('[data-dropbox-ui-close]').forEach(element => {
      // Purpose: Register a handler so the application reacts when this event occurs.
      element.addEventListener('click', () => this.closeFileManager());
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Close when the user clicks the backdrop itself, not when clicking dialog content.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.modal?.addEventListener('click', event => {
      // Purpose: Check this condition before choosing which branch should run.
      if (event.target === this.modal) this.closeFileManager();
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Support Escape as a familiar keyboard shortcut for closing the modal.
    // Purpose: Register a handler so the application reacts when this event occurs.
    document.addEventListener('keydown', event => {
      // Purpose: Check this condition before choosing which branch should run.
      if (event.key === 'Escape' && this.modal && !this.modal.hidden) {
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.closeFileManager();
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    });
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Export the same class as the default for the app's startup module.
// Purpose: Run this statement as the next step in the surrounding operation.
export default DropboxModalUI;
