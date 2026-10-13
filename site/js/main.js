// Import the shared Store so saved preferences load before controls are connected.
// Purpose: Import a shared module so this file can reuse its functionality.
import Store from './core/Store.js';
// Import the class that connects workspace controls to shared application state.
// Purpose: Import a shared module so this file can reuse its functionality.
import WorkspaceUI from './ui/WorkspaceUI.js';
// Import the Dropbox connection status, file browser, and upload/sync controls.
// Purpose: Import a shared module so this file can reuse its functionality.
import DropboxModalUI from './ui/DropboxModalUI.js';

// Wait until the browser has parsed the page before finding its controls.
// Purpose: Register a handler so the application reacts when this event occurs.
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved preferences before applying the workspace's initial state.
  // Purpose: Run this statement as the next step in the surrounding operation.
  Store.init();

  // Connect the controls and paint the initial state onto the page.
  // Purpose: Run this statement as the next step in the surrounding operation.
  new WorkspaceUI();

  // Wire Dropbox buttons and initialize its OAuth/session status.
  // Purpose: Run this statement as the next step in the surrounding operation.
  new DropboxModalUI();
// Purpose: Close the current block, handler, object, or expression.
});
