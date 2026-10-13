// Keep the Dropbox configuration in one place for the whole Lux Omni service.
// The app key is a public client identifier, never a private app secret.
const DROPBOX_CONFIG = Object.freeze({
  // Use the public Dropbox application key registered for this site.
  appKey: "8vfyy6u50amp4py",
  // Build the redirect URI from the active site path, including its Pages subpath.
  get redirectUri() {
    // Resolve to the directory containing the page, rather than a nested file.
    return new URL("./", window.location.href).href;
  },
  // Send account and file metadata requests to the Dropbox API v2 host.
  apiBaseUrl: "https://api.dropboxapi.com/2",
  // Send file-byte downloads and uploads to the Dropbox content host.
  contentBaseUrl: "https://content.dropboxapi.com/2",
  // Start browser-based OAuth authorization at Dropbox's authorization endpoint.
  oauthAuthorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  // Exchange an authorization code for a short-lived access token at this endpoint.
  oauthTokenUrl: "https://api.dropboxapi.com/oauth2/token",
  // Request only the account and file permissions used by this application.
  scopes: Object.freeze([
    "account_info.read",
    "files.metadata.read",
    "files.content.read",
    "files.content.write",
  ]),
  // Keep only temporary PKCE state and verifier values in browser storage.
  storageKeys: Object.freeze({
    // Prefix state-specific verifier keys so separate authorization attempts do not overwrite.
    pendingVerifier: "lux-omni-dropbox-pkce-verifier",
    // Prefix state-specific state keys so each callback can validate its own attempt.
    pendingState: "lux-omni-dropbox-oauth-state",
  }),
});

// Give Dropbox failures a consistent error type with useful response details.
export class DropboxApiError extends Error {
  // Preserve the HTTP status and Dropbox error information for callers.
  constructor(message, { status = 0, errorSummary = "", details = null } = {}) {
    // Initialize the regular JavaScript Error message first.
    super(message);
    // Use a recognizable name when logging or catching this error.
    this.name = "DropboxApiError";
    // Keep the HTTP status so connection checks can recognize unauthorized responses.
    this.status = status;
    // Keep Dropbox's short error description when one is available.
    this.errorSummary = errorSummary;
    // Keep the parsed server response to help diagnose a failed request.
    this.details = details;
  }
}

// Build the service as a class, then export one shared instance below.
class DropboxApi {
  // Store the active access token only inside this private in-memory field.
  #accessToken = null;
  // Keep the expiration time in memory instead of browser storage as well.
  #expiresAt = 0;

