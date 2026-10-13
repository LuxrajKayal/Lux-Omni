// Import the shared event system so state changes can notify other modules.
import EventBus from './EventBus.js';

// Group application state and state-update methods inside one class.
class Store {
  // Keep the real state private so modules cannot edit it directly.
  #state = {
    // Start the interface with the light color theme.
    theme: 'light',
    // Start with focus mode turned off.
    focusMode: false,
    // Start with the sidebar visible or hidden according to this flag: closed.
    sidebarOpen: false,
    // Use the full workspace as the initial layout.
    activeLayout: 'full',
    // Reserve slots for the full, left, and right document viewports.
    viewports: { full: null, left: null, right: null },
  };

  // Return a copy so callers cannot reassign fields on the real state object.
  getState() {
    // Copy the nested viewports map as well as the top-level state object.
    // Keep each viewport value itself intact because it may be a DOM/viewer object.
    return {
      ...this.#state,
      viewports: { ...this.#state.viewports },
    };
  }

  // Merge changes into the state and notify the application immediately.
  setState(updates) {
    // Require a plain object-like update rather than null, an array, or a primitive.
    if (updates === null || typeof updates !== 'object' || Array.isArray(updates)) {
      // Explain the expected input clearly to the code calling this method.
      throw new TypeError('Store.setState expects an updates object.');
    }

    // Copy the old state and apply each top-level field supplied by the caller.
    const nextState = { ...this.#state, ...updates };

    // Merge partial viewport updates without accidentally removing other viewports.
    if (
      updates.viewports !== null &&
      typeof updates.viewports === 'object' &&
      !Array.isArray(updates.viewports)
    ) {
      // Keep existing viewport slots unless the update replaces a specific slot.
      nextState.viewports = { ...this.#state.viewports, ...updates.viewports };
    } else {
      // Always keep the state-owned viewport map separate from outside objects.
      nextState.viewports = { ...this.#state.viewports };
    }

    // Replace the private state only after the new state has been prepared.
    this.#state = nextState;

    // Copy the update payload before publishing it to outside listeners.
    const updatesSnapshot = { ...updates };

    // Also copy the nested viewport update map when one was provided.
    if (
      updates.viewports !== null &&
      typeof updates.viewports === 'object' &&
      !Array.isArray(updates.viewports)
    ) {
      // Protect the update payload's viewport map from changing after publication.
      updatesSnapshot.viewports = { ...updates.viewports };
    }

    // Prepare a separate snapshot so listeners cannot reassign the private state.
    const stateSnapshot = this.getState();

    // Notify subscribers synchronously that the application state has changed.
    EventBus.publish('STATE_CHANGED', {
      updates: updatesSnapshot,
      state: stateSnapshot,
    });

    // Return another copy so the caller does not receive the private state object.
    return this.getState();
  }

  // Load settings saved by the older Lux PDF Viewer before this modular version.
  init() {
    // Declare variables for values read from the browser's local storage.
    let legacyTheme;
    let legacyFocusMode;
    let legacySidebarOpen;

    // Browser privacy settings can make localStorage unavailable, so guard access.
    try {
      // Read the theme using the exact key used by the legacy application.
      legacyTheme = localStorage.getItem('lux-pdf-viewer-theme');
      // Read the focus-mode flag saved by the legacy application.
      legacyFocusMode = localStorage.getItem('lux-pdf-viewer-focus-mode');
      // Read the sidebar flag saved by the legacy application.
      legacySidebarOpen = localStorage.getItem('lux-pdf-viewer-sidebar-open');
    } catch (error) {
      // Keep the default state if the browser blocks localStorage access.
      return this.getState();
    }

    // Collect only settings that contain recognized legacy values.
    const updates = {};

    // Restore a supported theme without replacing the default for unknown values.
    if (legacyTheme === 'light' || legacyTheme === 'dark') {
      // Apply the theme value saved by the old application.
      updates.theme = legacyTheme;
    }

    // Recognize the legacy true values for focus mode.
    if (legacyFocusMode === 'true' || legacyFocusMode === '1') {
      // Restore focus mode as enabled.
      updates.focusMode = true;
    } else if (legacyFocusMode === 'false' || legacyFocusMode === '0') {
      // Restore focus mode as disabled when that is what was saved.
      updates.focusMode = false;
    }

    // Recognize the legacy true values for the sidebar setting.
    if (legacySidebarOpen === 'true' || legacySidebarOpen === '1') {
      // Restore the sidebar as open.
      updates.sidebarOpen = true;
    } else if (legacySidebarOpen === 'false' || legacySidebarOpen === '0') {
      // Restore the sidebar as closed when that is what was saved.
      updates.sidebarOpen = false;
    }

    // Publish one state change only when a recognized saved setting was found.
    if (Object.keys(updates).length > 0) {
      // Use setState so normal state-change subscribers are notified as well.
      this.setState(updates);
    }

    // Return a safe snapshot of the state after the migration check.
    return this.getState();
  }
}

// Create one shared Store so application modules read the same state.
const store = new Store();

// Export the shared Store instance for the rest of the application.
export default store;
