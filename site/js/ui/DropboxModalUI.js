// Use the shared Dropbox service so this class never handles access tokens directly.
import DropboxApi from '../services/DropboxApi.js';
// Publish file actions through the application's shared event system.
import EventBus from '../core/EventBus.js';

// Keep the icon SVG namespace in one place when building safe, static icons.
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Connect Dropbox controls, the file manager, and the shared event system.
export class DropboxModalUI {
  // Find the existing page controls and wire their user actions.
  constructor() {
    // Cache the top-bar button that connects or opens the Dropbox browser.
    this.topbarButton = document.querySelector('#dropbox-topbar-button');
    // Cache the connection label displayed inside that button.
    this.statusIndicator = document.querySelector('#dropbox-status-indicator');
    // Cache the action that saves edited viewport content back to Dropbox.
    this.syncButton = document.querySelector('#dropbox-sync-button');
    // Cache the action that disconnects the current Dropbox session.
    this.disconnectButton = document.querySelector('#dropbox-disconnect-button');
    // Cache the sidebar shortcut that opens the same Dropbox browser.
    this.sidebarButton = document.querySelector('#dropbox-sidebar-button');

    // Cache the modal and all controls used to browse the account's files.
    this.modal = document.querySelector('#dropbox-file-manager');
    // Cache the modal close button so focus can be restored when it closes.
    this.modalClose = document.querySelector('#dropbox-file-manager-close');
    // Cache the label showing the current Dropbox folder.
    this.currentLocation = document.querySelector('#dropbox-current-location');
    // Cache the navigation button that moves to a parent folder.
    this.backButton = document.querySelector('#dropbox-folder-back');
    // Cache the file input used to upload a file from this device.
    this.uploadInput = document.querySelector('#dropbox-upload-input');
    // Cache the list where folder and file rows will be rendered.
    this.fileList = document.querySelector('#dropbox-file-list');
    // Cache the message shown when a folder has no entries.
    this.emptyState = document.querySelector('#dropbox-empty-state');
    // Cache the accessible status line inside the file manager.
    this.managerStatus = document.querySelector('#dropbox-file-manager-status');
    // Cache the footer that appears after a file is selected.
    this.selectionActions = document.querySelector('#dropbox-selection-actions');
    // Cache the name of the selected file displayed in that footer.
    this.selectedName = document.querySelector('#dropbox-selected-name');
    // Cache the action that requests a file for the left viewport.
    this.addLeftButton = document.querySelector('#dropbox-add-left');
    // Cache the action that requests a file for the right viewport.
    this.addRightButton = document.querySelector('#dropbox-add-right');
    // Cache the action that requests a file for the full viewport.
    this.addFullButton = document.querySelector('#dropbox-add-full');
    // Cache the toast used for feedback outside the modal.
    this.toast = document.querySelector('#dropbox-ui-toast');

    // Track the current connection and browser location without exposing tokens.
    this.isConnected = false;
    // Start browsing at the root of the Dropbox account.
    this.currentPath = '';
    // Keep the selected Dropbox entry until the user chooses another one.
    this.selectedFile = null;
    // Remember which Dropbox file was assigned to each viewport.
    this.activeSources = new Map();
    // Remember the most recent destination chosen for syncing.
    this.latestRoutedViewport = null;
    // Keep the element that had focus before opening the modal.
    this.previousFocus = null;
    // Count browser requests so stale folder responses cannot replace newer ones.
    this.browseRequestId = 0;
    // Give every open request an identifier for consumers of the event.
    this.assignmentRequestId = 0;
    // Prevent repeated disconnect actions from running at the same time.
    this.isDisconnecting = false;
    // Prevent repeated sync actions from running at the same time.
    this.isSyncing = false;
    // Keep the toast timer so a newer toast can replace the older one.
    this.toastTimer = null;

    // Connect every existing button to this class's corresponding action.
    this.wireEvents();
    // Paint a safe initial state before checking the current account.
    this.updateTopbarStatus(false);
    // Check for a Dropbox OAuth callback or an existing in-memory session.
    void this.initialize();
  }

  // Turn errors into readable text without exposing internal stack traces.
  errorText(error) {
    // Prefer a service-provided summary, then a normal Error message.
    return error?.errorSummary || error?.message || String(error || 'Unknown error');
  }

