// Import the shared Store so controls request changes through application state.
import Store from '../core/Store.js';
// Import the shared EventBus so this class can react to state updates.
import EventBus from '../core/EventBus.js';

// Connect workspace controls to the shared state and the page's DOM.
export class WorkspaceUI {
  // Find the controls and attach their event listeners.
  constructor() {
    // Keep the existing theme control available to this class.
    this.themeToggle = document.querySelector('#theme-toggle');
    // Keep the existing focus-mode control available to this class.
    this.focusModeToggle = document.querySelector('#focus-mode-toggle');

    // Find the button that opens or closes the sidebar.
    this.sidebarToggle = document.querySelector('#sidebar-toggle');
    // Find the sidebar whose width follows the current state.
    this.sidebar = document.querySelector('#sidebar');
    // Find the grid that places the sidebar beside the workspace.
    this.workspaceLayout = document.querySelector('.workspace-layout');

    // Find the button that selects the Full Screen layout.
    this.fullScreenButton = document.querySelector('#viewport-fullscreen');
    // Find the button that selects the Split Screen layout.
    this.splitScreenButton = document.querySelector('#viewport-split-screen');
    // Find the parent that contains both viewport layouts.
    this.viewportComposition = document.querySelector('#viewport-composition');
    // Find the single-viewport layout from the page markup.
    this.fullScreenViewportLayout = document.querySelector('#viewport-fullscreen-layout');
    // Find the two-pane layout from the page markup.
    this.splitScreenViewportLayout = document.querySelector('#viewport-split-layout');
    // Find the divider that adjusts the two pane widths.
    this.splitDivider = document.querySelector('#viewport-split-divider');

    // Remember the split ratio locally, just as the earlier divider did.
    this.rememberedSplitRatio = 0.5;

    // Listen for theme clicks only when the theme button exists.
    this.themeToggle?.addEventListener('click', () => {
      // Read the latest state so rapid clicks do not use a stale value.
      const currentState = Store.getState();
      // Choose the opposite theme from the one that is currently active.
      const newTheme = currentState.theme === 'dark' ? 'light' : 'dark';
      // Ask the Store to publish the theme update.
      Store.setState({ theme: newTheme });
    });

    // Listen for focus-mode clicks only when the focus button exists.
    this.focusModeToggle?.addEventListener('click', () => {
      // Read the latest focus setting from the shared state.
      const currentState = Store.getState();
      // Invert the current value to switch focus mode on or off.
      const newFocusMode = !currentState.focusMode;
      // Ask the Store to publish the focus-mode update.
      Store.setState({ focusMode: newFocusMode });
    });

    // Toggle the sidebar by requesting the inverse of its current state.
    this.sidebarToggle?.addEventListener('click', () => {
      // Let the Store remain the single source of truth for the sidebar.
      Store.setState({ sidebarOpen: !Store.getState().sidebarOpen });
    });

    // Select Full Screen when its layout button is clicked.
    this.fullScreenButton?.addEventListener('click', () => {
      // Publish the selected layout so the state handler updates the page.
      Store.setState({ activeLayout: 'full' });
    });

    // Select Split Screen when its layout button is clicked.
    this.splitScreenButton?.addEventListener('click', () => {
      // Publish the selected layout so both panes can be shown.
      Store.setState({ activeLayout: 'split' });
    });

    // Attach the legacy-compatible pointer and keyboard behavior to the divider.
    this.installSplitDividerControls();

    // Listen for every shared state update and apply it to the page.
    EventBus.subscribe('STATE_CHANGED', this.handleStateChange.bind(this));

    // Apply the current state once so the page is correct at startup.
    this.handleStateChange({ state: Store.getState() });
  }

