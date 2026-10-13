// Import the shared Store so saved preferences load before controls are connected.
import Store from './core/Store.js';
// Import the class that connects workspace controls to shared application state.
import WorkspaceUI from './ui/WorkspaceUI.js';

// Wait until the browser has parsed the page before finding its controls.
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved preferences before applying the workspace's initial state.
  Store.init();

  // Connect the controls and paint the initial state onto the page.
  new WorkspaceUI();
});