  // Display a temporary message without injecting any HTML.
  setToast(message, kind = 'info') {
    // Stop if this page version does not include the toast element.
    if (!this.toast) return;
    // Cancel the previous toast timer before replacing its message.
    window.clearTimeout(this.toastTimer);
    // Assign the message as text so file names cannot become markup.
    this.toast.textContent = message;
    // Let the stylesheet distinguish success, information, and error messages.
    this.toast.dataset.kind = kind;
    // Use the built-in hidden attribute to show or hide the toast.
    this.toast.hidden = !message;
    // Hide a visible message after six seconds.
    if (message) {
      this.toastTimer = window.setTimeout(() => {
        // Do not leave old feedback on the page after its timeout.
        this.toast.hidden = true;
      }, 6000);
    }
  }

  // Update the modal's live status line and its visual status kind.
  setManagerStatus(message, kind = 'info') {
    // Leave the page usable even if the status element is not present.
    if (!this.managerStatus) return;
    // Use text content for messages, including any Dropbox-provided names.
    this.managerStatus.textContent = message;
    // Match the state to the existing stylesheet's status colors.
    this.managerStatus.dataset.kind = kind;
  }

  // Update the top-bar connection label and the actions that need a session.
  updateTopbarStatus(isConnected) {
    // Normalize any service result to a strict boolean.
    this.isConnected = Boolean(isConnected);

    // Update the visible connection text and data attribute together.
    if (this.statusIndicator) {
      this.statusIndicator.textContent = this.isConnected ? 'Connected 🟢' : 'Disconnected 🔴';
      this.statusIndicator.dataset.state = this.isConnected ? 'connected' : 'disconnected';
    }

    // Keep the top-bar button's accessible description in sync with the state.
    if (this.topbarButton) {
      this.topbarButton.setAttribute(
        'aria-label',
        this.isConnected ? 'Dropbox connected — open files' : 'Dropbox disconnected — connect',
      );
      this.topbarButton.title = this.isConnected
        ? 'Dropbox connected. Click to browse files.'
        : 'Dropbox disconnected. Click to connect.';
    }

    // Sync requires a working session and must not run twice at once.
    if (this.syncButton) {
      this.syncButton.disabled = !this.isConnected || this.isSyncing;
    }
    // Disconnect requires a working session and must not run twice at once.
    if (this.disconnectButton) {
      this.disconnectButton.disabled = !this.isConnected || this.isDisconnecting;
    }

    // Let other modules react when the verified connection state changes.
    EventBus.publish('DROPBOX_CONNECTION_CHANGED', { connected: this.isConnected });
  }