  // Provide a clear error if browser storage cannot be accessed for PKCE.
  #getStorage() {
    // Read localStorage only when the OAuth redirect needs temporary PKCE values.
    try {
      // Return the browser storage object without saving any access token in it.
      return window.localStorage;
    } catch {
      // Explain that storage is needed only to complete the OAuth redirect safely.
      throw new DropboxApiError(
        "Browser storage is unavailable. Enable site storage and try again.",
      );
    }
  }

  // Confirm that the browser provides the secure cryptography required by PKCE.
  #getCrypto() {
    // Require secure random values and SHA-256 support before starting sign-in.
    if (!window.crypto?.getRandomValues || !window.crypto?.subtle) {
      // Stop early instead of using a weaker random-number fallback.
      throw new DropboxApiError(
        "This browser does not provide the secure Web Crypto APIs required for Dropbox PKCE.",
      );
    }
    // Return the browser's secure cryptography interface.
    return window.crypto;
  }

  // Convert random bytes into the URL-safe text format required by PKCE.
  #toBase64Url(bytes) {
    // Build a binary string from each byte before base64 encoding.
    let binary = "";
    // Convert every byte into one character for the browser's base64 function.
    for (const byte of bytes) binary += String.fromCharCode(byte);
    // Replace the characters that are not safe in a URL and remove padding.
    return window.btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  // Generate strong random URL-safe text for state values and PKCE verifiers.
  #randomBase64Url(byteLength = 32) {
    // Allocate exactly the requested number of random bytes.
    const bytes = new Uint8Array(byteLength);
    // Fill the array with cryptographically secure random values.
    this.#getCrypto().getRandomValues(bytes);
    // Convert the random bytes into the URL-safe text format.
    return this.#toBase64Url(bytes);
  }

  // Create the S256 challenge that Dropbox receives during authorization.
  async #createCodeChallenge(verifier) {
    // Encode the verifier as bytes before calculating its digest.
    const encoded = new TextEncoder().encode(verifier);
    // Hash those bytes with SHA-256 as required by the PKCE S256 method.
    const digest = await this.#getCrypto().subtle.digest("SHA-256", encoded);
    // Return the digest as URL-safe base64 without trailing padding.
    return this.#toBase64Url(new Uint8Array(digest));
  }

  // Build the storage key for one authorization attempt's PKCE verifier.
  #verifierKey(state) {
    // Include the random state so multiple pending tabs keep separate verifiers.
    return DROPBOX_CONFIG.storageKeys.pendingVerifier + ":" + state;
  }

  // Build the storage key for one authorization attempt's expected state.
  #stateKey(state) {
    // Pair this state key with the matching verifier key.
    return DROPBOX_CONFIG.storageKeys.pendingState + ":" + state;
  }

  // Remove temporary PKCE entries without touching application or credential data.
  #clearPendingOAuth(state = null) {
    // Storage may be blocked, so cleanup should never hide the original result.
    try {
      // Get the browser storage used for the short-lived OAuth values.
      const storage = this.#getStorage();
      // Clean only the keys associated with the callback we just handled.
      if (state) {
        // Remove this attempt's saved verifier.
        storage.removeItem(this.#verifierKey(state));
        // Remove this attempt's saved state.
        storage.removeItem(this.#stateKey(state));
      } else {
        // Iterate backward because removing a key can change storage indexes.
        for (let index = storage.length - 1; index >= 0; index -= 1) {
          // Read the key at the current storage position.
          const key = storage.key(index);
          // Check only the temporary state prefix used by this service.
          const isPendingState = key?.startsWith(DROPBOX_CONFIG.storageKeys.pendingState + ":");
          // Check only the temporary verifier prefix used by this service.
          const isPendingVerifier = key?.startsWith(DROPBOX_CONFIG.storageKeys.pendingVerifier + ":");
          // Leave every unrelated localStorage entry unchanged.
          if (key && (isPendingState || isPendingVerifier)) {
            // Remove the temporary PKCE key after it is no longer needed.
            storage.removeItem(key);
          }
        }
      }
    } catch {
      // Allow sign-out and callback handling to finish if storage is unavailable.
    }
  }

  // Remove OAuth query values so codes and state do not remain in the address bar.
  #removeOAuthParametersFromAddressBar() {
    // Parse the current URL so unrelated query parameters can be preserved.
    const url = new URL(window.location.href);
    // List only query parameters that belong to the OAuth redirect.
    for (const key of ["code", "state", "error", "error_description", "scope", "token_access_type"]) {
      // Remove each OAuth parameter from the visible address.
      url.searchParams.delete(key);
    }
    // Replace the current history entry without adding another navigation step.
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }

  // Make JSON safe for Dropbox-API-Arg, which is sent inside an HTTP header.
  #headerSafeJson(value) {
    // Escape non-ASCII characters so international file paths remain valid headers.
    return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) => {
      // Represent each escaped character with its Unicode code point.
      return "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0");
    });
  }

  // Turn an unsuccessful HTTP response into a useful service error.
  async #readErrorResponse(response) {
    // Read the server's response body, using an empty string if reading fails.
    const raw = await response.text().catch(() => "");
    // Preserve the raw body unless it can be parsed as JSON.
    let details = raw;
    // Try parsing the response because Dropbox usually sends structured errors.
    try {
      // Store parsed JSON, or null for an empty response.
      details = raw ? JSON.parse(raw) : null;
    } catch {
      // Leave the raw text in place when the response is not JSON.
    }

    // Select the most useful error description available in the response.
    const errorSummary =
      details?.error_summary ||
      details?.error?.error_summary ||
      details?.error_description ||
      details?.error ||
      response.statusText ||
      "Dropbox request failed";

    // Return the status and response details so callers can handle specific errors.
    return new DropboxApiError(
      "Dropbox request failed (" + response.status + "): " + String(errorSummary),
      { status: response.status, errorSummary: String(errorSummary), details },
    );
  }

  // Return the active token only to internal methods and only while it is valid.
  #getActiveAccessToken() {
    // Allow a small safety margin so requests do not begin with a nearly expired token.
    if (!this.#accessToken || !this.#expiresAt || this.#expiresAt <= Date.now() + 15000) {
      // Forget an expired token in memory so it cannot be used by later requests.
      this.#accessToken = null;
      // Forget the expired token's deadline in memory too.
      this.#expiresAt = 0;
      // Tell the caller that no active token is available.
      return null;
    }
    // Return the active token to a private request method only.
    return this.#accessToken;
  }

  // Forget an access token if Dropbox reports that the token is unauthorized.
  #expireSessionOnUnauthorized(status) {
    // Other HTTP errors do not prove that the access token is invalid.
    if (status !== 401) return;
    // Remove the token from memory after a 401 response.
    this.#accessToken = null;
    // Remove its expiration deadline at the same time.
    this.#expiresAt = 0;
  }

  // Send a JSON request to a Dropbox API v2 endpoint.
  async #requestJson(endpoint, args = {}) {
    // Get the current private token and reject calls when it is missing or expired.
    const token = this.#getActiveAccessToken();
    // Require a completed authorization flow before accessing account or file data.
    if (!token) {
      // Give callers a direct instruction instead of making an anonymous request.
      throw new DropboxApiError("Dropbox is not connected. Authorize the app first.");
    }

    // Send the arguments as JSON to the requested API endpoint.
    const response = await fetch(DROPBOX_CONFIG.apiBaseUrl + endpoint, {
      // Dropbox API v2 write operations use POST requests.
      method: "POST",
      // Include JSON content type and the private bearer token in request headers.
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      // Encode the options as the JSON request body expected by Dropbox.
      body: JSON.stringify(args),
    });

    // Handle any non-success response before returning data to the caller.
    if (!response.ok) {
      // Decode the service response into a descriptive error object.
      const error = await this.#readErrorResponse(response);
      // Forget the token if Dropbox says it is no longer authorized.
      this.#expireSessionOnUnauthorized(error.status);
      // Keep the original details available to the code calling this method.
      throw error;
    }

    // Return null for a successful response that has no body.
    if (response.status === 204) return null;
    // Parse and return the JSON result for normal successful responses.
    return response.json();
  }

  // Send file bytes to or from a Dropbox content endpoint.
  async #requestContent(endpoint, args, body) {
    // Get the active token without ever placing it in browser storage.
    const token = this.#getActiveAccessToken();
    // Require the user to authorize before transferring any content.
    if (!token) {
      // Stop before sending file bytes when there is no valid session.
      throw new DropboxApiError("Dropbox is not connected. Authorize the app first.");
    }

    // Use the dedicated Dropbox content host for upload and download calls.
    const response = await fetch(DROPBOX_CONFIG.contentBaseUrl + endpoint, {
      // Dropbox content endpoints expect POST with metadata in a header.
      method: "POST",
      // Add the bearer token, binary content type, and encoded request arguments.
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": this.#headerSafeJson(args),
      },
      // Pass the file Blob or null for downloads, matching the endpoint's needs.
      body,
    });

    // Convert a failed content request into a DropboxApiError.
    if (!response.ok) {
      // Read the service's error response before changing local state.
      const error = await this.#readErrorResponse(response);
      // Clear the in-memory token after an unauthorized response.
      this.#expireSessionOnUnauthorized(error.status);
      // Let the caller present the error or retry the operation.
      throw error;
    }

    // Return the raw response so upload metadata or downloaded bytes can be read.
    return response;
  }

  // Validate a Dropbox path while allowing the empty string to represent its root.
  #requireDropboxPath(path, { allowRoot = false } = {}) {
    // Reject values that are not text.
    if (typeof path !== "string") {
      // Tell the caller which value type the API expects.
      throw new TypeError("A Dropbox path must be a string.");
    }
    // Dropbox represents its root folder with an empty path.
    if (allowRoot && (path === "" || path === "/")) return "";
    // File and folder paths must be absolute and must not end with a slash.
    if (!path.startsWith("/") || path === "/" || path.endsWith("/")) {
      // Show the expected format in the error so it is easy to fix.
      throw new TypeError("Use an absolute Dropbox file/folder path, e.g. /Documents/report.pdf.");
    }
    // Return the checked path for use in the API request.
    return path;
  }

  // Create a URL for OAuth authorization using the PKCE S256 flow.
  async createAuthorizationUrl() {
    // Prepare access to the browser storage used for temporary PKCE values only.
    const storage = this.#getStorage();
    // Create a high-entropy verifier that is kept only during the redirect exchange.
    const verifier = this.#randomBase64Url(32);
    // Create a separate random state value to bind the response to this request.
    const state = this.#randomBase64Url(32);
    // Derive the public S256 challenge from the verifier.
    const challenge = await this.#createCodeChallenge(verifier);

    // Store this attempt's state and verifier under state-specific temporary keys.
    try {
      // Save the expected state for matching the redirect callback.
      storage.setItem(this.#stateKey(state), state);
      // Save the verifier that Dropbox will require for the code exchange.
      storage.setItem(this.#verifierKey(state), verifier);
    } catch {
      // Remove either key if storage failed partway through this operation.
      this.#clearPendingOAuth(state);
      // Stop sign-in when the browser cannot retain the temporary PKCE values.
      throw new DropboxApiError("Browser storage could not save the temporary Dropbox sign-in values.");
    }

    // Start with the official Dropbox authorization endpoint.
    const url = new URL(DROPBOX_CONFIG.oauthAuthorizeUrl);
    // Identify the public Dropbox application.
    url.searchParams.set("client_id", DROPBOX_CONFIG.appKey);
    // Request an authorization code rather than a token in the browser URL.
    url.searchParams.set("response_type", "code");
    // Tell Dropbox exactly where to redirect after authorization.
    url.searchParams.set("redirect_uri", DROPBOX_CONFIG.redirectUri);
    // Send the S256 challenge instead of sending the verifier.
    url.searchParams.set("code_challenge", challenge);
    // Declare which PKCE challenge transformation was used.
    url.searchParams.set("code_challenge_method", "S256");
    // Include state so the callback can match this authorization attempt.
    url.searchParams.set("state", state);
    // Request only the scopes required for the current Dropbox features.
    url.searchParams.set("scope", DROPBOX_CONFIG.scopes.join(" "));
    // Return the full URL so the caller can navigate to Dropbox.
    return url.href;
  }

  // Redirect the current tab to Dropbox to begin the authorization flow.
  async beginAuthorization() {
    // Build and store the temporary PKCE values before navigating away.
    const authorizationUrl = await this.createAuthorizationUrl();
    // Navigate to the URL without opening a separate popup window.
    window.location.assign(authorizationUrl);
  }

  // Complete the OAuth exchange when Dropbox returns to the configured site URL.
  async handleOAuthCallback() {
    // Read the current address to check whether Dropbox has redirected here.
    const url = new URL(window.location.href);
    // Read the authorization code supplied after a successful sign-in.
    const code = url.searchParams.get("code");
    // Read any error Dropbox returned when authorization could not complete.
    const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
    // Read the state value that should match the pending attempt.
    const returnedState = url.searchParams.get("state");

    // Leave normal page loads untouched when there are no OAuth parameters.
    if (!code && !oauthError) return null;

    // Access the short-lived PKCE values for this exact callback state.
    const storage = this.#getStorage();
    // Look up the saved state only when Dropbox returned one.
    const expectedState = returnedState ? storage.getItem(this.#stateKey(returnedState)) : null;
    // Look up the matching verifier only when Dropbox returned one.
    const verifier = returnedState ? storage.getItem(this.#verifierKey(returnedState)) : null;

    // Remove the code and state from the visible URL before processing the response.
    this.#removeOAuthParametersFromAddressBar();

    // Always clean up this attempt's PKCE keys, whether the exchange succeeds or fails.
    try {
      // Show a useful error when Dropbox reports that authorization was denied.
      if (oauthError) {
        // Avoid trying to exchange a code after an authorization error.
        throw new DropboxApiError("Dropbox authorization was not completed: " + oauthError);
      }
      // Require a matching random state and its verifier to prevent callback mix-ups.
      if (!returnedState || expectedState !== returnedState || !verifier) {
        // Ask the user to restart if this browser cannot validate the response.
        throw new DropboxApiError("Dropbox sign-in could not be verified. Please authorize again.");
      }
      // Require a code when the callback has no authorization error.
      if (!code) {
        // Reject an incomplete callback instead of making a malformed request.
        throw new DropboxApiError("Dropbox did not return an authorization code.");
      }

      // Prepare the form data required by the token endpoint.
      const form = new URLSearchParams({
        // Identify the authorization-code exchange grant.
        grant_type: "authorization_code",
        // Pass the one-time code returned by Dropbox.
        code,
        // Identify the same public application that started authorization.
        client_id: DROPBOX_CONFIG.appKey,
        // Repeat the exact redirect URI used in the authorization request.
        redirect_uri: DROPBOX_CONFIG.redirectUri,
        // Prove possession of the verifier associated with the random state.
        code_verifier: verifier,
      });

      // Exchange the code and verifier for a short-lived access token.
      const response = await fetch(DROPBOX_CONFIG.oauthTokenUrl, {
        // The OAuth token endpoint expects form-encoded fields.
        method: "POST",
        // Identify the body as URL-encoded form data.
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // Convert the fields into the encoded request body.
        body: form.toString(),
      });

      // Convert token endpoint errors into the same consistent error type.
      if (!response.ok) throw await this.#readErrorResponse(response);
      // Parse the successful token response returned by Dropbox.
      const tokenResult = await response.json();
      // Require an access token before marking this service as connected.
      if (!tokenResult?.access_token) {
        // Do not accept incomplete or unexpected token responses.
        throw new DropboxApiError("Dropbox did not return an access token.");
      }

      // Use Dropbox's expiry value, with the same four-hour fallback as the legacy flow.
      const expiresIn = Math.max(60, Number(tokenResult.expires_in) || 14400);
      // Save the active access token only in the private field on this instance.
      this.#accessToken = tokenResult.access_token;
      // Keep the expiry deadline in memory beside the private token.
      this.#expiresAt = Date.now() + expiresIn * 1000;

      // Return connection metadata without exposing the access token to callers.
      return {
        // Tell the caller that the code exchange succeeded.
        connected: true,
        // Report the token expiration time for UI status if needed.
        expiresAt: this.#expiresAt,
        // Provide an account identifier when Dropbox includes one.
        accountId: tokenResult.account_id || null,
      };
    } finally {
      // Remove the one-time state and verifier as soon as this attempt finishes.
      this.#clearPendingOAuth(returnedState);
    }
  }

  // Report whether this service currently holds a valid in-memory access token.
  hasLocalSession() {
    // Return a boolean without returning the private token itself.
    return Boolean(this.#getActiveAccessToken());
  }

  // Check the active connection by requesting the current Dropbox account.
  async checkConnection() {
    // Return early when sign-in has not produced a valid in-memory token.
    if (!this.hasLocalSession()) return { connected: false, account: null };
    // Ask Dropbox to verify the account associated with the current token.
    try {
      // Return both the connection flag and current account information.
      const account = await this.getCurrentAccount();
      // A successful account request confirms the connection is active.
      return { connected: true, account };
    } catch (error) {
      // A 401 response means the connection is no longer authorized.
      if (error?.status === 401) return { connected: false, account: null };
      // Other failures should remain visible to the caller.
      throw error;
    }
  }

  // Retrieve account details for the currently authorized Dropbox user.
  async getCurrentAccount() {
    // Call the exact Dropbox API v2 endpoint used by the legacy service.
    return this.#requestJson("/users/get_current_account", {});
  }

  // List one folder, with an empty path representing the account's root folder.
  async listFolder({
    // Start from the root unless the caller specifies another path.
    path = "",
    // Keep nested-folder traversal optional by default.
    recursive = false,
    // Use Dropbox's normal upper bound for folder result batches.
    limit = 1000,
    // Exclude deleted entries unless the caller requests them.
    includeDeleted = false,
  } = {}) {
    // Convert an accepted root slash into the empty path expected by Dropbox.
    const folderPath = path === "" || path === "/" ? "" : this.#requireDropboxPath(path);
    // Clamp the requested result count to Dropbox's supported range.
    const safeLimit = Math.max(1, Math.min(2000, Math.floor(Number(limit) || 1000)));
    // Ask Dropbox for the requested folder entries and paging cursor.
    return this.#requestJson("/files/list_folder", {
      // Supply the validated path, with the empty string for root.
      path: folderPath,
      // Send the recursive option as a consistent boolean.
      recursive: Boolean(recursive),
      // Send the include-deleted option as a consistent boolean.
      include_deleted: Boolean(includeDeleted),
      // Keep the result count inside the allowed range.
      limit: safeLimit,
    });
  }

  // Fetch every page of a folder listing until Dropbox has no remaining entries.
  async listAllFolderEntries(options = {}) {
    // Request the first page using the same options as listFolder.
    let page = await this.listFolder(options);
    // Copy the first page's entries so the returned array can be built safely.
    const entries = [...(page.entries || [])];

    // Continue while Dropbox reports more entries and gives us a cursor.
    while (page.has_more && page.cursor) {
      // Request the next batch with the cursor returned by Dropbox.
      page = await this.#requestJson("/files/list_folder/continue", { cursor: page.cursor });
      // Add all entries from this page to the combined result.
      entries.push(...(page.entries || []));
    }

    // Return a flat array with all entries collected from the folder.
    return entries;
  }

  // Download the binary contents and metadata of a file or file ID.
  async downloadFile(pathOrId) {
    // Reject empty or non-text file identifiers before making a network request.
    if (typeof pathOrId !== "string" || !pathOrId.trim()) {
      // Tell the caller that a Dropbox path or ID is required.
      throw new TypeError("downloadFile expects a Dropbox path or file ID.");
    }
    // Allow Dropbox file IDs while validating normal absolute file paths.
    const path = pathOrId.startsWith("id:") ? pathOrId : this.#requireDropboxPath(pathOrId);
    // Ask the content endpoint to return the file's bytes.
    const response = await this.#requestContent("/files/download", { path }, null);
    // Dropbox puts file metadata in this response header.
    const resultHeader = response.headers.get("Dropbox-API-Result");
    // Start with no metadata in case the header is absent or malformed.
    let metadata = null;
    // Parse the metadata header only when Dropbox supplied one.
    try {
      // Store the decoded file details for the caller.
      metadata = resultHeader ? JSON.parse(resultHeader) : null;
    } catch {
      // Still allow the download if optional metadata cannot be parsed.
    }
    // Return the downloaded bytes and any metadata as a single result.
    return { blob: await response.blob(), metadata };
  }

  // Upload a new file or replace a file at the specified Dropbox path.
  async uploadFile({
    // Require the caller to choose the destination path.
    path,
    // Accept a File or Blob containing the bytes to upload.
    file,
    // Add a new file by default to avoid accidental replacement.
    mode = "add",
    // Do not rename duplicate files unless the caller asks.
    autorename = false,
    // Keep Dropbox notifications quiet unless requested otherwise.
    mute = false,
  } = {}) {
    // Validate the destination as an absolute Dropbox file path.
    const destination = this.#requireDropboxPath(path);
    // Require binary data so the content request has a supported body.
    if (typeof Blob === "undefined" || !(file instanceof Blob)) {
      // Explain the accepted content types to the caller.
      throw new TypeError("file must be a File, Blob, or another Blob-compatible value.");
    }
    // Limit upload modes to the two explicit options supported by this method.
    if (!["add", "overwrite"].includes(mode)) {
      // Keep revision-aware updates in the dedicated saveEditedFile method.
      throw new TypeError('uploadFile mode must be "add" or "overwrite". Use saveEditedFile() for revision-aware updates.');
    }

    // Send the file bytes with the destination and mode in Dropbox-API-Arg.
    const response = await this.#requestContent("/files/upload", {
      // Tell Dropbox where to create or replace the file.
      path: destination,
      // Choose whether to add the file or replace the path's current contents.
      mode,
      // Convert the duplicate-name preference to a boolean.
      autorename: Boolean(autorename),
      // Convert the notification preference to a boolean.
      mute: Boolean(mute),
    }, file);

    // Return the metadata describing the uploaded file.
    return response.json();
  }

  // Save edited bytes back to the original path with optional revision protection.
  async saveEditedFile({
    // Use the original path so edits replace the selected source file.
    originalPath,
    // Receive the new file bytes produced by the editor.
    content,
    // Use a revision when provided to prevent overwriting newer edits.
    originalRevision = null,
    // Allow callers to silence Dropbox notifications explicitly.
    mute = false,
  } = {}) {
    // Validate the original path before uploading the edited bytes.
    const destination = this.#requireDropboxPath(originalPath);
    // Require a Blob because edited documents must be uploaded as binary data.
    if (typeof Blob === "undefined" || !(content instanceof Blob)) {
      // Give the caller a clear error when the content has the wrong type.
      throw new TypeError("content must be a Blob containing the edited file bytes.");
    }

    // Match a particular revision when possible to protect concurrent edits.
    const mode = originalRevision
      ? { ".tag": "update", update: originalRevision }
      // Otherwise explicitly replace the selected original path.
      : { ".tag": "overwrite" };

    // Upload to Dropbox using the revision-aware or overwrite mode.
    const response = await this.#requestContent("/files/upload", {
      // Keep the original location as the save destination.
      path: destination,
      // Use the selected revision policy for this save operation.
      mode,
      // Do not silently rename an edited copy to a different filename.
      autorename: false,
      // Respect the caller's notification preference.
      mute: Boolean(mute),
    }, content);

    // Return the revision and metadata of the newly saved file.
    return response.json();
  }

  // Revoke the current Dropbox token and clear all in-memory session details.
  async revokeToken() {
    // Keep a local reference only long enough to send the revoke request.
    const token = this.#getActiveAccessToken();
    // Clear this session regardless of whether the remote request succeeds.
    try {
      // Report that there was no active connection to revoke when no token exists.
      if (!token) return { revoked: false, reason: "no-active-token" };

      // Ask the official Dropbox API v2 endpoint to revoke this bearer token.
      const response = await fetch(DROPBOX_CONFIG.apiBaseUrl + "/auth/token/revoke", {
        // Revoke operations use POST and do not require a request body.
        method: "POST",
        // Authorize the revocation with the token kept in memory.
        headers: { Authorization: "Bearer " + token },
      });

      // Pass remote errors back to the caller rather than hiding them.
      if (!response.ok) throw await this.#readErrorResponse(response);
      // Report the successful remote revocation.
      return { revoked: true };
    } finally {
      // Forget the active token even when the revoke endpoint returns an error.
      this.#accessToken = null;
      // Forget the token deadline so the old session cannot be reused.
      this.#expiresAt = 0;
      // Remove any unfinished PKCE state and verifier values.
      this.#clearPendingOAuth();
    }
  }

  // Clear the in-memory connection and any temporary authorization attempt.
  clearSession() {
    // Forget the private access token without writing it anywhere else.
    this.#accessToken = null;
    // Reset its expiry deadline at the same time.
    this.#expiresAt = 0;
    // Clean up only temporary state and verifier entries from localStorage.
    this.#clearPendingOAuth();
  }
}

// Create one shared service instance so every module uses the same private token.
const dropboxApi = new DropboxApi();

// Export the singleton with the requested name for named imports.
export { dropboxApi as DropboxApi };

// Also provide the same singleton as the default export for simpler imports.
export default dropboxApi;
