// Import the shared event system so state changes can notify other modules.
// Purpose: Import a shared module so this file can reuse its functionality.
import EventBus from './EventBus.js';

// Keep new preferences under this application's own storage namespace.
// Purpose: Declare a variable that stores a value needed by this logic.
const PREFERENCE_STORAGE_KEYS = {
  // Purpose: Set this named property in the surrounding object or configuration.
  theme: 'lux-omni-theme',
  // Purpose: Set this named property in the surrounding object or configuration.
  focusMode: 'lux-omni-focus-mode',
  // Purpose: Set this named property in the surrounding object or configuration.
  sidebarOpen: 'lux-omni-sidebar-open',
// Purpose: Close the current block, handler, object, or expression.
};

// Read the previous keys only as a compatibility fallback for existing settings.
// Purpose: Declare a variable that stores a value needed by this logic.
const PREVIOUS_PREFERENCE_STORAGE_KEYS = {
  // Purpose: Set this named property in the surrounding object or configuration.
  theme: 'lux-pdf-viewer-theme',
  // Purpose: Set this named property in the surrounding object or configuration.
  focusMode: 'lux-pdf-viewer-focus-mode',
  // Purpose: Set this named property in the surrounding object or configuration.
  sidebarOpen: 'lux-pdf-viewer-sidebar-open',
// Purpose: Close the current block, handler, object, or expression.
};

