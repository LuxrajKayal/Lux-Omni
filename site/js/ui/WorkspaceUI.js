// Import the shared Store so button clicks can request state changes.
import Store from '../core/Store.js';
// Import the shared EventBus so this UI can listen for state updates.
import EventBus from '../core/EventBus.js';

// Define the class responsible for connecting workspace controls to application state.
export class WorkspaceUI {
  // Set up the controls and connect them to the shared state system.
  constructor() {
    // Find the button that lets the user switch between light and dark themes.
    this.themeToggle = document.querySelector('#theme-toggle');
    // Find the button that lets the user turn focus mode on and off.
    this.focusModeToggle = document.querySelector('#focus-mode-toggle');

    // Listen for theme-button clicks only when that button exists on this page.
    if (this.themeToggle) {
      // Use the click only to update the Store; the state event updates the DOM.
      this.themeToggle.addEventListener('click', () => {
        // Read the current state so the next theme is based on the latest value.
        const currentState = Store.getState();
        // Switch from dark to light, or from any other theme to dark.
        const newTheme = currentState.theme === 'dark' ? 'light' : 'dark';
        // Ask the Store to save the new theme and publish STATE_CHANGED.
        Store.setState({ theme: newTheme });
      });
    }

    // Listen for focus-mode clicks only when the focus button exists.
    if (this.focusModeToggle) {
      // Use the click to request a state update instead of changing the DOM here.
      this.focusModeToggle.addEventListener('click', () => {
        // Read the current state to find out whether focus mode is already active.
        const currentState = Store.getState();
        // Choose the opposite boolean value for the next focus-mode state.
        const newFocusMode = !currentState.focusMode;
        // Ask the Store to publish the requested focus-mode change.
        Store.setState({ focusMode: newFocusMode });
      });
    }

    // Subscribe this UI to changes sent by the application's shared event system.
    EventBus.subscribe('STATE_CHANGED', this.handleStateChange.bind(this));

    // Apply the current state once because initial Store setup may have happened earlier.
    // This method accepts the raw state returned here as well as later event payloads.
    this.handleStateChange(Store.getState());
  }

  // Apply a state snapshot to the page after startup or a state-change event.
  handleStateChange(payload) {
    // Store events contain { updates, state }, while getState() returns state directly.
    const state = payload?.state ?? payload;

    // Stop safely if an unexpected event payload did not include a state object.
    if (!state || typeof state !== 'object') {
      // Avoid trying to read properties from missing or invalid state data.
      return;
    }

    // Check whether the requested theme should use the dark appearance.
    const isDarkTheme = state.theme === 'dark';

    // Add the dark-theme attribute when dark mode is active.
    if (isDarkTheme) {
      // Let CSS style the whole document based on this root attribute.
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Remove the attribute so the document returns to its default light theme.
      document.documentElement.removeAttribute('data-theme');
    }

    // Update the theme control only if the button exists in the current page.
    if (this.themeToggle) {
      // Describe the action the button will perform when the user activates it.
      this.themeToggle.setAttribute(
        'aria-label',
        isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme',
      );

      // Publish a simple icon name for CSS or other icon systems that use data attributes.
      this.themeToggle.dataset.icon = isDarkTheme ? 'sun' : 'moon';

      // Look for an optional text-based icon slot supplied by the page markup.
      const themeIcon = this.themeToggle.querySelector('[data-theme-icon]');

      // Update the visible icon only when that optional slot is present.
      if (themeIcon) {
        // Show a sun when light mode is the next action, otherwise show a moon.
        themeIcon.textContent = isDarkTheme ? '☀️' : '🌙';
      }
    }

    // Read whether the Store says focus mode should be enabled.
    const isFocusMode = state.focusMode === true;

    // Add the focus-mode attribute when focus mode is active.
    if (isFocusMode) {
      // Let CSS hide distractions or expand the workspace using this body attribute.
      document.body.setAttribute('data-focus-mode', 'true');
    } else {
      // Remove the attribute to restore the regular page layout.
      document.body.removeAttribute('data-focus-mode');
    }

    // Update the focus button only when the matching control is available.
    if (this.focusModeToggle) {
      // Tell assistive technology whether this toggle is currently pressed or active.
      this.focusModeToggle.setAttribute('aria-pressed', String(isFocusMode));
    }
  }
}

// Export the class as the default so main.js can create the workspace controller.
export default WorkspaceUI;