  // Add the same resize math and key controls used by the original workspace.
  installSplitDividerControls() {
    // Keep references short and clear inside the event handlers.
    const divider = this.splitDivider;
    // The composition box is the area used to calculate the divider position.
    const composition = this.viewportComposition;
    // Both elements are required before resizing can work.
    if (!divider || !this.splitScreenViewportLayout || !composition) return;

    // Apply a ratio while keeping the left pane between 20% and 80%.
    const setSplitViewportRatio = (ratio) => {
      // Clamp the ratio to the original minimum and maximum limits.
      const boundedRatio = Math.max(0.2, Math.min(0.8, ratio));
      // Remember the ratio locally so switching layouts preserves it.
      this.rememberedSplitRatio = boundedRatio;
      // Tell CSS how much space each side of the divider should receive.
      composition.style.setProperty('--split-left-share', boundedRatio + 'fr');
      // Give the right pane the remaining share of the layout.
      composition.style.setProperty('--split-right-share', (1 - boundedRatio) + 'fr');
      // Keep assistive technology informed of the divider's current value.
      divider.setAttribute('aria-valuenow', String(Math.round(boundedRatio * 100)));
    };

    // Track the active pointer only while the user is dragging the divider.
    let activePointerId = null;

    // Convert the pointer's horizontal position into a bounded split ratio.
    const updateSplitRatioFromPointer = (event) => {
      // Ignore movement from a pointer that did not start this drag.
      if (event.pointerId !== activePointerId) return;

      // Measure the whole viewport composition, as the original code did.
      const layoutBounds = composition.getBoundingClientRect();
      // Measure the divider so its half-width is removed from the pointer offset.
      const dividerWidth = divider.getBoundingClientRect().width;
      // Exclude the divider itself from the width available to the two panes.
      const usableWidth = layoutBounds.width - dividerWidth;
      // Avoid division by zero when the layout has no usable width.
      if (usableWidth <= 0) return;

      // Find the left pane width using the pointer and half the divider width.
      const leftWidth = event.clientX - layoutBounds.left - dividerWidth / 2;
      // Convert the left pane width into a ratio and apply the 20–80% limits.
      setSplitViewportRatio(leftWidth / usableWidth);
    };

    // End a drag and remove its temporary pointer listeners.
    const stopSplitResize = () => {
      // Do nothing if no pointer is currently being tracked.
      if (activePointerId === null) return;
      // Stop listening for movement after the drag has ended.
      divider.removeEventListener('pointermove', updateSplitRatioFromPointer);
      // Stop listening for the pointer release after the drag has ended.
      divider.removeEventListener('pointerup', stopSplitResize);
      // Stop listening for a cancelled pointer after the drag has ended.
      divider.removeEventListener('pointercancel', stopSplitResize);
      // Release the pointer capture when this element still owns it.
      if (divider.hasPointerCapture(activePointerId)) {
        // Return pointer events to their normal target after this drag.
        divider.releasePointerCapture(activePointerId);
      }
      // Clear the active pointer so the next drag can begin.
      activePointerId = null;
    };

    // Begin a drag only for the primary pointer and the left mouse button.
    divider.addEventListener('pointerdown', (event) => {
      // Ignore secondary pointers and non-left mouse clicks.
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      // Prevent text selection or other browser actions while starting a drag.
      event.preventDefault();

      // Remember which pointer owns the current resize operation.
      activePointerId = event.pointerId;
      // Keep subsequent pointer events directed to the divider while dragging.
      divider.setPointerCapture(activePointerId);
      // Update the pane ratio whenever the active pointer moves.
      divider.addEventListener('pointermove', updateSplitRatioFromPointer);
      // Finish the drag when the pointer is released.
      divider.addEventListener('pointerup', stopSplitResize);
      // Also finish the drag if the browser cancels the pointer.
      divider.addEventListener('pointercancel', stopSplitResize);
    });

    // Support keyboard resizing for users who do not use pointer dragging.
    divider.addEventListener('keydown', (event) => {
      // Read the current percentage, using 50% when no value has been set.
      const currentRatio = Number(divider.getAttribute('aria-valuenow') || '50') / 100;
      // Move two percentage points toward the left pane on ArrowLeft.
      if (event.key === 'ArrowLeft') {
        // Keep the arrow key from scrolling the whole page.
        event.preventDefault();
        // Apply the slightly smaller left pane ratio.
        setSplitViewportRatio(currentRatio - 0.02);
      } else if (event.key === 'ArrowRight') {
        // Keep the arrow key from scrolling the whole page.
        event.preventDefault();
        // Apply the slightly larger left pane ratio.
        setSplitViewportRatio(currentRatio + 0.02);
      } else if (event.key === 'Home') {
        // Keep the Home key from jumping the page to its top.
        event.preventDefault();
        // Put the left pane at its original minimum width of 20%.
        setSplitViewportRatio(0.2);
      } else if (event.key === 'End') {
        // Keep the End key from jumping the page to its bottom.
        event.preventDefault();
        // Put the left pane at its original maximum width of 80%.
        setSplitViewportRatio(0.8);
      }
    });

    // Apply the initial balanced ratio before the user begins resizing.
    setSplitViewportRatio(this.rememberedSplitRatio);
  }