// Group application state and state-update methods inside one class.
// Purpose: Define a class that groups related state and behavior.
class Store {
  // Keep the real state private so modules cannot edit it directly.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #state = {
    // Start the interface with the light color theme.
    // Purpose: Set this named property in the surrounding object or configuration.
    theme: 'light',
    // Start with focus mode turned off.
    // Purpose: Set this named property in the surrounding object or configuration.
    focusMode: false,
    // Start with the sidebar visible or hidden according to this flag: closed.
    // Purpose: Set this named property in the surrounding object or configuration.
    sidebarOpen: false,
    // Keep the workspace in its welcome state until a control explicitly opens a viewport.
    // Purpose: Set this named property in the surrounding object or configuration.
    activeLayout: null,
    // Reserve slots for the full, left, and right document viewports.
    // Purpose: Set this named property in the surrounding object or configuration.
    viewports: { full: null, left: null, right: null },
    // Keep minimized window metadata in shared state so every module sees the same restore dock.
    // Purpose: Set this named property in the surrounding object or configuration.
    minimizedViewports: [],
    // Remember which minimized viewport is currently being dragged by the user.
    // Purpose: Set this named property in the surrounding object or configuration.
    viewportDrag: null,
    // Remember a pending drop that needs the user to confirm replacing existing content.
    // Purpose: Set this named property in the surrounding object or configuration.
    pendingViewportReplacement: null,
  // Purpose: Close the current block, handler, object, or expression.
  };

  // Return a copy so callers cannot reassign fields on the real state object.
  // Purpose: Run this statement as the next step in the surrounding operation.
  getState() {
    // Copy the nested viewports map as well as the top-level state object.
    // Keep each viewport value itself intact because it may be a DOM/viewer object.
    // Purpose: Return the result to the code that called this function.
    return {
      // Purpose: Run this statement as the next step in the surrounding operation.
      ...this.#state,
      // Purpose: Set this named property in the surrounding object or configuration.
      viewports: { ...this.#state.viewports },
      // Return fresh minimized records so callers cannot mutate Store's private array.
      // Purpose: Return a defensive copy of the minimized viewport list.
      minimizedViewports: this.#state.minimizedViewports.map((viewport) => ({ ...viewport })),
      // Return a separate drag record so event handlers cannot edit Store state directly.
      // Purpose: Return a defensive copy of the active drag state.
      viewportDrag: this.#state.viewportDrag ? { ...this.#state.viewportDrag } : null,
      // Return a separate pending replacement record for the same isolation guarantee.
      // Purpose: Return a defensive copy of the pending replacement operation.
      pendingViewportReplacement: this.#state.pendingViewportReplacement ? { ...this.#state.pendingViewportReplacement } : null,
    // Purpose: Close the current block, handler, object, or expression.
    };
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Merge changes into the state and notify the application immediately.
  // Purpose: Run this statement as the next step in the surrounding operation.
  setState(updates) {
    // Require a plain object-like update rather than null, an array, or a primitive.
    // Purpose: Check this condition before choosing which branch should run.
    if (updates === null || typeof updates !== 'object' || Array.isArray(updates)) {
      // Explain the expected input clearly to the code calling this method.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError('Store.setState expects an updates object.');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Copy the old state and apply each top-level field supplied by the caller.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const nextState = { ...this.#state, ...updates };

    // Merge partial viewport updates without accidentally removing other viewports.
    // Purpose: Check this condition before choosing which branch should run.
    if (
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.viewports !== null &&
      // Purpose: Run this statement as the next step in the surrounding operation.
      typeof updates.viewports === 'object' &&
      // Purpose: Run this statement as the next step in the surrounding operation.
      !Array.isArray(updates.viewports)
    // Purpose: Close the current call or grouped expression.
    ) {
      // Keep existing viewport slots unless the update replaces a specific slot.
      // Purpose: Run this statement as the next step in the surrounding operation.
      nextState.viewports = { ...this.#state.viewports, ...updates.viewports };
    // Purpose: Close the current block, handler, object, or expression.
    } else {
      // Always keep the state-owned viewport map separate from outside objects.
      // Purpose: Run this statement as the next step in the surrounding operation.
      nextState.viewports = { ...this.#state.viewports };
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Copy minimized records so updates cannot keep mutable arrays outside the Store.
    // Purpose: Normalize and isolate minimized-window state before saving it.
    nextState.minimizedViewports = Array.isArray(nextState.minimizedViewports) ? nextState.minimizedViewports.map((viewport) => ({ ...viewport })) : [];
    // Copy a valid drag record or reset an invalid value to null.
    // Purpose: Normalize the active drag state before saving it.
    nextState.viewportDrag = nextState.viewportDrag && typeof nextState.viewportDrag === 'object' && !Array.isArray(nextState.viewportDrag) ? { ...nextState.viewportDrag } : null;
    // Copy a valid replacement operation or reset an invalid value to null.
    // Purpose: Normalize the pending replacement state before saving it.
    nextState.pendingViewportReplacement = nextState.pendingViewportReplacement && typeof nextState.pendingViewportReplacement === 'object' && !Array.isArray(nextState.pendingViewportReplacement) ? { ...nextState.pendingViewportReplacement } : null;

    // Replace the private state only after the new state has been prepared.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#state = nextState;

    // Save updated preferences before notifying listeners so they survive a refresh.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#persistPreferences(updates, nextState);

    // Copy the update payload before publishing it to outside listeners.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const updatesSnapshot = { ...updates };

    // Also copy the nested viewport update map when one was provided.
    // Purpose: Check this condition before choosing which branch should run.
    if (
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.viewports !== null &&
      // Purpose: Run this statement as the next step in the surrounding operation.
      typeof updates.viewports === 'object' &&
      // Purpose: Run this statement as the next step in the surrounding operation.
      !Array.isArray(updates.viewports)
    // Purpose: Close the current call or grouped expression.
    ) {
      // Protect the update payload's viewport map from changing after publication.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updatesSnapshot.viewports = { ...updates.viewports };
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Copy minimized records in the published update when this update changes them.
    // Purpose: Protect the minimized update payload from outside mutation.
    if (Object.hasOwn(updates, 'minimizedViewports')) updatesSnapshot.minimizedViewports = nextState.minimizedViewports.map((viewport) => ({ ...viewport }));
    // Copy the drag record in the published update when dragging changes.
    // Purpose: Protect the drag update payload from outside mutation.
    if (Object.hasOwn(updates, 'viewportDrag')) updatesSnapshot.viewportDrag = nextState.viewportDrag ? { ...nextState.viewportDrag } : null;
    // Copy the replacement record in the published update when confirmation state changes.
    // Purpose: Protect the replacement update payload from outside mutation.
    if (Object.hasOwn(updates, 'pendingViewportReplacement')) updatesSnapshot.pendingViewportReplacement = nextState.pendingViewportReplacement ? { ...nextState.pendingViewportReplacement } : null;

    // Prepare a separate snapshot so listeners cannot reassign the private state.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const stateSnapshot = this.getState();

    // Notify subscribers synchronously that the application state has changed.
    // Purpose: Publish an event so other modules can respond without direct coupling.
    EventBus.publish('STATE_CHANGED', {
      // Purpose: Set this named property in the surrounding object or configuration.
      updates: updatesSnapshot,
      // Purpose: Set this named property in the surrounding object or configuration.
      state: stateSnapshot,
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Return another copy so the caller does not receive the private state object.
    // Purpose: Return the result to the code that called this function.
    return this.getState();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Add or update one minimized viewport while keeping the shared list unique by side.
  // Purpose: Provide a single state-changing operation for the restore dock.
  setMinimizedViewport(viewport) {
    // Accept only a record for one of the three supported viewport containers.
    // Purpose: Validate the minimized viewport update before storing it.
    if (!viewport || !['full', 'left', 'right'].includes(viewport.side)) throw new TypeError('Store.setMinimizedViewport expects a supported viewport side.');
    // Keep every other minimized window while replacing the selected side's record.
    // Purpose: Build the next minimized list without mutating the existing list.
    const nextViewports = this.#state.minimizedViewports.filter((savedViewport) => savedViewport.side !== viewport.side);
    // Append an isolated record for the viewport being minimized.
    // Purpose: Add the viewport to the shared restore dock state.
    nextViewports.push({ ...viewport });
    // Publish the new list so the workspace can redraw its restore dock.
    // Purpose: Notify event subscribers about the state change.
    return this.setState({ minimizedViewports: nextViewports });
  // Purpose: Close the current method.
  }

  // Remove one viewport from the shared restore dock state.
  // Purpose: Provide a single state-changing operation for dock removal.
  removeMinimizedViewport(side) {
    // Accept only Full, Left, or Right viewport names.
    // Purpose: Validate the viewport side before changing shared state.
    if (!['full', 'left', 'right'].includes(side)) throw new TypeError('Store.removeMinimizedViewport expects a supported viewport side.');
    // Retain all minimized records except the one that was restored or moved.
    // Purpose: Build the next minimized list without mutating the existing list.
    const nextViewports = this.#state.minimizedViewports.filter((savedViewport) => savedViewport.side !== side);
    // Publish the filtered list so UI subscribers stay synchronized.
    // Purpose: Notify event subscribers about the state change.
    return this.setState({ minimizedViewports: nextViewports });
  // Purpose: Close the current method.
  }

  // Record or clear the native drag-and-drop operation.
  // Purpose: Keep drag state inside the shared memory bank.
  setViewportDrag(viewportDrag) {
    // Validate a non-null drag record before allowing it into shared state.
    // Purpose: Check the shape of the drag operation.
    if (viewportDrag !== null && (!viewportDrag || !['full', 'left', 'right'].includes(viewportDrag.sourceSide))) throw new TypeError('Store.setViewportDrag expects null or a supported source side.');
    // Store a copy so the caller cannot change the record after publishing it.
    // Purpose: Save the drag state and notify event subscribers.
    return this.setState({ viewportDrag: viewportDrag ? { ...viewportDrag } : null });
  // Purpose: Close the current method.
  }

  // Record or clear a Replace confirmation request for a drop onto occupied content.
  // Purpose: Keep replacement decisions inside the shared memory bank.
  setPendingViewportReplacement(operation) {
    // Validate every non-null replacement request before showing a confirmation dialog.
    // Purpose: Check both viewport names and prevent a viewport from replacing itself.
    if (operation !== null && (!operation || !['full', 'left', 'right'].includes(operation.sourceSide) || !['left', 'right'].includes(operation.targetSide) || operation.sourceSide === operation.targetSide)) throw new TypeError('Store.setPendingViewportReplacement expects a supported move operation.');
    // Store a copy of the selected move or clear the request after Cancel or Replace.
    // Purpose: Save the pending replacement operation and notify subscribers.
    return this.setState({ pendingViewportReplacement: operation ? { ...operation } : null });
  // Purpose: Close the current method.
  }

  // Persist only supported preferences explicitly included in a state update.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #persistPreferences(updates, nextState) {
    // Save a theme only when it matches one of the supported options.
    // Purpose: Check this condition before choosing which branch should run.
    if (
      // Purpose: Run this statement as the next step in the surrounding operation.
      Object.hasOwn(updates, 'theme') &&
      // Purpose: Run this statement as the next step in the surrounding operation.
      (nextState.theme === 'light' || nextState.theme === 'dark')
    // Purpose: Close the current call or grouped expression.
    ) {
      // Purpose: Start a protected operation so failures can be handled cleanly.
      try {
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        localStorage.setItem(PREFERENCE_STORAGE_KEYS.theme, nextState.theme);
      // Purpose: Close the current block, handler, object, or expression.
      } catch {
        // Theme changes still work during this session if storage is blocked.
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Store Focus Mode as the strings "true" or "false" for reliable restoration.
    // Purpose: Check this condition before choosing which branch should run.
    if (Object.hasOwn(updates, 'focusMode') && typeof nextState.focusMode === 'boolean') {
      // Purpose: Start a protected operation so failures can be handled cleanly.
      try {
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        localStorage.setItem(PREFERENCE_STORAGE_KEYS.focusMode, String(nextState.focusMode));
      // Purpose: Close the current block, handler, object, or expression.
      } catch {
        // Focus Mode still works during this session if storage is blocked.
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Save the sidebar preference using the same boolean-string format.
    // Purpose: Check this condition before choosing which branch should run.
    if (Object.hasOwn(updates, 'sidebarOpen') && typeof nextState.sidebarOpen === 'boolean') {
      // Purpose: Start a protected operation so failures can be handled cleanly.
      try {
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        localStorage.setItem(PREFERENCE_STORAGE_KEYS.sidebarOpen, String(nextState.sidebarOpen));
      // Purpose: Close the current block, handler, object, or expression.
      } catch {
        // Sidebar changes still work during this session if storage is blocked.
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Load saved preferences, using the previous keys only as a migration fallback.
  // Purpose: Run this statement as the next step in the surrounding operation.
  init() {
    // Declare variables for values read from the browser's local storage.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let storedTheme;
    // Purpose: Declare a variable that stores a value needed by this logic.
    let storedFocusMode;
    // Purpose: Declare a variable that stores a value needed by this logic.
    let storedSidebarOpen;

    // Browser privacy settings can make localStorage unavailable, so guard access.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Prefer the current theme key, then migrate the previously saved value if needed.
      // Purpose: Read, save, or remove a preference or temporary value in browser storage.
      storedTheme = localStorage.getItem(PREFERENCE_STORAGE_KEYS.theme)
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        ?? localStorage.getItem(PREVIOUS_PREFERENCE_STORAGE_KEYS.theme);
      // Restore Focus Mode from the current key or the previous key.
      // Purpose: Read, save, or remove a preference or temporary value in browser storage.
      storedFocusMode = localStorage.getItem(PREFERENCE_STORAGE_KEYS.focusMode)
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        ?? localStorage.getItem(PREVIOUS_PREFERENCE_STORAGE_KEYS.focusMode);
      // Restore the sidebar state from the current key or the previous key.
      // Purpose: Read, save, or remove a preference or temporary value in browser storage.
      storedSidebarOpen = localStorage.getItem(PREFERENCE_STORAGE_KEYS.sidebarOpen)
        // Purpose: Read, save, or remove a preference or temporary value in browser storage.
        ?? localStorage.getItem(PREVIOUS_PREFERENCE_STORAGE_KEYS.sidebarOpen);
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // Keep the default state if the browser blocks localStorage access.
      // Purpose: Return the result to the code that called this function.
      return this.getState();
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Collect only settings that contain recognized legacy values.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const updates = {};

    // Restore a supported theme without replacing the default for unknown values.
    // Purpose: Check this condition before choosing which branch should run.
    if (storedTheme === 'light' || storedTheme === 'dark') {
      // Apply the theme value saved by the old application.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.theme = storedTheme;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Recognize the legacy true values for focus mode.
    // Purpose: Check this condition before choosing which branch should run.
    if (storedFocusMode === 'true' || storedFocusMode === '1') {
      // Restore focus mode as enabled.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.focusMode = true;
    // Purpose: Close the current block, handler, object, or expression.
    } else if (storedFocusMode === 'false' || storedFocusMode === '0') {
      // Restore focus mode as disabled when that is what was saved.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.focusMode = false;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Recognize the legacy true values for the sidebar setting.
    // Purpose: Check this condition before choosing which branch should run.
    if (storedSidebarOpen === 'true' || storedSidebarOpen === '1') {
      // Restore the sidebar as open.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.sidebarOpen = true;
    // Purpose: Close the current block, handler, object, or expression.
    } else if (storedSidebarOpen === 'false' || storedSidebarOpen === '0') {
      // Restore the sidebar as closed when that is what was saved.
      // Purpose: Run this statement as the next step in the surrounding operation.
      updates.sidebarOpen = false;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Publish one state change only when a recognized saved setting was found.
    // Purpose: Check this condition before choosing which branch should run.
    if (Object.keys(updates).length > 0) {
      // Use setState so normal state-change subscribers are notified as well.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.setState(updates);
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Return a safe snapshot of the state after the migration check.
    // Purpose: Return the result to the code that called this function.
    return this.getState();
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Create one shared Store so application modules read the same state.
// Purpose: Declare a variable that stores a value needed by this logic.
const store = new Store();

// Export the shared Store instance for the rest of the application.
// Purpose: Run this statement as the next step in the surrounding operation.
export default store;
