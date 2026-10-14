// Import the shared Store so controls request changes through application state.
// Purpose: Import a shared module so this file can reuse its functionality.
import Store from '../core/Store.js';
// Import the shared EventBus so this class can react to state updates.
// Purpose: Import a shared module so this file can reuse its functionality.
import EventBus from '../core/EventBus.js';

// Connect workspace controls to the shared state and the page's DOM.
// Purpose: Run this statement as the next step in the surrounding operation.
export class WorkspaceUI {
  // Find the controls and attach their event listeners.
  // Purpose: Run this statement as the next step in the surrounding operation.
  constructor() {
    // Keep the existing theme control available to this class.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.themeToggle = document.querySelector('#theme-toggle');
    // Keep the existing focus-mode control available to this class.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.focusModeToggle = document.querySelector('#focus-mode-toggle');
    // Cache the top bar so Focus Mode can reveal it when needed.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.topbar = document.querySelector('.topbar');
    // Remember the last scroll position to detect whether the page moves up or down.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.lastScrollY = window.scrollY;

    // Find the button that opens or closes the sidebar.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.sidebarToggle = document.querySelector('#sidebar-toggle');
    // Find the button that selects the Full Screen layout.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.fullScreenButton = document.querySelector('#viewport-fullscreen');
    // Find the button that selects the Split Screen layout.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.splitScreenButton = document.querySelector('#viewport-split-screen');
    // Find the parent that contains both viewport layouts.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportComposition = document.querySelector('#viewport-composition');
    // Find the single-viewport layout from the page markup.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.fullScreenViewportLayout = document.querySelector('#viewport-fullscreen-layout');
    // Find the two-pane layout from the page markup.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.splitScreenViewportLayout = document.querySelector('#viewport-split-layout');
    // Find the divider that adjusts the two pane widths.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.splitDivider = document.querySelector('#viewport-split-divider');
    // Cache the welcome state shown while no viewport window is active.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.workspaceEmptyState = document.querySelector('.workspace-empty-state');
    // Cache the shared viewport toolbar.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportTopbar = document.querySelector('#viewport-topbar');
    // Cache the Full Screen or solo-pane toolbar.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportToolbarFull = document.querySelector('#viewport-toolbar-full');
    // Cache the Left pane toolbar.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportToolbarLeft = document.querySelector('#viewport-toolbar-left');
    // Cache the Right pane toolbar.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportToolbarRight = document.querySelector('#viewport-toolbar-right');
    // Cache the Full Screen viewport number.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportNumberFull = document.querySelector('#viewport-number-full');
    // Cache the Left pane viewport number.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportNumberLeft = document.querySelector('#viewport-number-left');
    // Cache the Right pane viewport number.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportNumberRight = document.querySelector('#viewport-number-right');
    // Cache the minimized-window dock and entries container.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportMinimizedDock = document.querySelector('#viewport-minimized-dock');
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportMinimizedItems = document.querySelector('#viewport-minimized-items');
    // Cache the Full Screen minimize button shared by a solo pane.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportMinimizeFullButton = document.querySelector('#viewport-minimize-full');
    // Cache the Left pane minimize button.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportMinimizeLeftButton = document.querySelector('#viewport-minimize-left');
    // Cache the Right pane minimize button.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportMinimizeRightButton = document.querySelector('#viewport-minimize-right');
    // Cache the Full Screen close button shared by a solo pane.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportCloseFullButton = document.querySelector('#viewport-close-full');
    // Cache the Left pane close button.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportCloseLeftButton = document.querySelector('#viewport-close-left');
    // Cache the Right pane close button.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.viewportCloseRightButton = document.querySelector('#viewport-close-right');
    // Cache the existing modal used when a dropped viewport would replace content.
    // Purpose: Find the HTML element used to confirm a viewport move.
    this.viewportReplaceDialog = document.querySelector('#viewport-replace-dialog');
    // Cache the Cancel button in the existing replacement dialog.
    // Purpose: Find the HTML element used to reject a viewport move.
    this.viewportReplaceCancelButton = document.querySelector('#viewport-replace-cancel');
    // Cache the Replace button in the existing replacement dialog.
    // Purpose: Find the HTML element used to confirm a viewport move.
    this.viewportReplaceConfirmButton = document.querySelector('#viewport-replace-confirm');
    // Start with no active viewport, matching the legacy state machine.
    // Purpose: Store a value needed by the next operation.
    this.activeViewportMode = null;
    // Remember which pane remains active when its partner is minimized.
    // Purpose: Store a value needed by the next operation.
    this.soloSplitSide = null;
    // Remember the last successful drop time so its follow-up click does not restore a tile.
    // Purpose: Store a value needed by the next operation.
    this.lastViewportDropAt = 0;
    // Begin Split Screen at a balanced ratio.
    // Purpose: Store a value needed by the next operation.
    this.rememberedSplitRatio = 0.5;

    // Listen for theme clicks only when the theme button exists.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.themeToggle?.addEventListener('click', () => {
      // Read the latest state so rapid clicks do not use a stale value.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const currentState = Store.getState();
      // Choose the opposite theme from the one that is currently active.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const newTheme = currentState.theme === 'dark' ? 'light' : 'dark';
      // Ask the Store to publish the theme update.
      // Purpose: Run this statement as the next step in the surrounding operation.
      Store.setState({ theme: newTheme });
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Listen for focus-mode clicks only when the focus button exists.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.focusModeToggle?.addEventListener('click', () => {
      // Read the latest focus setting from the shared state.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const currentState = Store.getState();
      // Invert the current value to switch focus mode on or off.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const newFocusMode = !currentState.focusMode;
      // Ask the Store to publish the focus-mode update.
      // Purpose: Run this statement as the next step in the surrounding operation.
      Store.setState({ focusMode: newFocusMode });
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Toggle the sidebar by requesting the inverse of its current state.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.sidebarToggle?.addEventListener('click', () => {
      // Let the Store remain the single source of truth for the sidebar.
      // Purpose: Run this statement as the next step in the surrounding operation.
      Store.setState({ sidebarOpen: !Store.getState().sidebarOpen });
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Open Full Screen through the shared viewport state machine.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.fullScreenButton?.addEventListener('click', () => {
      // Preserve populated viewports and select Full Screen.
      // Purpose: Run the next viewport operation.
      this.setViewportMode('full');
    // Purpose: Close the current handler.
    });
    // Open both Split Screen panes through the shared state machine.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.splitScreenButton?.addEventListener('click', () => {
      // Preserve or restore content while selecting Split Screen.
      // Purpose: Run the next viewport operation.
      this.setViewportMode('split');
    // Purpose: Close the current handler.
    });
    // Connect the Full Screen minimize button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportMinimizeFullButton?.addEventListener('click', () => {
      // Minimize Full Screen or the active solo split pane.
      // Purpose: Run the next viewport operation.
      this.minimizeFullScreenViewport();
    // Purpose: Close the current handler.
    });
    // Connect the Left pane minimize button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportMinimizeLeftButton?.addEventListener('click', () => {
      // Minimize Left while keeping Right visible.
      // Purpose: Run the next viewport operation.
      this.minimizeSplitViewport('left');
    // Purpose: Close the current handler.
    });
    // Connect the Right pane minimize button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportMinimizeRightButton?.addEventListener('click', () => {
      // Minimize Right while keeping Left visible.
      // Purpose: Run the next viewport operation.
      this.minimizeSplitViewport('right');
    // Purpose: Close the current handler.
    });
    // Connect the Full Screen and solo-pane close button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportCloseFullButton?.addEventListener('click', () => {
      // Route the close action to the viewport window that is visible.
      // Purpose: Run the next viewport operation.
      this.closeFullScreenViewport();
    // Purpose: Close the current handler.
    });
    // Connect the Left pane close button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportCloseLeftButton?.addEventListener('click', () => {
      // Close Left after the user confirms.
      // Purpose: Run the next viewport operation.
      this.closeSplitViewport('left');
    // Purpose: Close the current handler.
    });
    // Connect the Right pane close button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.viewportCloseRightButton?.addEventListener('click', () => {
      // Close Right after the user confirms.
      // Purpose: Run the next viewport operation.
      this.closeSplitViewport('right');
    // Purpose: Close the current handler.
    });
    // Save the callback that activates viewports for incoming file-open requests.
    // Purpose: Store a callback needed by EventBus.
    this.fileOpenRequestedHandler = (payload = {}) => {
      // Activate the destination before an adapter mounts the selected file.
      // Purpose: Run the next viewport operation.
      this.activateViewportForTarget(payload.viewportType);
    // Purpose: Close the current callback.
    };
    // Save the callback for a successful PDF open notification.
    // Purpose: Store a callback needed by EventBus.
    this.pdfOpenedHandler = (payload = {}) => {
      // Keep a successfully opened PDF's destination visible.
      // Purpose: Run the next viewport operation.
      this.activateViewportForTarget(payload.viewportType);
    // Purpose: Close the current callback.
    };

    // Restore the top bar reveal behavior used while Focus Mode is active.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.installFocusModeTopbarListeners();

    // Attach the legacy-compatible pointer and keyboard behavior to the divider.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.installSplitDividerControls();
    // Register native drag-and-drop and Replace dialog behavior without inline handlers.
    // Purpose: Wire the existing viewport DOM to the event-driven move workflow.
    this.installViewportDragAndDrop();

    // Render every update made through the shared Store.
    // Purpose: Subscribe to a shared state event.
    EventBus.subscribe('STATE_CHANGED', this.handleStateChange.bind(this));
    // Activate the requested destination before the relevant renderer runs.
    // Purpose: Subscribe to a shared file-open event.
    EventBus.subscribe('FILE_OPEN_REQUESTED', this.fileOpenRequestedHandler);
    // Ensure a successful PDF open leaves its viewport visible.
    // Purpose: Subscribe to a shared PDF-open event.
    EventBus.subscribe('PDF_OPENED', this.pdfOpenedHandler);
    // Draw the initial empty workspace now that the listeners are ready.
    // Purpose: Run the next viewport operation.
    this.handleStateChange({ state: Store.getState() });
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Read minimized records as a fresh Map so old lookup code cannot mutate Store directly.
  // Purpose: Expose a convenient read-only view of shared minimized-window state.
  get minimizedViewportStates() {
    // Read the cloned list returned by Store before building the lookup map.
    // Purpose: Keep this helper separate from Store's private array.
    const savedViewports = Store.getState().minimizedViewports;
    // Return a new lookup Map whose changes do not affect Store.
    // Purpose: Support side-based restore-dock lookups.
    return new Map(savedViewports.map((savedViewport) => [savedViewport.side, savedViewport]));
  // Purpose: Close the current getter.
  }

  // Show the top bar only while Focus Mode is enabled.
  // Purpose: Run this statement as the next step in the surrounding operation.
  showTopbar() {
    // Read the latest shared setting before revealing the top bar.
    // Purpose: Check this condition before choosing which branch should run.
    if (Store.getState().focusMode === true) {
      // Apply the existing CSS class that slides the top bar into view.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.topbar?.classList.add('is-visible');
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Hide the top bar only while Focus Mode is enabled.
  // Purpose: Run this statement as the next step in the surrounding operation.
  hideTopbar() {
    // Check the current setting so normal browsing remains unchanged.
    // Purpose: Check this condition before choosing which branch should run.
    if (Store.getState().focusMode === true) {
      // Remove the reveal class so the top bar slides out of view again.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.topbar?.classList.remove('is-visible');
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Restore the legacy scroll and mouse triggers for the top bar.
  // Purpose: Run this statement as the next step in the surrounding operation.
  installFocusModeTopbarListeners() {
    // Watch scroll changes so moving up reveals the bar and moving down hides it.
    // Purpose: Register a handler so the application reacts when this event occurs.
    window.addEventListener('scroll', () => {
      // Read the current vertical scroll position from the browser.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const currentScrollY = window.scrollY;
      // Check the shared setting instead of maintaining another Focus Mode flag.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const isFocusMode = Store.getState().focusMode === true;

      // Use the legacy direction logic only while Focus Mode is active.
      // Purpose: Check this condition before choosing which branch should run.
      if (isFocusMode) {
        // Reveal the top bar when scrolling up or staying near the top.
        // Purpose: Check this condition before choosing which branch should run.
        if (currentScrollY < this.lastScrollY || currentScrollY <= 10) {
          // Add the class that exposes the top bar.
          // Purpose: Run this statement as the next step in the surrounding operation.
          this.showTopbar();
        // Hide the top bar when the user scrolls down the page.
        // Purpose: Close the current block, handler, object, or expression.
        } else if (currentScrollY > this.lastScrollY) {
          // Remove the class while downward scrolling continues.
          // Purpose: Run this statement as the next step in the surrounding operation.
          this.hideTopbar();
        // Purpose: Close the current block, handler, object, or expression.
        }
      // Clear the reveal class when Focus Mode is turned off.
      // Purpose: Close the current block, handler, object, or expression.
      } else {
        // Keep ordinary browsing independent from the Focus Mode reveal class.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.topbar?.classList.remove('is-visible');
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Save this position so the next scroll event can detect direction.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.lastScrollY = currentScrollY;
    // Purpose: Close the current block, handler, object, or expression.
    }, { passive: true });

    // Reveal the top bar when the pointer reaches the top edge of the screen.
    // Purpose: Register a handler so the application reacts when this event occurs.
    document.addEventListener('mousemove', (event) => {
      // Require Focus Mode and the same ten-pixel boundary as the legacy code.
      // Purpose: Check this condition before choosing which branch should run.
      if (Store.getState().focusMode === true && event.clientY <= 10) {
        // Show the bar without affecting normal browsing.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.showTopbar();
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Reveal the bar when the pointer enters its area during Focus Mode.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.topbar?.addEventListener('mouseenter', () => {
      // The method checks Focus Mode before changing the class.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.showTopbar();
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Hide the bar when the pointer leaves its area during Focus Mode.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.topbar?.addEventListener('mouseleave', () => {
      // The method checks Focus Mode before changing the class.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.hideTopbar();
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Also reveal the bar when keyboard focus moves into its controls.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.topbar?.addEventListener('focusin', () => {
      // Keep keyboard navigation convenient without changing the legacy design.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.showTopbar();
    // Purpose: Close the current block, handler, object, or expression.
    });
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Add the same resize math and key controls used by the original workspace.
  // Purpose: Run this statement as the next step in the surrounding operation.
  installSplitDividerControls() {
    // Keep references short and clear inside the event handlers.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const divider = this.splitDivider;
    // The composition box is the area used to calculate the divider position.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const composition = this.viewportComposition;
    // Both elements are required before resizing can work.
    // Purpose: Check this condition before choosing which branch should run.
    if (!divider || !this.splitScreenViewportLayout || !composition) return;

    // Apply a ratio while keeping the left pane between 20% and 80%.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const setSplitViewportRatio = (ratio) => {
      // Choose the correct external stylesheet class for this ratio.
      // Purpose: Run the next viewport operation.
      this.setSplitViewportRatio(ratio);
    // Purpose: Close the current block, handler, object, or expression.
    };

    // Track the active pointer only while the user is dragging the divider.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let activePointerId = null;

    // Convert the pointer's horizontal position into a bounded split ratio.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const updateSplitRatioFromPointer = (event) => {
      // Ignore movement from a pointer that did not start this drag.
      // Purpose: Check this condition before choosing which branch should run.
      if (event.pointerId !== activePointerId) return;

      // Measure the whole viewport composition, as the original code did.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const layoutBounds = composition.getBoundingClientRect();
      // Measure the divider so its half-width is removed from the pointer offset.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const dividerWidth = divider.getBoundingClientRect().width;
      // Exclude the divider itself from the width available to the two panes.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const usableWidth = layoutBounds.width - dividerWidth;
      // Avoid division by zero when the layout has no usable width.
      // Purpose: Check this condition before choosing which branch should run.
      if (usableWidth <= 0) return;

      // Find the left pane width using the pointer and half the divider width.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const leftWidth = event.clientX - layoutBounds.left - dividerWidth / 2;
      // Convert the left pane width into a ratio and apply the 20–80% limits.
      // Purpose: Run this statement as the next step in the surrounding operation.
      setSplitViewportRatio(leftWidth / usableWidth);
    // Purpose: Close the current block, handler, object, or expression.
    };

    // End a drag and remove its temporary pointer listeners.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const stopSplitResize = () => {
      // Do nothing if no pointer is currently being tracked.
      // Purpose: Check this condition before choosing which branch should run.
      if (activePointerId === null) return;
      // Stop listening for movement after the drag has ended.
      // Purpose: Remove a handler so it no longer receives this event.
      divider.removeEventListener('pointermove', updateSplitRatioFromPointer);
      // Stop listening for the pointer release after the drag has ended.
      // Purpose: Remove a handler so it no longer receives this event.
      divider.removeEventListener('pointerup', stopSplitResize);
      // Stop listening for a cancelled pointer after the drag has ended.
      // Purpose: Remove a handler so it no longer receives this event.
      divider.removeEventListener('pointercancel', stopSplitResize);
      // Release the pointer capture when this element still owns it.
      // Purpose: Check this condition before choosing which branch should run.
      if (divider.hasPointerCapture(activePointerId)) {
        // Return pointer events to their normal target after this drag.
        // Purpose: Run this statement as the next step in the surrounding operation.
        divider.releasePointerCapture(activePointerId);
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Clear the active pointer so the next drag can begin.
      // Purpose: Run this statement as the next step in the surrounding operation.
      activePointerId = null;
    // Purpose: Close the current block, handler, object, or expression.
    };

    // Begin a drag only for the primary pointer and the left mouse button.
    // Purpose: Register a handler so the application reacts when this event occurs.
    divider.addEventListener('pointerdown', (event) => {
      // Ignore secondary pointers and non-left mouse clicks.
      // Purpose: Check this condition before choosing which branch should run.
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      // Prevent text selection or other browser actions while starting a drag.
      // Purpose: Run this statement as the next step in the surrounding operation.
      event.preventDefault();

      // Remember which pointer owns the current resize operation.
      // Purpose: Run this statement as the next step in the surrounding operation.
      activePointerId = event.pointerId;
      // Keep subsequent pointer events directed to the divider while dragging.
      // Purpose: Run this statement as the next step in the surrounding operation.
      divider.setPointerCapture(activePointerId);
      // Update the pane ratio whenever the active pointer moves.
      // Purpose: Register a handler so the application reacts when this event occurs.
      divider.addEventListener('pointermove', updateSplitRatioFromPointer);
      // Finish the drag when the pointer is released.
      // Purpose: Register a handler so the application reacts when this event occurs.
      divider.addEventListener('pointerup', stopSplitResize);
      // Also finish the drag if the browser cancels the pointer.
      // Purpose: Register a handler so the application reacts when this event occurs.
      divider.addEventListener('pointercancel', stopSplitResize);
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Support keyboard resizing for users who do not use pointer dragging.
    // Purpose: Register a handler so the application reacts when this event occurs.
    divider.addEventListener('keydown', (event) => {
      // Read the current percentage, using 50% when no value has been set.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const currentRatio = Number(divider.getAttribute('aria-valuenow') || '50') / 100;
      // Move two percentage points toward the left pane on ArrowLeft.
      // Purpose: Check this condition before choosing which branch should run.
      if (event.key === 'ArrowLeft') {
        // Keep the arrow key from scrolling the whole page.
        // Purpose: Run this statement as the next step in the surrounding operation.
        event.preventDefault();
        // Apply the slightly smaller left pane ratio.
        // Purpose: Run this statement as the next step in the surrounding operation.
        setSplitViewportRatio(currentRatio - 0.02);
      // Purpose: Close the current block, handler, object, or expression.
      } else if (event.key === 'ArrowRight') {
        // Keep the arrow key from scrolling the whole page.
        // Purpose: Run this statement as the next step in the surrounding operation.
        event.preventDefault();
        // Apply the slightly larger left pane ratio.
        // Purpose: Run this statement as the next step in the surrounding operation.
        setSplitViewportRatio(currentRatio + 0.02);
      // Purpose: Close the current block, handler, object, or expression.
      } else if (event.key === 'Home') {
        // Keep the Home key from jumping the page to its top.
        // Purpose: Run this statement as the next step in the surrounding operation.
        event.preventDefault();
        // Put the left pane at its original minimum width of 20%.
        // Purpose: Run this statement as the next step in the surrounding operation.
        setSplitViewportRatio(0.2);
      // Purpose: Close the current block, handler, object, or expression.
      } else if (event.key === 'End') {
        // Keep the End key from jumping the page to its bottom.
        // Purpose: Run this statement as the next step in the surrounding operation.
        event.preventDefault();
        // Put the left pane at its original maximum width of 80%.
        // Purpose: Run this statement as the next step in the surrounding operation.
        setSplitViewportRatio(0.8);
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Apply the initial balanced ratio before the user begins resizing.
    // Purpose: Run this statement as the next step in the surrounding operation.
    setSplitViewportRatio(this.rememberedSplitRatio);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Record the dragged restore tile and expose its side to the native browser drag system.
  // Purpose: Begin one validated viewport move from the minimized dock.
  handleDockDragStart(event, side) {
    // Stop the drag if the selected window is no longer present in shared minimized state.
    // Purpose: Reject stale dock controls before the browser starts a move.
    if (!this.minimizedViewportStates.has(side)) {
      // Cancel the browser's default drag operation for an invalid source.
      // Purpose: Prevent a stale restore button from starting an unsupported move.
      event.preventDefault();
      // Leave the handler without changing any shared state.
      // Purpose: Stop processing the invalid source.
      return;
    // Purpose: Close the source validation condition.
    }
    // Mark the current restore button so the stylesheet can show drag feedback.
    // Purpose: Display which minimized viewport is being moved.
    event.currentTarget.classList.add('is-dragging');
    // Write transfer metadata only when the browser supplied a DataTransfer object.
    // Purpose: Support native HTML5 dragging without relying only on module memory.
    if (event.dataTransfer) {
      // Tell the browser this drag intends to move the existing viewport.
      // Purpose: Set the native drag operation type.
      event.dataTransfer.effectAllowed = 'move';
      // Save the application-specific key used by the receiving viewport.
      // Purpose: Identify the dragged viewport in the native transfer object.
      event.dataTransfer.setData('application/x-lux-viewport', side);
      // Add a plain-text fallback for browsers that handle custom transfer types differently.
      // Purpose: Keep the source side available through the standard text transfer type.
      event.dataTransfer.setData('text/plain', side);
    // Purpose: Close the DataTransfer availability condition.
    }
    // Record the active drag in the shared Store so all listeners see one source of truth.
    // Purpose: Publish the current drag state through EventBus-backed Store state.
    Store.setViewportDrag({ sourceSide: side });
  // Purpose: Close the dragstart handler.
  }

  // Clear drag styling and shared drag state after a native drag ends.
  // Purpose: Finish the minimized dock drag lifecycle safely.
  handleDockDragEnd(event, side) {
    // Remove the dragged appearance from the button even when the drop was cancelled.
    // Purpose: Restore the normal dock control appearance.
    event.currentTarget?.classList.remove('is-dragging');
    // Remove every drop-target outline in case the browser ended the drag outside a viewport.
    // Purpose: Ensure cancelled and completed drags do not leave stale visual feedback.
    document.querySelectorAll('.viewport.is-drop-target').forEach((viewport) => viewport.classList.remove('is-drop-target'));
    // Read the shared record so an older dragend cannot clear a newer drag operation.
    // Purpose: Check which viewport currently owns the drag state.
    const activeDrag = Store.getState().viewportDrag;
    // Clear drag state only when this event belongs to the current source tile.
    // Purpose: Keep unrelated or stale dragend events from clearing another drag.
    if (activeDrag?.sourceSide === side) Store.setViewportDrag(null);
  // Purpose: Close the dragend handler.
  }

  // Connect the existing Left and Right viewport containers to native drop events.
  // Purpose: Keep drag-and-drop behavior inside the workspace UI module.
  installViewportDragAndDrop() {
    // Register drop targets only for the two split panes, matching the legacy behavior.
    // Purpose: Keep the Full Screen viewport out of the native drag target list.
    for (const side of ['left', 'right']) {
      // Find the fixed viewport container associated with the current target side.
      // Purpose: Attach listeners to the existing DOM rather than recreating HTML.
      const viewport = this.getViewportElement(side);
      // Skip a missing target instead of breaking workspace startup.
      // Purpose: Keep the event setup safe if optional markup is absent.
      if (!viewport) continue;
      // Accept drags only when a valid minimized window is being carried.
      // Purpose: Register the native dragover handler for this target.
      viewport.addEventListener('dragover', (event) => {
        // Read the current drag source from shared state or the browser transfer object.
        // Purpose: Find the minimized viewport currently being dragged.
        const sourceSide = Store.getState().viewportDrag?.sourceSide || event.dataTransfer?.getData('application/x-lux-viewport');
        // Ignore empty, self-targeted, or no-longer-minimized drag sources.
        // Purpose: Prevent invalid viewport moves before the browser accepts the drop.
        if (!sourceSide || sourceSide === side || !this.minimizedViewportStates.has(sourceSide)) return;
        // Tell the browser that this viewport accepts the current move operation.
        // Purpose: Enable the native drop event for an allowed viewport target.
        event.preventDefault();
        // Use the standard move cursor feedback where a DataTransfer object exists.
        // Purpose: Communicate that the item will move instead of being copied.
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        // Add the stylesheet class that highlights the active drop target.
        // Purpose: Show the user where the minimized window will be moved.
        viewport.classList.add('is-drop-target');
      // Purpose: Close the dragover handler.
      });
      // Remove highlighting when the pointer leaves the viewport instead of entering a child.
      // Purpose: Register the native dragleave handler for this target.
      viewport.addEventListener('dragleave', (event) => {
        // Keep the highlight while the pointer moves between descendants of the same viewport.
        // Purpose: Avoid flickering when the pointer crosses viewer controls.
        if (event.relatedTarget && viewport.contains(event.relatedTarget)) return;
        // Clear the visual indication after leaving this target.
        // Purpose: Remove the stylesheet class used for drop feedback.
        viewport.classList.remove('is-drop-target');
      // Purpose: Close the dragleave handler.
      });
      // Complete an allowed drop by requesting a safe move through the workspace controller.
      // Purpose: Register the native drop handler for this target.
      viewport.addEventListener('drop', (event) => {
        // Read the source saved at dragstart, using the data transfer payload as fallback.
        // Purpose: Find the minimized viewport to be moved.
        const sourceSide = event.dataTransfer?.getData('application/x-lux-viewport') || Store.getState().viewportDrag?.sourceSide;
        // Ignore a drop when its source is invalid or has already left the restore dock.
        // Purpose: Keep unsupported drop operations from changing viewport state.
        if (!sourceSide || sourceSide === side || !this.minimizedViewportStates.has(sourceSide)) return;
        // Prevent the browser from treating the viewport drop as a file or text insertion.
        // Purpose: Keep the operation under the application's control.
        event.preventDefault();
        // Remember this drop so the browser's follow-up click cannot trigger Restore.
        // Purpose: Avoid running both move and restore for the same gesture.
        this.lastViewportDropAt = Date.now();
        // Remove any drop target highlights after the target has been chosen.
        // Purpose: Reset the visual feedback for the finished drag.
        document.querySelectorAll('.viewport.is-drop-target').forEach((target) => target.classList.remove('is-drop-target'));
        // Start the move or open the replacement confirmation if the target is occupied.
        // Purpose: Route both occupied and empty drops through one state-aware method.
        this.handleViewportDrop(sourceSide, side);
      // Purpose: Close the drop handler.
      });
    // Purpose: Close the loop over Left and Right targets.
    }
    // Route the existing Replace button to the stored pending operation.
    // Purpose: Register the modal confirmation handler without inline JavaScript.
    this.viewportReplaceConfirmButton?.addEventListener('click', () => this.confirmViewportReplacement());
    // Route Cancel to a method that clears the pending replacement from Store.
    // Purpose: Register the modal cancellation handler without inline JavaScript.
    this.viewportReplaceCancelButton?.addEventListener('click', () => this.cancelViewportReplacement());
    // Treat a click on the dialog's outside area as a Cancel action.
    // Purpose: Preserve the legacy behavior for dismissing the replacement dialog.
    this.viewportReplaceDialog?.addEventListener('click', (event) => {
      // Ignore clicks inside the confirmation card itself.
      // Purpose: Keep the confirmation dialog open while the user interacts with its controls.
      if (event.target !== this.viewportReplaceDialog) return;
      // Cancel the move when the user clicks the modal's outside area.
      // Purpose: Clear the pending operation and close the dialog.
      this.cancelViewportReplacement();
    // Purpose: Close the dialog click handler.
    });
    // Allow Escape to cancel only when a replacement operation is pending.
    // Purpose: Register the keyboard shortcut for dialog cancellation.
    document.addEventListener('keydown', (event) => {
      // Ignore other keys or Escape presses when the dialog is not active.
      // Purpose: Avoid affecting ordinary keyboard navigation.
      if (event.key !== 'Escape' || !Store.getState().pendingViewportReplacement) return;
      // Cancel the current Replace decision using the same shared-state method.
      // Purpose: Keep mouse and keyboard cancellation consistent.
      this.cancelViewportReplacement();
    // Purpose: Close the document keydown handler.
    });
  // Purpose: Close the viewport drag-and-drop installation method.
  }

  // Handle a dropped dock tile by either moving it now or asking before replacement.
  // Purpose: Keep the target occupancy check in the workspace controller.
  handleViewportDrop(sourceSide, targetSide) {
    // Accept only a minimized source and a Left or Right target that is not itself.
    // Purpose: Validate the requested source and destination before making changes.
    if (!['full', 'left', 'right'].includes(sourceSide) || !['left', 'right'].includes(targetSide) || sourceSide === targetSide || !this.minimizedViewportStates.has(sourceSide)) return;
    // Ask before replacing content that is already mounted in the target viewport.
    // Purpose: Protect the active document from accidental replacement.
    if (this.hasViewportContent(targetSide)) {
      // Stop rather than overwrite content if the existing confirmation markup is missing.
      // Purpose: Keep occupied-target moves safe when optional markup is unavailable.
      if (!this.viewportReplaceDialog) return;
      // Store the exact source and target until the user chooses Replace or Cancel.
      // Purpose: Preserve the user's requested move in shared application state.
      Store.setPendingViewportReplacement({ sourceSide: sourceSide, targetSide: targetSide });
      // Reveal the existing replacement dialog through its hidden HTML attribute.
      // Purpose: Display the confirmation question without inline styles.
      this.viewportReplaceDialog.hidden = false;
      // Place keyboard focus on Replace so the next action is clear and accessible.
      // Purpose: Support fast keyboard confirmation.
      this.viewportReplaceConfirmButton?.focus();
      // Stop here until the user makes a decision.
      // Purpose: Prevent moving the source before replacement is confirmed.
      return;
    // Purpose: Close the occupied-target condition.
    }
    // Move into an empty viewport immediately without showing a confirmation dialog.
    // Purpose: Keep empty-target drops direct and predictable.
    this.moveViewportContents(sourceSide, targetSide);
  // Purpose: Close the drop routing method.
  }

  // Confirm the stored move only after the user presses Replace.
  // Purpose: Keep the confirmation button separate from DOM move details.
  confirmViewportReplacement() {
    // Read the selected operation from Store rather than a local pending variable.
    // Purpose: Retrieve the move chosen by the user.
    const pending = Store.getState().pendingViewportReplacement;
    // Ignore Replace when no drop is waiting for confirmation.
    // Purpose: Keep repeated or stale button presses harmless.
    if (!pending) return;
    // Hide the dialog using the existing hidden HTML attribute.
    // Purpose: Close the confirmation UI without inline style writes.
    if (this.viewportReplaceDialog) this.viewportReplaceDialog.hidden = true;
    // Clear shared pending state before performing the DOM operation.
    // Purpose: Finish the confirmation part of the event-driven flow.
    Store.setPendingViewportReplacement(null);
    // Move the minimized window to the accepted target viewport.
    // Purpose: Complete the user's confirmed Replace operation.
    this.moveViewportContents(pending.sourceSide, pending.targetSide);
  // Purpose: Close the confirmation method.
  }

  // Cancel the stored move without changing any mounted viewer nodes.
  // Purpose: Keep modal cancellation separate from DOM move details.
  cancelViewportReplacement() {
    // Hide the dialog when it exists on the current page.
    // Purpose: Close the confirmation UI without inline style writes.
    if (this.viewportReplaceDialog) this.viewportReplaceDialog.hidden = true;
    // Clear the operation so a later Replace click cannot reuse it.
    // Purpose: Reset shared pending replacement state.
    Store.setPendingViewportReplacement(null);
  // Purpose: Close the cancellation method.
  }

  // Move the mounted viewer nodes rather than rendering the source document again.
  // Purpose: Preserve existing content instances when a minimized window is moved.
  moveViewportContents(sourceSide, targetSide) {
    // Find the original host and the host that will receive the mounted content.
    // Purpose: Resolve both fixed containers before touching their child nodes.
    const sourceRoot = this.getViewportElement(sourceSide);
    // Purpose: Resolve the destination container from its supported side name.
    const targetRoot = this.getViewportElement(targetSide);
    // Read the saved dock record so a known filename survives a move with sparse metadata.
    // Purpose: Preserve a useful restore label until the target host owns the document.
    const savedSource = this.minimizedViewportStates.get(sourceSide);
    // Refuse invalid targets, missing hosts, and sources that are no longer minimized.
    // Purpose: Keep the move operation safe if another event changes state first.
    if (!sourceRoot || !targetRoot || sourceSide === targetSide || !savedSource || !['left', 'right'].includes(targetSide)) return false;
    // Save the current file name and PDF-specific classes before touching either host.
    // Purpose: Transfer viewport metadata along with the mounted document nodes.
    const sourceFileName = sourceRoot.dataset.fileName || savedSource.fileName || '';
    // Remember whether the current source host belongs to the PDF viewer adapter.
    // Purpose: Reapply only the viewer-specific classes that belong with moved content.
    const sourceHasPdfClass = sourceRoot.classList.contains('lux-pdf-editor-root');
    // Remember whether the source host is displaying a PDF rendering error.
    // Purpose: Preserve a useful error appearance when moving an error view.
    const sourceHasPdfErrorClass = sourceRoot.classList.contains('lux-pdf-render-error');
    // Release the target's current adapter-owned viewer before its DOM is replaced.
    // Purpose: Let adapters dispose the replaced document through the event system.
    if (this.hasViewportContent(targetSide)) EventBus.publish('VIEWPORT_CLOSE_REQUESTED', { viewportType: targetSide });
    // Remove any remaining ordinary target children after adapter cleanup has run.
    // Purpose: Ensure the target host is empty before receiving the source nodes.
    targetRoot.replaceChildren();
    // Move the source's Shadow DOM children when a renderer uses an isolated shadow root.
    // Purpose: Preserve the actual PDF.js toolbar, viewer, and live node references.
    if (sourceRoot.shadowRoot) {
      // Reuse the target's shadow root or create one only when it has never existed.
      // Purpose: Keep the viewer isolated from the main workspace styles.
      const destinationShadowRoot = targetRoot.shadowRoot || targetRoot.attachShadow({ mode: 'open' });
      // Collect the source child nodes before moving them into the target shadow root.
      // Purpose: Transfer the existing nodes instead of cloning or recreating them.
      const shadowNodes = Array.from(sourceRoot.shadowRoot.childNodes);
      // Move every shadow node into the target while keeping each node's identity.
      // Purpose: Preserve live viewer controls and PDF.js instances.
      for (const node of shadowNodes) destinationShadowRoot.append(node);
    // Purpose: Close the source-shadow-root condition.
    }
    // Collect ordinary light-DOM children that may belong to other document adapters.
    // Purpose: Support future renderers that mount outside Shadow DOM.
    const lightNodes = Array.from(sourceRoot.childNodes);
    // Move each ordinary child instead of destroying and recreating it.
    // Purpose: Preserve mounted DOM nodes for non-Shadow-DOM document types.
    for (const node of lightNodes) targetRoot.append(node);
    // Keep the target's filename attribute aligned with the document now hosted there.
    // Purpose: Update dock labels and document metadata for the new side.
    if (sourceFileName) targetRoot.dataset.fileName = sourceFileName;
    // Remove stale target filename metadata when the source had no saved name.
    // Purpose: Avoid showing an unrelated document name in the target dock label.
    else targetRoot.removeAttribute('data-file-name');
    // Apply the PDF host class only if the moved content came from a PDF host.
    // Purpose: Keep viewer-specific host presentation attached to the moved document.
    targetRoot.classList.toggle('lux-pdf-editor-root', sourceHasPdfClass);
    // Transfer the visible PDF error class only when it belonged to the source.
    // Purpose: Keep PDF error styling aligned with the moved document.
    targetRoot.classList.toggle('lux-pdf-render-error', sourceHasPdfErrorClass);
    // Remove the source filename so an emptied hidden host is no longer mislabeled.
    // Purpose: Keep the old viewport ready for a future file assignment.
    sourceRoot.removeAttribute('data-file-name');
    // Remove PDF-specific state from the now-empty source host.
    // Purpose: Keep viewer CSS classes on the host that owns the content.
    sourceRoot.classList.remove('lux-pdf-editor-root');
    // Remove the source error state after its content moves to the target.
    // Purpose: Prevent the empty host from retaining an old rendering error.
    sourceRoot.classList.remove('lux-pdf-render-error');
    // Tell the PDF adapter to move its internal lifecycle record to the new viewport key.
    // Purpose: Keep later Close or Replace operations able to dispose the same live viewer.
    EventBus.publish('VIEWPORT_CONTENTS_MOVED', { sourceSide: sourceSide, targetSide: targetSide, sourceRoot: sourceRoot, targetRoot: targetRoot });
    // Remove the source dock entry after its document has moved successfully.
    // Purpose: Update shared restore state to match the new content location.
    Store.removeMinimizedViewport(sourceSide);
    // Remove any stale minimized record for the destination side as well.
    // Purpose: Keep one restore tile per actual minimized viewport.
    Store.removeMinimizedViewport(targetSide);
    // Clear drag state after the transfer has finished.
    // Purpose: Finish the native drag-and-drop state transition.
    Store.setViewportDrag(null);
    // Clear a replacement request if the move came from the confirmation dialog.
    // Purpose: Keep pending replacement state empty after success.
    Store.setPendingViewportReplacement(null);
    // Record the drop time so a follow-up click does not restore the source tile.
    // Purpose: Avoid running Restore after an already-completed move.
    this.lastViewportDropAt = Date.now();
    // Refresh visibility after state changes and content transfer have completed.
    // Purpose: Render the correct active layout and restore dock.
    this.renderViewportComposition();
    // Report that the requested viewport move completed.
    // Purpose: Let callers distinguish a completed move from a rejected operation.
    return true;
  // Purpose: Close the move operation.
  }

  // Activate Full Screen or Split Screen when a file event names a target.
  // Purpose: Continue the viewport window operation.
  activateViewportForTarget(side) {
    // Purpose: Check this condition before changing viewport state.
    if (side === 'full') this.setViewportMode('full');
    // Purpose: Handle the alternate viewport state.
    else if (side === 'left' || side === 'right') this.setViewportMode('split');
  // Purpose: Close the current block, callback, or expression.
  }

  // Find the fixed document host associated with a viewport side.
  // Purpose: Continue the viewport window operation.
  getViewportElement(side) {
    // Purpose: Check this condition before changing viewport state.
    if (side === 'full') return this.fullScreenViewportLayout?.querySelector(':scope > [data-viewport-side="full"]') || null;
    // Purpose: Check this condition before changing viewport state.
    if (side === 'left' || side === 'right') return this.splitScreenViewportLayout?.querySelector(':scope > [data-viewport-side="' + side + '"]') || null;
    // Purpose: Return a result or stop this operation.
    return null;
  // Purpose: Close the current block, callback, or expression.
  }

  // Detect rendered document or tool content so layout changes can preserve it.
  // Purpose: Continue the viewport window operation.
  hasViewportContent(side) {
    // Purpose: Store a value needed by the next operation.
    const root = this.getViewportElement(side);
    // Purpose: Return a result or stop this operation.
    return Boolean(root && (root.dataset.fileName || root.childElementCount > 0 || (root.shadowRoot && root.shadowRoot.childElementCount > 0)));
  // Purpose: Close the current block, callback, or expression.
  }

  // Find a filename or accessible fallback label for a minimized window.
  // Purpose: Continue the viewport window operation.
  getViewportFileName(side) {
    // Purpose: Store a value needed by the next operation.
    const root = this.getViewportElement(side);
    // Purpose: Return a result or stop this operation.
    return root?.dataset.fileName?.trim() || root?.getAttribute('aria-label')?.trim() || 'Untitled';
  // Purpose: Close the current block, callback, or expression.
  }

  // Keep enough information to restore a minimized Full, Left, or Right window.
  // Purpose: Continue the viewport window operation.
  rememberMinimizedViewport(side, originalMode) {
    // Purpose: Store a value needed by the next operation.
    const root = this.getViewportElement(side);
    // Purpose: Check this condition before changing viewport state.
    if (!root) return;
    // Record the layout needed to restore this viewport, including its visible filename.
    // Purpose: Update the shared minimized-window list in Store.
    Store.setMinimizedViewport({ side: side, originalMode: originalMode, splitRatio: this.rememberedSplitRatio, fileName: this.getViewportFileName(side) });
  // Purpose: Close the current block, callback, or expression.
  }

  // Render restore buttons for all minimized windows using the existing dock markup and CSS.
  // Purpose: Continue the viewport window operation.
  renderMinimizedViewportDock() {
    // Purpose: Check this condition before changing viewport state.
    if (!this.viewportMinimizedDock || !this.viewportMinimizedItems) return;
    // Find the minimized sides in the same stable order used by the restore dock.
    // Purpose: Prepare the list of buttons that should be visible.
    const desiredSides = ['full', 'left', 'right'].filter((side) => this.minimizedViewportStates.has(side));
    // Read the currently mounted buttons before deciding whether a rebuild is necessary.
    // Purpose: Preserve the dragged button node while unrelated state changes render.
    const existingButtons = Array.from(this.viewportMinimizedItems.querySelectorAll('[data-minimized-viewport]'));
    // Compare the existing button side order with the Store's minimized side order.
    // Purpose: Detect whether the restore dock structure has changed.
    const sameSides = existingButtons.length === desiredSides.length && existingButtons.every((button, index) => button.dataset.minimizedViewport === desiredSides[index]);
    // Check whether visible labels still match the document name in their viewport.
    // Purpose: Refresh button nodes only when their displayed label must change.
    const sameLabels = sameSides && desiredSides.every((side, index) => existingButtons[index].querySelector('.viewport-minimized-file')?.textContent === this.getViewportFileName(side));
    // Keep the existing buttons when they still represent the same minimized windows.
    // Purpose: Prevent dragstart state updates from detaching the active drag source.
    if (sameSides && sameLabels) {
      // Keep the dock visible only while at least one minimized window exists.
      // Purpose: Synchronize dock visibility with shared state.
      this.viewportMinimizedDock.hidden = desiredSides.length === 0;
      // Stop here because none of the restore button nodes need rebuilding.
      // Purpose: Preserve the current dock DOM and any in-progress drag.
      return;
    // Purpose: Close the current conditional block.
    }
    // Clear outdated restore buttons before creating the current set.
    // Purpose: Rebuild the dock only when its contents have actually changed.
    this.viewportMinimizedItems.replaceChildren();
    // Purpose: Repeat this step for each viewport side.
    for (const side of ['full', 'left', 'right']) {
      // Purpose: Store a value needed by the next operation.
      const saved = this.minimizedViewportStates.get(side);
      // Purpose: Check this condition before changing viewport state.
      if (!saved) continue;
      // Purpose: Store a value needed by the next operation.
      const number = side === 'left' ? '1/2' : side === 'right' ? '2/2' : '0';
      // Purpose: Store a value needed by the next operation.
      const name = this.getViewportFileName(side);
      // Purpose: Store a value needed by the next operation.
      const button = document.createElement('button');
      // Purpose: Set up an accessible viewport restore control.
      button.className = 'viewport-minimized-bar';
      // Enable native HTML5 drag-and-drop for this minimized restore control.
      // Purpose: Let a minimized window be dragged onto a visible Left or Right viewport.
      button.draggable = true;
      // Purpose: Set up an accessible viewport restore control.
      button.type = 'button';
      // Purpose: Set up an accessible viewport restore control.
      button.dataset.minimizedViewport = side;
      // Purpose: Set up an accessible viewport restore control.
      button.setAttribute('aria-label', 'Restore viewport ' + number + ', ' + name);
      // Purpose: Set up an accessible viewport restore control.
      button.title = 'Restore viewport ' + number + ', ' + name;
      // Purpose: Store a value needed by the next operation.
      const numberLabel = document.createElement('span');
      // Purpose: Set up an accessible viewport restore control.
      numberLabel.className = 'viewport-minimized-number';
      // Purpose: Set up an accessible viewport restore control.
      numberLabel.textContent = number;
      // Purpose: Store a value needed by the next operation.
      const fileLabel = document.createElement('span');
      // Purpose: Set up an accessible viewport restore control.
      fileLabel.className = 'viewport-minimized-file';
      // Purpose: Set up an accessible viewport restore control.
      fileLabel.textContent = name;
      // Purpose: Store a value needed by the next operation.
      const restoreMark = document.createElement('span');
      // Purpose: Set up an accessible viewport restore control.
      restoreMark.className = 'viewport-minimized-restore';
      // Purpose: Set up an accessible viewport restore control.
      restoreMark.setAttribute('aria-hidden', 'true');
      // Purpose: Set up an accessible viewport restore control.
      restoreMark.textContent = '↗';
      // Purpose: Set up an accessible viewport restore control.
      button.append(numberLabel, fileLabel, restoreMark);
      // Restore on click unless the same physical action just completed a drag-and-drop.
      // Purpose: Avoid accidentally restoring a window after moving it with the mouse.
      button.addEventListener('click', () => {
        // Ignore the synthetic or follow-up click that can occur after a completed drop.
        // Purpose: Keep one drag gesture from triggering two different viewport actions.
        if (Date.now() - this.lastViewportDropAt < 800) return;
        // Restore the minimized window after an ordinary click.
        // Purpose: Return the selected viewport to the visible layout.
        this.restoreMinimizedViewport(side);
      // Purpose: Close the click handler.
      });
      // Start tracking the source window when the user begins dragging this restore tile.
      // Purpose: Register a native dragstart handler.
      button.addEventListener('dragstart', (event) => this.handleDockDragStart(event, side));
      // Clear drag state and highlighting when the drag ends.
      // Purpose: Register a native dragend handler.
      button.addEventListener('dragend', (event) => this.handleDockDragEnd(event, side));
      // Purpose: Run the next viewport operation.
      this.viewportMinimizedItems.append(button);
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Update the viewport controller state.
    this.viewportMinimizedDock.hidden = this.minimizedViewportStates.size === 0;
  // Purpose: Close the current block, callback, or expression.
  }

  // Render the active layout, toolbar visibility, labels, restore dock, and welcome state.
  // Purpose: Continue the viewport window operation.
  renderViewportComposition() {
    // Purpose: Check this condition before changing viewport state.
    if (!this.viewportComposition || !this.fullScreenViewportLayout || !this.splitScreenViewportLayout) return;
    // Purpose: Store a value needed by the next operation.
    const full = this.activeViewportMode === 'full';
    // Purpose: Store a value needed by the next operation.
    const split = this.activeViewportMode === 'split';
    // Purpose: Store a value needed by the next operation.
    const solo = this.activeViewportMode === 'solo';
    // Purpose: Store a value needed by the next operation.
    const active = this.activeViewportMode !== null;
    // Purpose: Store a value needed by the next operation.
    const minimized = this.minimizedViewportStates.size > 0;
    // Purpose: Update the viewport controller state.
    this.viewportComposition.dataset.mode = solo ? 'solo-' + this.soloSplitSide : (this.activeViewportMode || 'minimized');
    // Purpose: Update the viewport controller state.
    this.viewportComposition.hidden = !active && !minimized;
    // Purpose: Run the next viewport operation.
    this.viewportComposition.classList.toggle('is-minimized-only', !active && minimized);
    // Purpose: Update the viewport controller state.
    this.fullScreenViewportLayout.hidden = !full;
    // Purpose: Update the viewport controller state.
    this.splitScreenViewportLayout.hidden = !(split || solo);
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportTopbar) this.viewportTopbar.hidden = !active;
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportToolbarFull) this.viewportToolbarFull.hidden = !(full || solo);
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportToolbarLeft) this.viewportToolbarLeft.hidden = !split;
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportToolbarRight) this.viewportToolbarRight.hidden = !split;
    // Purpose: Check this condition before changing viewport state.
    if (this.splitDivider) this.splitDivider.hidden = !split;
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportNumberFull) this.viewportNumberFull.hidden = !full;
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportNumberLeft) this.viewportNumberLeft.hidden = !(split || (solo && this.soloSplitSide === 'left'));
    // Purpose: Check this condition before changing viewport state.
    if (this.viewportNumberRight) this.viewportNumberRight.hidden = !(split || (solo && this.soloSplitSide === 'right'));
    // Purpose: Run the next viewport operation.
    this.fullScreenButton?.setAttribute('aria-pressed', String(full || solo));
    // Purpose: Run the next viewport operation.
    this.splitScreenButton?.setAttribute('aria-pressed', String(split));
    // Purpose: Store a value needed by the next operation.
    const side = this.soloSplitSide === 'left' ? 'left' : 'right';
    // Purpose: Run the next viewport operation.
    this.viewportMinimizeFullButton?.setAttribute('aria-label', solo ? 'Minimize ' + side + ' viewport' : 'Minimize full-screen viewport');
    // Purpose: Run the next viewport operation.
    this.viewportMinimizeFullButton?.setAttribute('title', solo ? 'Minimize ' + side + ' viewport' : 'Minimize viewport');
    // Purpose: Run the next viewport operation.
    this.viewportCloseFullButton?.setAttribute('aria-label', solo ? 'Close ' + side + ' viewport' : 'Close full-screen viewport');
    // Purpose: Run the next viewport operation.
    this.viewportCloseFullButton?.setAttribute('title', solo ? 'Close ' + side + ' viewport' : 'Close viewport');
    // Purpose: Check this condition before changing viewport state.
    if (this.workspaceEmptyState) this.workspaceEmptyState.hidden = active;
    // Purpose: Run the next viewport operation.
    this.renderMinimizedViewportDock();
  // Purpose: Close the current block, callback, or expression.
  }

  // Publish the active viewport mode through Store so all subscribers stay in sync.
  // Purpose: Continue the viewport window operation.
  publishViewportMode() {
    // Purpose: Store a value needed by the next operation.
    const activeLayout = this.activeViewportMode === 'solo' ? 'solo-' + this.soloSplitSide : this.activeViewportMode;
    // Purpose: Continue the viewport window operation.
    Store.setState({ activeLayout: activeLayout });
  // Purpose: Close the current block, callback, or expression.
  }

  // Switch the visible layout while keeping populated viewports recoverable.
  // Purpose: Continue the viewport window operation.
  setViewportMode(mode) {
    // Purpose: Check this condition before changing viewport state.
    if (!this.viewportComposition || !this.fullScreenViewportLayout || !this.splitScreenViewportLayout) return;
    // Purpose: Store a value needed by the next operation.
    const previous = this.activeViewportMode;
    // Purpose: Store a value needed by the next operation.
    const previousSide = this.soloSplitSide;
    // Purpose: Check this condition before changing viewport state.
    if (mode === 'full') {
      // Purpose: Check this condition before changing viewport state.
      if (previous === 'split') {
        // Purpose: Check this condition before changing viewport state.
        if (this.hasViewportContent('left')) this.rememberMinimizedViewport('left', 'split');
        // Purpose: Check this condition before changing viewport state.
        if (this.hasViewportContent('right')) this.rememberMinimizedViewport('right', 'split');
      // Purpose: Continue the viewport window operation.
      } else if (previous === 'solo' && previousSide && this.hasViewportContent(previousSide)) {
        // Purpose: Run the next viewport operation.
        this.rememberMinimizedViewport(previousSide, 'split');
      // Purpose: Close the current block, callback, or expression.
      }
      // Remove Full Screen from the shared minimized-window list.
      // Purpose: Update the shared viewport state.
      Store.removeMinimizedViewport('full');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'full';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Continue the viewport window operation.
    } else if (mode === 'split') {
      // Purpose: Check this condition before changing viewport state.
      if (previous === 'full' && this.hasViewportContent('full')) this.rememberMinimizedViewport('full', 'full');
      // Remove Left from the shared minimized-window list.
      // Purpose: Update the shared viewport state.
      Store.removeMinimizedViewport('left');
      // Remove Right from the shared minimized-window list.
      // Purpose: Update the shared viewport state.
      Store.removeMinimizedViewport('right');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'split';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Continue the viewport window operation.
    } else {
      // Purpose: Return a result or stop this operation.
      return;
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Minimize Full Screen or the active solo pane into the restore dock.
  // Purpose: Continue the viewport window operation.
  minimizeFullScreenViewport() {
    // Purpose: Check this condition before changing viewport state.
    if (this.activeViewportMode === 'solo' && this.soloSplitSide) {
      // Purpose: Run the next viewport operation.
      this.minimizeSplitViewport(this.soloSplitSide);
      // Purpose: Return a result or stop this operation.
      return;
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Check this condition before changing viewport state.
    if (this.activeViewportMode !== 'full') return;
    // Purpose: Run the next viewport operation.
    this.rememberMinimizedViewport('full', 'full');
    // Purpose: Update the viewport controller state.
    this.activeViewportMode = null;
    // Purpose: Update the viewport controller state.
    this.soloSplitSide = null;
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Minimize one split pane while keeping the other pane visible.
  // Purpose: Continue the viewport window operation.
  minimizeSplitViewport(side) {
    // Purpose: Check this condition before changing viewport state.
    if (this.activeViewportMode === 'split') {
      // Purpose: Update the viewport controller state.
      this.rememberedSplitRatio = Number(this.splitDivider?.getAttribute('aria-valuenow') || '50') / 100;
      // Purpose: Run the next viewport operation.
      this.rememberMinimizedViewport(side, 'split');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'solo';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = side === 'left' ? 'right' : 'left';
    // Purpose: Continue the viewport window operation.
    } else if (this.activeViewportMode === 'solo' && this.soloSplitSide === side) {
      // Purpose: Run the next viewport operation.
      this.rememberMinimizedViewport(side, 'split');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = null;
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Continue the viewport window operation.
    } else {
      // Purpose: Return a result or stop this operation.
      return;
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Restore a minimized viewport or reunite the two split panes.
  // Purpose: Continue the viewport window operation.
  restoreMinimizedViewport(side) {
    // Purpose: Store a value needed by the next operation.
    const saved = this.minimizedViewportStates.get(side);
    // Purpose: Check this condition before changing viewport state.
    if (!saved) return;
    // Purpose: Check this condition before changing viewport state.
    if (side === 'full' || saved.originalMode === 'full') {
      // Purpose: Check this condition before changing viewport state.
      if (this.activeViewportMode === 'solo' && this.soloSplitSide && this.hasViewportContent(this.soloSplitSide)) {
        // Purpose: Run the next viewport operation.
        this.rememberMinimizedViewport(this.soloSplitSide, 'split');
      // Purpose: Continue the viewport window operation.
      } else if (this.activeViewportMode === 'split') {
        // Purpose: Check this condition before changing viewport state.
        if (this.hasViewportContent('left')) this.rememberMinimizedViewport('left', 'split');
        // Purpose: Check this condition before changing viewport state.
        if (this.hasViewportContent('right')) this.rememberMinimizedViewport('right', 'split');
      // Purpose: Close the current block, callback, or expression.
      }
      // Remove Full Screen from the shared minimized-window list.
      // Purpose: Update the shared viewport state.
      Store.removeMinimizedViewport('full');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'full';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Continue the viewport window operation.
    } else {
      // Purpose: Store a value needed by the next operation.
      const otherSide = side === 'left' ? 'right' : 'left';
      // Purpose: Store a value needed by the next operation.
      const restorePair = this.activeViewportMode === 'solo' && this.soloSplitSide === otherSide && this.minimizedViewportStates.has(side);
      // Purpose: Check this condition before changing viewport state.
      if (restorePair) {
        // Remove Left from the shared minimized-window list.
        // Purpose: Update the shared viewport state.
        Store.removeMinimizedViewport('left');
        // Remove Right from the shared minimized-window list.
        // Purpose: Update the shared viewport state.
        Store.removeMinimizedViewport('right');
        // Purpose: Update the viewport controller state.
        this.activeViewportMode = 'split';
        // Purpose: Update the viewport controller state.
        this.soloSplitSide = null;
      // Purpose: Continue the viewport window operation.
      } else {
        // Purpose: Check this condition before changing viewport state.
        if (this.activeViewportMode === 'full' && this.hasViewportContent('full')) this.rememberMinimizedViewport('full', 'full');
        // Purpose: Handle the alternate viewport state.
        else if (this.activeViewportMode === 'solo' && this.soloSplitSide && this.hasViewportContent(this.soloSplitSide)) this.rememberMinimizedViewport(this.soloSplitSide, 'split');
        // Remove the selected side from the shared minimized-window list.
        // Purpose: Update the shared viewport state.
        Store.removeMinimizedViewport(side);
        // Purpose: Update the viewport controller state.
        this.activeViewportMode = 'solo';
        // Purpose: Update the viewport controller state.
        this.soloSplitSide = side;
      // Purpose: Close the current block, callback, or expression.
      }
      // Purpose: Run the next viewport operation.
      this.setSplitViewportRatio(saved.splitRatio || this.rememberedSplitRatio);
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Send a close event to renderers, then clear this viewport's content and metadata.
  // Purpose: Continue the viewport window operation.
  clearViewportContents(side) {
    // Purpose: Notify other modules through the shared event system.
    EventBus.publish('VIEWPORT_CLOSE_REQUESTED', { viewportType: side });
    // Purpose: Store a value needed by the next operation.
    const root = this.getViewportElement(side);
    // Purpose: Check this condition before changing viewport state.
    if (!root) return;
    // Purpose: Check this condition before changing viewport state.
    if (root.shadowRoot) root.shadowRoot.replaceChildren();
    // Purpose: Continue the viewport window operation.
    root.replaceChildren();
    // Purpose: Continue the viewport window operation.
    root.removeAttribute('data-file-name');
    // Purpose: Continue the viewport window operation.
    root.classList.remove('lux-pdf-editor-root');
    // Purpose: Continue the viewport window operation.
    root.classList.remove('lux-pdf-render-error');
  // Purpose: Close the current block, callback, or expression.
  }

  // Close Full Screen or the visible solo split pane after confirmation.
  // Purpose: Continue the viewport window operation.
  closeFullScreenViewport() {
    // Purpose: Check this condition before changing viewport state.
    if (this.activeViewportMode === 'solo' && this.soloSplitSide) {
      // Purpose: Run the next viewport operation.
      this.closeSplitViewport(this.soloSplitSide);
      // Purpose: Return a result or stop this operation.
      return;
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Check this condition before changing viewport state.
    if (this.activeViewportMode !== 'full' || !window.confirm('Discard documents?')) return;
    // Purpose: Run the next viewport operation.
    this.clearViewportContents('full');
    // Remove Full Screen from the shared minimized-window list.
    // Purpose: Update the shared viewport state.
    Store.removeMinimizedViewport('full');
    // Purpose: Update the viewport controller state.
    this.activeViewportMode = null;
    // Purpose: Update the viewport controller state.
    this.soloSplitSide = null;
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Close a visible split pane and retain its partner when one is open.
  // Purpose: Continue the viewport window operation.
  closeSplitViewport(side) {
    // Purpose: Store a value needed by the next operation.
    const paired = this.activeViewportMode === 'split';
    // Purpose: Store a value needed by the next operation.
    const solo = this.activeViewportMode === 'solo' && this.soloSplitSide === side;
    // Purpose: Check this condition before changing viewport state.
    if ((!paired && !solo) || !window.confirm('Discard documents?')) return;
    // Purpose: Run the next viewport operation.
    this.clearViewportContents(side);
    // Remove the selected side from the shared minimized-window list.
    // Purpose: Update the shared viewport state.
    Store.removeMinimizedViewport(side);
    // Purpose: Check this condition before changing viewport state.
    if (paired) {
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'solo';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = side === 'left' ? 'right' : 'left';
    // Purpose: Continue the viewport window operation.
    } else {
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = null;
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Run the next viewport operation.
    this.publishViewportMode();
  // Purpose: Close the current block, callback, or expression.
  }

  // Clamp a split ratio and apply its stylesheet class.
  // Purpose: Continue the viewport window operation.
  setSplitViewportRatio(ratio) {
    // Purpose: Store a value needed by the next operation.
    const bounded = Math.max(0.2, Math.min(0.8, ratio));
    // Purpose: Update the viewport controller state.
    this.rememberedSplitRatio = bounded;
    // Purpose: Run the next viewport operation.
    this.applySplitRatioClass(bounded);
    // Purpose: Check this condition before changing viewport state.
    if (this.splitDivider) this.splitDivider.setAttribute('aria-valuenow', String(Math.round(bounded * 100)));
  // Purpose: Close the current block, callback, or expression.
  }

  // Select a predefined external CSS class for the split ratio.
  // Purpose: Continue the viewport window operation.
  applySplitRatioClass(ratio) {
    // Purpose: Check this condition before changing viewport state.
    if (!this.viewportComposition) return;
    // Purpose: Store a value needed by the next operation.
    const percentage = Math.round(ratio * 100);
    // Purpose: Repeat this step for each viewport side.
    for (let candidate = 20; candidate <= 80; candidate += 1) {
      // Purpose: Run the next viewport operation.
      this.viewportComposition.classList.remove('split-ratio-' + candidate);
    // Purpose: Close the current block, callback, or expression.
    }
    // Purpose: Run the next viewport operation.
    this.viewportComposition.classList.add('split-ratio-' + percentage);
  // Purpose: Close the current block, callback, or expression.
  }

  // Apply a state snapshot after startup or a shared state update.
  // Purpose: Run this statement as the next step in the surrounding operation.
  handleStateChange({ state } = {}) {
    // Stop if an unexpected event does not include a state object.
    // Purpose: Check this condition before choosing which branch should run.
    if (!state || typeof state !== 'object') return;

    // Find out whether dark appearance is currently active.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isDarkTheme = state.theme === 'dark';
    // Add the root theme attribute when the dark theme is selected.
    // Purpose: Check this condition before choosing which branch should run.
    if (isDarkTheme) {
      // Let the stylesheet respond to the shared theme setting.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      document.documentElement.setAttribute('data-theme', 'dark');
    // Purpose: Close the current block, handler, object, or expression.
    } else {
      // Return to the default appearance when dark theme is not selected.
      // Purpose: Run this statement as the next step in the surrounding operation.
      document.documentElement.removeAttribute('data-theme');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Update the theme button only when it exists on this page.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.themeToggle) {
      // Describe the theme that clicking the button will activate next.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.themeToggle.setAttribute(
        // Purpose: Run this statement as the next step in the surrounding operation.
        'aria-label',
        // Purpose: Run this statement as the next step in the surrounding operation.
        isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
      // Purpose: Close the current call or grouped expression.
      );
      // Expose a simple icon name for any CSS icon treatment.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.themeToggle.dataset.icon = isDarkTheme ? 'sun' : 'moon';
      // Look for an optional icon element provided by the page markup.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const themeIcon = this.themeToggle.querySelector('[data-theme-icon]');
      // Update the icon only when that optional element is present.
      // Purpose: Check this condition before choosing which branch should run.
      if (themeIcon) {
        // Show a sun for the next light-theme action or a moon for dark.
        // Purpose: Set visible text without interpreting the supplied value as HTML.
        themeIcon.textContent = isDarkTheme ? '☀️' : '🌙';
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Read whether focus mode should currently be enabled.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isFocusMode = state.focusMode === true;
    // Add the body attribute while focus mode is enabled.
    // Purpose: Check this condition before choosing which branch should run.
    if (isFocusMode) {
      // Let CSS adjust the workspace based on the focus-mode attribute.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      document.body.setAttribute('data-focus-mode', 'true');
    // Purpose: Close the current block, handler, object, or expression.
    } else {
      // Remove the attribute to restore the regular workspace layout.
      // Purpose: Run this statement as the next step in the surrounding operation.
      document.body.removeAttribute('data-focus-mode');
      // Clear any earlier reveal so normal browsing starts with no Focus Mode class.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.topbar?.classList.remove('is-visible');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Update the focus button only when it is present in the document.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.focusModeToggle) {
      // Tell assistive technology whether focus mode is active.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.focusModeToggle.setAttribute('aria-pressed', String(isFocusMode));
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Treat only true as the open state, keeping closed as a safe fallback.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isSidebarOpen = state.sidebarOpen === true;
    // Let the stylesheet apply its existing open and closed sidebar rules.
    // Purpose: Update an HTML attribute or data field to reflect the current state.
    document.documentElement.setAttribute('data-sidebar-open', String(isSidebarOpen));
    // Keep the sidebar button's accessible state in sync with the Store.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.sidebarToggle) {
      // Expose the current open or closed state to assistive technology.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.sidebarToggle.setAttribute('aria-expanded', String(isSidebarOpen));
      // Describe the action the button will take next.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.sidebarToggle.setAttribute('aria-label', isSidebarOpen ? 'Close sidebar' : 'Open sidebar');
      // Keep the tooltip consistent with the accessible name.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.sidebarToggle.setAttribute('title', isSidebarOpen ? 'Close sidebar' : 'Open sidebar');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Read the Store value; null means no viewport window is active.
    // Purpose: Store the current layout for the renderer.
    const selectedLayout = state.activeLayout;
    // Keep Full Screen and paired Split Screen modes.
    // Purpose: Check this condition before choosing the viewport mode.
    if (selectedLayout === 'full' || selectedLayout === 'split') {
      // Record the active layout.
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = selectedLayout;
      // Clear any previous solo-pane selection.
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Close the current block or expression.
    } else if (selectedLayout === 'solo-left' || selectedLayout === 'solo-right') {
      // Record the one-pane Split Screen mode.
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'solo';
      // Extract the side from the saved layout value.
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = selectedLayout.slice('solo-'.length);
    // Purpose: Close the current block or expression.
    } else {
      // Treat null or unsupported state as an empty workspace.
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = null;
      // Clear the solo-pane marker because no window is active.
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Close the current block or expression.
    }
    // Apply visibility and restore-dock state from the selected layout.
    // Purpose: Run the viewport renderer.
    this.renderViewportComposition();
    // Apply the current Split ratio through CSS classes, without inline style writes.
    // Purpose: Run the viewport renderer.
    this.setSplitViewportRatio(this.rememberedSplitRatio);
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Export the class by its default name for the startup module.
// Purpose: Run this statement as the next step in the surrounding operation.
export default WorkspaceUI;