  // Remove OAuth callback details from the address bar after processing.
  cleanOAuthCallbackParameters() {
    // Parse the current URL so unrelated query parameters are preserved.
    const url = new URL(window.location.href);
    // Remove only values used by the Dropbox authorization redirect.
    const oauthKeys = ['code', 'state', 'error', 'error_description', 'scope', 'token_access_type'];
    // Remember whether the address needs to be updated.
    let changed = false;

    // Check each callback parameter instead of clearing the whole query string.
    for (const key of oauthKeys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    // Replace the visible address only when a Dropbox parameter was found.
    if (changed) {
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  }

  // Ask the Dropbox service to verify that its in-memory token still works.
  async refreshConnectionStatus({ notifyOnError = false } = {}) {
    try {
      // The service checks the account instead of revealing its private token.
      const result = await DropboxApi.checkConnection();
      // Update button states only from the service's verified result.
      this.updateTopbarStatus(Boolean(result?.connected));
      // Return the normalized status for callers that need to branch.
      return Boolean(result?.connected);
    } catch (error) {
      // Treat an unverified connection as disconnected in the visible UI.
      this.updateTopbarStatus(false);
      // Show the technical reason only when the current action needs feedback.
      if (notifyOnError) {
        this.setToast('Could not verify the Dropbox connection: ' + this.errorText(error), 'error');
      }
      // Report that the connection could not be verified.
      return false;
    }
  }

  // Restore a valid callback session or check the session already in memory.
  async initialize() {
    // Look for the authorization code or error returned by Dropbox.
    const params = new URLSearchParams(window.location.search);
    // Recognize both successful and denied authorization callbacks.
    const hasOAuthCallback = params.has('code') || params.has('error') || params.has('error_description');

    // Handle the callback only when the URL contains OAuth response fields.
    if (hasOAuthCallback) {
      // Keep any error so the connection status can still be refreshed afterward.
      let callbackError = null;
      try {
        // Verify state and exchange the authorization code using PKCE.
        await DropboxApi.handleOAuthCallback();
      } catch (error) {
        // Remember the error instead of skipping the status refresh.
        callbackError = error;
      } finally {
        // Ensure OAuth parameters are removed even if callback validation fails.
        this.cleanOAuthCallbackParameters();
      }

      // Confirm the account after the callback has completed.
      const connected = await this.refreshConnectionStatus();
      // Tell the user when the authorization could not be completed.
      if (callbackError) {
        this.setToast('Dropbox sign-in did not complete: ' + this.errorText(callbackError), 'error');
      } else if (!connected) {
        // Avoid claiming a connection when the API could not verify it.
        this.setToast('Dropbox sign-in returned, but the connection could not be verified.', 'error');
      }
      // The callback attempt is complete, so do not run a second initialization path.
      return;
    }

    // Normal page loads simply verify whether a valid in-memory token exists.
    await this.refreshConnectionStatus();
  }

  // Convert Dropbox root paths to the empty path accepted by the API.
  normalizePath(path) {
    // Dropbox represents the account root as an empty string or a slash.
    if (!path || path === '/') return '';
    // Remove trailing slashes without altering an internal folder path.
    return String(path).replace(/\/+$/, '');
  }

  // Find the parent folder while keeping the account root as the final level.
  getParentPath(path) {
    // Normalize the path before looking for its last separator.
    const normalized = this.normalizePath(path);
    // The root has no parent folder to navigate to.
    if (!normalized) return '';
    // Find the position of the final path separator.
    const separatorIndex = normalized.lastIndexOf('/');
    // A top-level folder's parent is the root; deeper folders lose one segment.
    return separatorIndex <= 0 ? '' : normalized.slice(0, separatorIndex);
  }

  // Get a consistent Dropbox path for either normal or shared entries.
  getEntryPath(entry) {
    // Prefer the display path and use the lowercase form only as a fallback.
    return entry?.path_display || entry?.path_lower || '';
  }

  // Choose a stable identifier for marking the selected row.
  getEntryKey(entry) {
    // Prefer Dropbox's file ID, then its paths, and finally its name.
    return String(entry?.id || entry?.path_lower || entry?.path_display || entry?.name || '');
  }

  // Enable the Back button only after the user has entered a subfolder.
  updateBackButton() {
    // The root folder has no valid parent to navigate to.
    if (this.backButton) this.backButton.disabled = !this.currentPath;
  }

  // Show or hide the selected-file actions at the bottom of the modal.
  updateSelectionBar() {
    // Convert the selected entry into a simple yes-or-no condition.
    const hasSelection = Boolean(this.selectedFile);
    // Reveal the target buttons only when a file is selected.
    if (this.selectionActions) this.selectionActions.hidden = !hasSelection;
    // Use a safe text label instead of displaying file metadata as markup.
    if (this.selectedName) {
      this.selectedName.textContent = hasSelection
        ? this.selectedFile.name || 'Selected file'
        : 'No file selected';
    }
  }

  // Create a static SVG icon without using HTML copied from external data.
  createEntryIcon(isFolder) {
    // Build an SVG element using the standard namespace.
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    // Preserve the same icon coordinate system as the legacy user interface.
    svg.setAttribute('viewBox', '0 0 24 24');
    // Hide the decorative icon from assistive technology.
    svg.setAttribute('aria-hidden', 'true');

    // Draw the folder icon with its original simple outline.
    const folderPaths = [
      'M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z',
    ];
    // Draw the file icon with its page outline and two short text lines.
    const filePaths = [
      'M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20Z',
      'M14 3.5V8h4',
      'M9 13h6M9 16.5h6',
    ];

    // Choose the paths for the kind of entry being rendered.
    const paths = isFolder ? folderPaths : filePaths;
    // Create every path node through the DOM API.
    for (const pathData of paths) {
      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      // Use only the static path data defined in this module.
      path.setAttribute('d', pathData);
      // Add the path to the icon before adding the icon to the row.
      svg.append(path);
    }

    // Return the completed folder or file icon.
    return svg;
  }

  // Format bytes into a readable file size for the row's secondary label.
  formatBytes(bytes) {
    // Ignore values that are absent, negative, or not numeric.
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return 'File';
    // Small files are easier to read as bytes.
    if (value < 1024) return value + ' B';

    // Convert larger sizes through the common binary units.
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = value / 1024;
    let unitIndex = 0;
    // Continue converting until the value fits or the largest unit is reached.
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    // Keep the displayed result compact without hiding the chosen unit.
    return size.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' ' + units[unitIndex];
  }

  // Build a clickable row for one folder or file returned by Dropbox.
  createFileRow(entry) {
    // Distinguish a folder from a downloadable file using Dropbox's tag.
    const isFolder = entry?.['.tag'] === 'folder';
    // Create the list item that will contain the row button.
    const item = document.createElement('li');
    item.className = 'dropbox-ui-file-item';

    // Use a button so each row works with the keyboard as well as the mouse.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dropbox-ui-file-row';
    // Keep the entry identifier on the button so the selected row can be updated.
    button.dataset.entryKey = this.getEntryKey(entry);
    // Communicate the current selection state to assistive technology.
    button.setAttribute('aria-pressed', 'false');
    // Make the action clear even if the row's visual labels are clipped.
    button.setAttribute(
      'aria-label',
      (isFolder ? 'Open folder ' : 'Select file ') + (entry.name || 'unnamed item'),
    );

    // Create the icon and describe its kind for the existing styles.
    const icon = document.createElement('span');
    icon.className = 'dropbox-ui-file-icon';
    icon.dataset.kind = isFolder ? 'folder' : 'file';
    icon.append(this.createEntryIcon(isFolder));

    // Keep the primary and secondary text in separate spans for responsive layout.
    const copy = document.createElement('span');
    copy.className = 'dropbox-ui-file-copy';
    const name = document.createElement('span');
    name.className = 'dropbox-ui-file-name';
    name.textContent = entry.name || 'Unnamed item';
    const meta = document.createElement('span');
    meta.className = 'dropbox-ui-file-meta';
    meta.textContent = isFolder ? 'Folder' : (entry.size != null ? this.formatBytes(entry.size) : 'File');

    // Assemble the row before attaching its click handler.
    copy.append(name, meta);
    button.append(icon, copy);

    // Opening a folder refreshes the list without selecting it as a document.
    if (isFolder) {
      button.addEventListener('click', () => {
        void this.renderFileBrowser(this.getEntryPath(entry));
      });
    } else {
      // Selecting a file publishes an event instead of opening a viewport directly.
      button.addEventListener('click', () => this.selectFile(entry));
    }

    // Attach the finished button to its list item.
    item.append(button);
    // Return the item so the full result list can be assembled efficiently.
    return item;
  }

  // Select a file and tell other modules which Dropbox entry the user chose.
  selectFile(entry) {
    // Keep the full metadata object because later API calls need its ID or path.
    this.selectedFile = entry;
    // Update the visible file name and selected-action controls.
    this.updateSelectionBar();

    // Mark the chosen row and clear the pressed state from other rows.
    if (this.fileList) {
      for (const button of this.fileList.querySelectorAll('.dropbox-ui-file-row')) {
        const isSelected = button.dataset.entryKey === this.getEntryKey(entry);
        button.setAttribute('aria-pressed', String(isSelected));
      }
    }

    // Publish only the selected file metadata; the token remains inside DropboxApi.
    EventBus.publish('FILE_SELECTED', {
      provider: 'dropbox',
      file: entry,
      path: this.getEntryPath(entry),
    });
    // Tell the user which file is now selected for a viewport action.
    this.setManagerStatus('Selected ' + (entry.name || 'file') + '. Choose a viewport below.');
  }

  // Load a folder through the Dropbox service and draw the returned entries.
  async renderFileBrowser(path = '') {
    // Remember the normalized location before starting the request.
    this.currentPath = this.normalizePath(path);
    // A new folder means no old file should remain selected.
    this.selectedFile = null;
    this.updateSelectionBar();
    this.updateBackButton();

    // Update the folder label while avoiding any HTML interpretation.
    if (this.currentLocation) {
      this.currentLocation.textContent = this.currentPath || 'My Dropbox';
      this.currentLocation.title = this.currentPath || 'My Dropbox';
    }
    // Remove old rows while the new folder is being loaded.
    if (this.fileList) this.fileList.replaceChildren();
    // Hide the empty-state message until the request completes.
    if (this.emptyState) this.emptyState.hidden = true;

    // Keep this request ID to ignore an older response that arrives too late.
    const requestId = ++this.browseRequestId;
    this.setManagerStatus('Loading folder…');

    try {
      // Ask the service to combine all pages for this folder only.
      const entries = await DropboxApi.listAllFolderEntries({
        path: this.currentPath,
        recursive: false,
        limit: 1000,
      });
      // Do not render this answer if another folder request has started.
      if (requestId !== this.browseRequestId) return;

      // Sort folders before files and sort each group by display name.
      const sorted = [...entries].sort((first, second) => {
        const firstIsFolder = first?.['.tag'] === 'folder';
        const secondIsFolder = second?.['.tag'] === 'folder';
        if (firstIsFolder !== secondIsFolder) return firstIsFolder ? -1 : 1;
        return String(first?.name || '').localeCompare(String(second?.name || ''));
      });

      // Build the full list off-screen before adding it to the page.
      if (this.fileList) {
        const fragment = document.createDocumentFragment();
        for (const entry of sorted) {
          // Ignore deleted entries because they are not selectable files or folders.
          if (entry?.['.tag'] === 'deleted') continue;
          fragment.append(this.createFileRow(entry));
        }
        this.fileList.append(fragment);
      }

      // Count only entries that are not marked as deleted.
      const visibleEntries = sorted.filter(entry => entry?.['.tag'] !== 'deleted');
      const isEmpty = visibleEntries.length === 0;
      // Show the empty illustration only when no visible entries remain.
      if (this.emptyState) this.emptyState.hidden = !isEmpty;
      // Report a helpful item count for non-empty folders.
      this.setManagerStatus(
        isEmpty
          ? 'This folder has no files or folders.'
          : visibleEntries.length + ' item' + (visibleEntries.length === 1 ? '' : 's') + ' in this folder.',
      );
    } catch (error) {
      // Do not replace a newer request's status with an older error.
      if (requestId !== this.browseRequestId) return;
      // Clear incomplete results so an error is not mistaken for an empty folder.
      if (this.fileList) this.fileList.replaceChildren();
      if (this.emptyState) this.emptyState.hidden = true;
      // Explain the failure in the modal without interrupting the user.
      this.setManagerStatus('Could not load this folder: ' + this.errorText(error), 'error');
    }
  }

  // Open the file manager only when the connection has been verified.
  async openFileManager() {
    // Ignore the request if the markup or Dropbox connection is unavailable.
    if (!this.isConnected || !this.modal) return;
    // Save the current element so focus can return after the dialog closes.
    this.previousFocus = document.activeElement;
    // Reveal the modal and stop background page scrolling.
    this.modal.hidden = false;
    document.body.classList.add('dropbox-ui-open');
    // Move focus into the dialog once the browser can lay out its controls.
    window.requestAnimationFrame(() => this.modalClose?.focus());
    // Load the account root so opening the modal always starts predictably.
    await this.renderFileBrowser('');
  }

  // Hide the modal and restore focus to the control that opened it.
  closeFileManager() {
    // Nothing needs to happen when this page has no file-manager modal.
    if (!this.modal) return;
    // Hide the dialog and restore ordinary background scrolling.
    this.modal.hidden = true;
    document.body.classList.remove('dropbox-ui-open');
    // Clear the selection so reopening the modal starts without a stale target.
    this.selectedFile = null;
    this.updateSelectionBar();

    // Restore focus when the previous element still supports focus().
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
    }
    // Release the reference after restoring focus.
    this.previousFocus = null;
  }

  // Use the sidebar or top-bar button to browse files or begin authorization.
  async handleDropboxButtonClick() {
    // Avoid navigating away while the user is disconnecting.
    if (this.isDisconnecting) return;
    try {
      // Verify the account rather than trusting only a cached UI label.
      const result = await DropboxApi.checkConnection();
      this.updateTopbarStatus(Boolean(result?.connected));
      // An active session opens the file browser; otherwise begin OAuth.
      if (result?.connected) {
        await this.openFileManager();
      } else {
        await DropboxApi.beginAuthorization();
      }
    } catch (error) {
      // Show a disconnected state if the check itself cannot be completed.
      this.updateTopbarStatus(false);
      // Explain the problem without starting a second authorization flow.
      this.setToast('Could not check Dropbox. Please try again: ' + this.errorText(error), 'error');
    }
  }

  // Upload the selected local file into the currently open Dropbox folder.
  async handleUploadChange() {
    // Read the first file and stop if the file picker was cancelled.
    const file = this.uploadInput?.files?.[0];
    if (!file) return;

    // Build an absolute Dropbox path without creating a duplicate root slash.
    const folder = this.normalizePath(this.currentPath);
    const destination = (folder || '') + '/' + file.name;

    // Disable the input during upload so the same control cannot overlap requests.
    if (this.uploadInput) this.uploadInput.disabled = true;
    this.setManagerStatus('Uploading ' + file.name + '…');

    try {
      // Add the file and let Dropbox rename it if the chosen name already exists.
      const result = await DropboxApi.uploadFile({
        path: destination,
        file,
        mode: 'add',
        autorename: true,
      });
      // Show the name returned by Dropbox in case it had to be renamed.
      this.setManagerStatus('Uploaded ' + (result?.name || file.name) + '.', 'success');
      // Refresh the current folder so the new file appears immediately.
      await this.renderFileBrowser(this.currentPath);
      // Provide a second confirmation in the unobtrusive toast.
      this.setToast('Uploaded ' + file.name + ' to Dropbox.', 'success');
    } catch (error) {
      // Keep the modal open so the user can retry after seeing the error.
      this.setManagerStatus('Upload failed: ' + this.errorText(error), 'error');
    } finally {
      // Re-enable the file picker and clear the previous selection.
      if (this.uploadInput) {
        this.uploadInput.disabled = false;
        this.uploadInput.value = '';
      }
    }
  }

  // Download a selected file and publish an event asking another module to open it.
  async requestFileOpen(viewportType) {
    // Accept only the three viewport targets exposed in the page markup.
    const allowedViewports = new Set(['left', 'right', 'full']);
    if (!allowedViewports.has(viewportType)) {
      throw new TypeError('viewportType must be left, right, or full.');
    }
    // Require a file selection before asking for a viewport assignment.
    const fileData = this.selectedFile;
    if (!fileData || fileData['.tag'] !== 'file') {
      this.setToast('Select a file before choosing a viewport.', 'info');
      return;
    }

    // Tell the user that bytes are being requested from Dropbox.
    this.setManagerStatus('Downloading ' + (fileData.name || 'file') + '…');
    try {
      // Prefer a stable Dropbox file ID; use the original path if needed.
      const fileId = typeof fileData.id === 'string' ? fileData.id.trim() : '';
      const identifier = fileId
        ? (fileId.startsWith('id:') ? fileId : 'id:' + fileId)
        : (fileData.path_lower || fileData.path_display);
      // Stop before the API call if Dropbox supplied no usable identifier.
      if (!identifier) throw new Error('The selected entry has no usable Dropbox file ID or path.');

      // Get the bytes and metadata without passing an access token through the UI.
      const downloaded = await DropboxApi.downloadFile(identifier);
      // The original path is required later to save edited content to the source file.
      const originalPath = fileData.path_display || fileData.path_lower;
      if (!originalPath) throw new Error('Dropbox did not provide the source path for this file.');

      // Prefer the downloaded revision so later saves can guard against overwrites.
      const originalRevision = downloaded.metadata?.rev || fileData.rev || null;
      // Assign an ID so an independent event consumer can correlate its response.
      const requestId = ++this.assignmentRequestId;
      // Package data for a renderer without exposing the Dropbox access token.
      const assignment = {
        requestId,
        provider: 'dropbox',
        fileData,
        blob: downloaded.blob,
        metadata: downloaded.metadata,
        originalPath,
        originalRevision,
        viewportType,
      };

      // Save this source for the Sync button, without calling a viewport directly.
      this.activeSources.set(viewportType, {
        fileData,
        originalPath,
        originalRevision,
        originalBlob: downloaded.blob,
        viewportType,
      });
      this.latestRoutedViewport = viewportType;

      // Ask the rest of the app to open the already-downloaded file.
      EventBus.publish('FILE_OPEN_REQUESTED', assignment);
      // Confirm the request was published, not that a renderer finished opening it.
      const targetName = viewportType === 'full' ? 'Full' : viewportType === 'left' ? 'Left' : 'Right';
      this.setManagerStatus(
        'Sent ' + (fileData.name || 'file') + ' to the ' + targetName + ' viewport request event.',
        'success',
      );
    } catch (error) {
      // Keep failures visible so an unsuccessful request is never reported as complete.
      this.setManagerStatus('Could not prepare file: ' + this.errorText(error), 'error');
    }
  }

  // Save edited viewport bytes to the original Dropbox file, if an exporter is wired.
  async handleSync() {
    // A valid Dropbox session is required before uploading edits.
    if (!this.isConnected) {
      this.setToast('Connect Dropbox before syncing.', 'error');
      return;
    }

    // Get the source assigned most recently using a viewport action.
    const viewportType = this.latestRoutedViewport;
    const source = viewportType ? this.activeSources.get(viewportType) : null;
    if (!source) {
      this.setToast('Choose a Dropbox file and assign it to a viewport before syncing.', 'info');
      return;
    }

    // Reuse the legacy export bridge when the workspace integration provides it.
    const viewportBridge = window.LuxOmniViewportBridge;
    if (typeof viewportBridge?.exportEditedBlob !== 'function') {
      this.setToast('The viewport export integration is not available yet. No file was uploaded.', 'error');
      return;
    }

    // Mark Sync as busy while the exporter and Dropbox API are working.
    this.isSyncing = true;
    if (this.syncButton) {
      this.syncButton.disabled = true;
      this.syncButton.setAttribute('aria-busy', 'true');
    }
    this.setToast('Preparing viewport content for Dropbox…', 'info');

    try {
      // Ask the viewport integration for the current edited document bytes.
      const editedBlob = await viewportBridge.exportEditedBlob(viewportType, source.fileData);
      // Upload APIs accept binary content, so reject unexpected exporter results.
      if (!(editedBlob instanceof Blob)) {
        throw new TypeError('The viewport exporter must return a Blob.');
      }

      // Prevent a misleading success when the bridge returns the original bytes.
      const isOriginalBlob = editedBlob === source.originalBlob;
      if (isOriginalBlob) {
        const confirmed = window.confirm(
          'This viewport has no edited document bytes ready to save. Continuing will upload the original, unchanged file as a Dropbox API test; it will not save edits from a read-only preview. Continue?',
        );
        if (!confirmed) {
          this.setToast('Sync cancelled. The read-only preview did not export edits.', 'info');
          return;
        }
      }

      // Require a revision to protect against overwriting newer Dropbox changes.
      if (!source.originalRevision) {
        throw new Error('Dropbox did not return a file revision. Reload the file before syncing.');
      }

      // Upload to the exact source path and match the revision from the downloaded file.
      const result = await DropboxApi.saveEditedFile({
        originalPath: source.originalPath,
        content: editedBlob,
        originalRevision: source.originalRevision,
      });

      // Keep the source revision fresh so subsequent saves can protect newer changes.
      source.originalRevision = result?.rev || source.originalRevision;
      source.fileData = { ...source.fileData, rev: source.originalRevision };
      source.originalBlob = editedBlob;
      // Tell the optional workspace bridge that these bytes were saved.
      viewportBridge.markSaved?.(viewportType, editedBlob, result);

      // Avoid claiming the original file was edited if only a read-only preview was exported.
      if (isOriginalBlob) {
        this.setToast(
          'Dropbox upload test completed. The original bytes were uploaded unchanged; viewport edits were not saved.',
          'info',
        );
      } else {
        this.setToast('Saved edited ' + (source.fileData.name || 'file') + ' to Dropbox.', 'success');
      }
      // Let other modules know that the Dropbox save completed.
      EventBus.publish('DROPBOX_SYNC_COMPLETED', {
        provider: 'dropbox',
        file: source.fileData,
        viewportType,
        result,
      });
    } catch (error) {
      // Surface API or export failures in the toast without hiding the modal.
      this.setToast('Could not sync edits: ' + this.errorText(error), 'error');
    } finally {
      // Restore the button state even when export or upload fails.
      this.isSyncing = false;
      if (this.syncButton) this.syncButton.removeAttribute('aria-busy');
      this.updateTopbarStatus(this.isConnected);
    }
  }

  // Revoke the Dropbox session and clear the interface even if revocation fails.
  async handleDisconnect() {
    // Ignore repeated clicks while revocation is already in progress.
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;
    // Keep the button disabled while the service clears the local session.
    if (this.disconnectButton) {
      this.disconnectButton.disabled = true;
      this.disconnectButton.setAttribute('aria-busy', 'true');
    }

    // Start with the normal successful feedback and refine it if needed.
    let feedback = 'Dropbox disconnected.';
    let feedbackKind = 'success';
    try {
      // Revoke the active token using the service's current method name.
      const result = await DropboxApi.revokeToken();
      if (!result?.revoked && result?.reason === 'no-active-token') {
        feedback = 'The local Dropbox session was cleared; there was no active token to revoke.';
      }
    } catch (error) {
      // The service clears its private token in a finally block; repeat safely.
      try {
        DropboxApi.clearSession();
      } catch {
        // The UI can still return to a disconnected appearance.
      }
      feedback = 'The local session was cleared, but Dropbox could not confirm token revocation: ' +
        this.errorText(error);
      feedbackKind = 'error';
    } finally {
      // Forget source assignments so Sync cannot save a file after disconnect.
      this.activeSources.clear();
      this.latestRoutedViewport = null;
      // Close the browser and restore focus before updating the button states.
      this.closeFileManager();
      this.isDisconnecting = false;
      // Always show the disconnected state after the service clears its session.
      this.updateTopbarStatus(false);
      if (this.disconnectButton) this.disconnectButton.removeAttribute('aria-busy');
      // Publish the final result for any other connected UI components.
      EventBus.publish('DROPBOX_DISCONNECTED', { connected: false });
      this.setToast(feedback, feedbackKind);
    }
  }

  // Attach click and keyboard handlers to the existing legacy-compatible controls.
  wireEvents() {
    // Both Dropbox shortcuts open the same file manager or start the same OAuth flow.
    this.sidebarButton?.addEventListener('click', () => void this.handleDropboxButtonClick());
    this.topbarButton?.addEventListener('click', () => void this.handleDropboxButtonClick());
    // Connect the top-bar actions to their actual service workflows.
    this.syncButton?.addEventListener('click', () => void this.handleSync());
    this.disconnectButton?.addEventListener('click', () => void this.handleDisconnect());

    // Connect modal navigation and upload controls.
    this.modalClose?.addEventListener('click', () => this.closeFileManager());
    this.backButton?.addEventListener('click', () => {
      if (this.currentPath) void this.renderFileBrowser(this.getParentPath(this.currentPath));
    });
    this.uploadInput?.addEventListener('change', () => void this.handleUploadChange());

    // Route target-button clicks to the event-driven file-open request.
    this.addLeftButton?.addEventListener('click', () => void this.requestFileOpen('left'));
    this.addRightButton?.addEventListener('click', () => void this.requestFileOpen('right'));
    this.addFullButton?.addEventListener('click', () => void this.requestFileOpen('full'));

    // Keep every marked close target, including the backdrop, connected to closeFileManager().
    this.modal?.querySelectorAll('[data-dropbox-ui-close]').forEach(element => {
      element.addEventListener('click', () => this.closeFileManager());
    });

    // Close when the user clicks the backdrop itself, not when clicking dialog content.
    this.modal?.addEventListener('click', event => {
      if (event.target === this.modal) this.closeFileManager();
    });

    // Support Escape as a familiar keyboard shortcut for closing the modal.
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.modal && !this.modal.hidden) {
        this.closeFileManager();
      }
    });
  }
}

// Export the same class as the default for the app's startup module.
export default DropboxModalUI;
