// Import the shared Store so saved settings load before the interface is connected.
import Store from './core/Store.js';
// Import the class that connects workspace controls to the state system.
import WorkspaceUI from './ui/WorkspaceUI.js';

// Wait until the browser has parsed the page before looking up its controls.
document.addEventListener('DOMContentLoaded', () => {
  // Restore recognized settings saved by the legacy Lux PDF Viewer.
  Store.init();

  // Connect the workspace buttons and apply the initial state to the document.
  new WorkspaceUI();
});