  // Apply a state snapshot after startup or a shared state update.
  handleStateChange({ state } = {}) {
    // Stop if an unexpected event does not include a state object.
    if (!state || typeof state !== 'object') return;

    // Find out whether dark appearance is currently active.
    const isDarkTheme = state.theme === 'dark';
    // Add the root theme attribute when the dark theme is selected.
    if (isDarkTheme) {
      // Let the stylesheet respond to the shared theme setting.
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Return to the default appearance when dark theme is not selected.
      document.documentElement.removeAttribute('data-theme');
    }

    // Update the theme button only when it exists on this page.
    if (this.themeToggle) {
      // Describe the theme that clicking the button will activate next.
      this.themeToggle.setAttribute(
        'aria-label',
        isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
      );
      // Expose a simple icon name for any CSS icon treatment.
      this.themeToggle.dataset.icon = isDarkTheme ? 'sun' : 'moon';
      // Look for an optional icon element provided by the page markup.
      const themeIcon = this.themeToggle.querySelector('[data-theme-icon]');
      // Update the icon only when that optional element is present.
      if (themeIcon) {
        // Show a sun for the next light-theme action or a moon for dark.
        themeIcon.textContent = isDarkTheme ? '☀️' : '🌙';
      }
    }

    // Read whether focus mode should currently be enabled.
    const isFocusMode = state.focusMode === true;
    // Add the body attribute while focus mode is enabled.
    if (isFocusMode) {
      // Let CSS adjust the workspace based on the focus-mode attribute.
      document.body.setAttribute('data-focus-mode', 'true');
    } else {
      // Remove the attribute to restore the regular workspace layout.
      document.body.removeAttribute('data-focus-mode');
    }

    // Update the focus button only when it is present in the document.
    if (this.focusModeToggle) {
      // Tell assistive technology whether focus mode is active.
      this.focusModeToggle.setAttribute('aria-pressed', String(isFocusMode));
    }

    // Treat only true as the open state, keeping closed as a safe fallback.
    const isSidebarOpen = state.sidebarOpen === true;
    // Let the stylesheet apply its existing open and closed sidebar rules.
    document.documentElement.setAttribute('data-sidebar-open', String(isSidebarOpen));
    // Also set the sidebar width directly so the state is visible without CSS rules.
    if (this.sidebar) {
      // Use the original 68-pixel sidebar width when it is open.
      this.sidebar.style.width = isSidebarOpen ? '68px' : '0px';
      // Permit the sidebar to collapse fully when it is closed.
      this.sidebar.style.minWidth = isSidebarOpen ? '68px' : '0px';
      // Clip inner content when the sidebar is closed.
      this.sidebar.style.overflow = 'hidden';
      // Remove the border when closed so no thin line remains visible.
      this.sidebar.style.borderRightColor = isSidebarOpen ? '' : 'transparent';
    }
    // Match the grid columns to the selected sidebar width.
    if (this.workspaceLayout) {
      // Keep the main workspace flexible beside the sidebar.
      this.workspaceLayout.style.gridTemplateColumns = isSidebarOpen
        ? '68px minmax(0, 1fr)'
        : '0px minmax(0, 1fr)';
    }
    // Keep the sidebar button's accessible state in sync with the Store.
    if (this.sidebarToggle) {
      // Expose the current open or closed state to assistive technology.
      this.sidebarToggle.setAttribute('aria-expanded', String(isSidebarOpen));
      // Describe the action the button will take next.
      this.sidebarToggle.setAttribute('aria-label', isSidebarOpen ? 'Close sidebar' : 'Open sidebar');
      // Keep the tooltip consistent with the accessible name.
      this.sidebarToggle.setAttribute('title', isSidebarOpen ? 'Close sidebar' : 'Open sidebar');
    }

    // Use Split Screen only for the exact split state; otherwise show Full Screen.
    const isSplitLayout = state.activeLayout === 'split';
    // Treat the other supported layout state as Full Screen.
    const isFullLayout = !isSplitLayout;
    // Unhide the composition so the selected layout can actually be seen.
    if (this.viewportComposition) {
      // Let the selected layout occupy the viewport composition area.
      this.viewportComposition.hidden = false;
    }
    // Show the Full Screen container only when that layout is selected.
    if (this.fullScreenViewportLayout) {
      // The hidden property keeps the inactive layout out of view and tab order.
      this.fullScreenViewportLayout.hidden = !isFullLayout;
    }
    // Show the Split Screen container only when that layout is selected.
    if (this.splitScreenViewportLayout) {
      // The inactive layout should not occupy space or receive keyboard focus.
      this.splitScreenViewportLayout.hidden = !isSplitLayout;
    }
    // Show the divider only when there are two panes to resize.
    if (this.splitDivider) {
      // A hidden divider cannot be focused or dragged in Full Screen mode.
      this.splitDivider.hidden = !isSplitLayout;
    }
    // Keep the Full Screen button's pressed state aligned with the selected layout.
    if (this.fullScreenButton) {
      // Expose whether Full Screen is the active choice to assistive technology.
      this.fullScreenButton.setAttribute('aria-pressed', String(isFullLayout));
    }
    // Keep the Split Screen button's pressed state aligned with the selected layout.
    if (this.splitScreenButton) {
      // Expose whether Split Screen is the active choice to assistive technology.
      this.splitScreenButton.setAttribute('aria-pressed', String(isSplitLayout));
    }
    // Reapply the saved local divider ratio when Split Screen becomes active.
    if (isSplitLayout && this.viewportComposition && this.splitDivider) {
      // Keep the two panes at the most recently selected ratio.
      this.viewportComposition.style.setProperty('--split-left-share', this.rememberedSplitRatio + 'fr');
      // Keep the right pane at the matching remaining ratio.
      this.viewportComposition.style.setProperty('--split-right-share', (1 - this.rememberedSplitRatio) + 'fr');
      // Synchronize the accessible percentage with the restored ratio.
      this.splitDivider.setAttribute('aria-valuenow', String(Math.round(this.rememberedSplitRatio * 100)));
    }
  }
}

// Export the class by its default name for the startup module.
export default WorkspaceUI;
