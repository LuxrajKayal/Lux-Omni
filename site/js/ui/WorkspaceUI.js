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
    // Start with no active viewport, matching the legacy state machine.
    // Purpose: Store a value needed by the next operation.
    this.activeViewportMode = null;
    // Remember which pane remains active when its partner is minimized.
    // Purpose: Store a value needed by the next operation.
    this.soloSplitSide = null;
    // Save minimized windows so users can restore them.
    // Purpose: Store a value needed by the next operation.
    this.minimizedViewportStates = new Map();
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
    // Purpose: Run the next viewport operation.
    this.minimizedViewportStates.set(side, { side: side, originalMode: originalMode, splitRatio: this.rememberedSplitRatio });
  // Purpose: Close the current block, callback, or expression.
  }

  // Render restore buttons for all minimized windows using the existing dock markup and CSS.
  // Purpose: Continue the viewport window operation.
  renderMinimizedViewportDock() {
    // Purpose: Check this condition before changing viewport state.
    if (!this.viewportMinimizedDock || !this.viewportMinimizedItems) return;
    // Purpose: Run the next viewport operation.
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
      // Purpose: Set up an accessible viewport restore control.
      button.addEventListener('click', () => this.restoreMinimizedViewport(side));
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
      // Purpose: Run the next viewport operation.
      this.minimizedViewportStates.delete('full');
      // Purpose: Update the viewport controller state.
      this.activeViewportMode = 'full';
      // Purpose: Update the viewport controller state.
      this.soloSplitSide = null;
    // Purpose: Continue the viewport window operation.
    } else if (mode === 'split') {
      // Purpose: Check this condition before changing viewport state.
      if (previous === 'full' && this.hasViewportContent('full')) this.rememberMinimizedViewport('full', 'full');
      // Purpose: Run the next viewport operation.
      this.minimizedViewportStates.delete('left');
      // Purpose: Run the next viewport operation.
      this.minimizedViewportStates.delete('right');
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
      // Purpose: Run the next viewport operation.
      this.minimizedViewportStates.delete('full');
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
        // Purpose: Run the next viewport operation.
        this.minimizedViewportStates.delete('left');
        // Purpose: Run the next viewport operation.
        this.minimizedViewportStates.delete('right');
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
        // Purpose: Run the next viewport operation.
        this.minimizedViewportStates.delete(side);
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
    // Purpose: Run the next viewport operation.
    this.minimizedViewportStates.delete('full');
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
    // Purpose: Run the next viewport operation.
    this.minimizedViewportStates.delete(side);
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
