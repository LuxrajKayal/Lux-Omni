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
    // Find the sidebar whose width follows the current state.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.sidebar = document.querySelector('#sidebar');
    // Find the grid that places the sidebar beside the workspace.
    // Purpose: Find the HTML element or elements used by this part of the interface.
    this.workspaceLayout = document.querySelector('.workspace-layout');

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

    // Remember the split ratio locally, just as the earlier divider did.
    // Purpose: Run this statement as the next step in the surrounding operation.
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

    // Select Full Screen when its layout button is clicked.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.fullScreenButton?.addEventListener('click', () => {
      // Publish the selected layout so the state handler updates the page.
      // Purpose: Run this statement as the next step in the surrounding operation.
      Store.setState({ activeLayout: 'full' });
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Select Split Screen when its layout button is clicked.
    // Purpose: Register a handler so the application reacts when this event occurs.
    this.splitScreenButton?.addEventListener('click', () => {
      // Publish the selected layout so both panes can be shown.
      // Purpose: Run this statement as the next step in the surrounding operation.
      Store.setState({ activeLayout: 'split' });
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Restore the top bar reveal behavior used while Focus Mode is active.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.installFocusModeTopbarListeners();

    // Attach the legacy-compatible pointer and keyboard behavior to the divider.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.installSplitDividerControls();

    // Listen for every shared state update and apply it to the page.
    // Purpose: Subscribe to an event so this module can react to changes.
    EventBus.subscribe('STATE_CHANGED', this.handleStateChange.bind(this));

    // Apply the current state once so the page is correct at startup.
    // Purpose: Run this statement as the next step in the surrounding operation.
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
      // Clamp the ratio to the original minimum and maximum limits.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const boundedRatio = Math.max(0.2, Math.min(0.8, ratio));
      // Remember the ratio locally so switching layouts preserves it.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.rememberedSplitRatio = boundedRatio;
      // Tell CSS how much space each side of the divider should receive.
      // Purpose: Run this statement as the next step in the surrounding operation.
      composition.style.setProperty('--split-left-share', boundedRatio + 'fr');
      // Give the right pane the remaining share of the layout.
      // Purpose: Run this statement as the next step in the surrounding operation.
      composition.style.setProperty('--split-right-share', (1 - boundedRatio) + 'fr');
      // Keep assistive technology informed of the divider's current value.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      divider.setAttribute('aria-valuenow', String(Math.round(boundedRatio * 100)));
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
    // Also set the sidebar width directly so the state is visible without CSS rules.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.sidebar) {
      // Use the original 68-pixel sidebar width when it is open.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.sidebar.style.width = isSidebarOpen ? '68px' : '0px';
      // Permit the sidebar to collapse fully when it is closed.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.sidebar.style.minWidth = isSidebarOpen ? '68px' : '0px';
      // Clip inner content when the sidebar is closed.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.sidebar.style.overflow = 'hidden';
      // Remove the border when closed so no thin line remains visible.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.sidebar.style.borderRightColor = isSidebarOpen ? '' : 'transparent';
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Match the grid columns to the selected sidebar width.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.workspaceLayout) {
      // Keep the main workspace flexible beside the sidebar.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.workspaceLayout.style.gridTemplateColumns = isSidebarOpen
        // Purpose: Run this statement as the next step in the surrounding operation.
        ? '68px minmax(0, 1fr)'
        // Purpose: Run this statement as the next step in the surrounding operation.
        : '0px minmax(0, 1fr)';
    // Purpose: Close the current block, handler, object, or expression.
    }
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

    // Use Split Screen only for the exact split state; otherwise show Full Screen.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isSplitLayout = state.activeLayout === 'split';
    // Treat the other supported layout state as Full Screen.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const isFullLayout = !isSplitLayout;
    // Unhide the composition so the selected layout can actually be seen.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.viewportComposition) {
      // Let the selected layout occupy the viewport composition area.
      // Purpose: Show or hide this interface element using its hidden state.
      this.viewportComposition.hidden = false;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Show the Full Screen container only when that layout is selected.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.fullScreenViewportLayout) {
      // The hidden property keeps the inactive layout out of view and tab order.
      // Purpose: Show or hide this interface element using its hidden state.
      this.fullScreenViewportLayout.hidden = !isFullLayout;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Show the Split Screen container only when that layout is selected.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.splitScreenViewportLayout) {
      // The inactive layout should not occupy space or receive keyboard focus.
      // Purpose: Show or hide this interface element using its hidden state.
      this.splitScreenViewportLayout.hidden = !isSplitLayout;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Show the divider only when there are two panes to resize.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.splitDivider) {
      // A hidden divider cannot be focused or dragged in Full Screen mode.
      // Purpose: Show or hide this interface element using its hidden state.
      this.splitDivider.hidden = !isSplitLayout;
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Keep the Full Screen button's pressed state aligned with the selected layout.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.fullScreenButton) {
      // Expose whether Full Screen is the active choice to assistive technology.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.fullScreenButton.setAttribute('aria-pressed', String(isFullLayout));
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Keep the Split Screen button's pressed state aligned with the selected layout.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.splitScreenButton) {
      // Expose whether Split Screen is the active choice to assistive technology.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.splitScreenButton.setAttribute('aria-pressed', String(isSplitLayout));
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Reapply the saved local divider ratio when Split Screen becomes active.
    // Purpose: Check this condition before choosing which branch should run.
    if (isSplitLayout && this.viewportComposition && this.splitDivider) {
      // Keep the two panes at the most recently selected ratio.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.viewportComposition.style.setProperty('--split-left-share', this.rememberedSplitRatio + 'fr');
      // Keep the right pane at the matching remaining ratio.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.viewportComposition.style.setProperty('--split-right-share', (1 - this.rememberedSplitRatio) + 'fr');
      // Synchronize the accessible percentage with the restored ratio.
      // Purpose: Update an HTML attribute or data field to reflect the current state.
      this.splitDivider.setAttribute('aria-valuenow', String(Math.round(this.rememberedSplitRatio * 100)));
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Export the class by its default name for the startup module.
// Purpose: Run this statement as the next step in the surrounding operation.
export default WorkspaceUI;
