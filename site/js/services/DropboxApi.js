// Keep the Dropbox configuration in one place for the whole Lux Omni service.
// The app key is a public client identifier, never a private app secret.
// Purpose: Declare a variable that stores a value needed by this logic.
const DROPBOX_CONFIG = Object.freeze({
  // Use the public Dropbox application key registered for this site.
  // Purpose: Set this named property in the surrounding object or configuration.
  appKey: "8vfyy6u50amp4py",
  // Build the redirect URI from the active site path, including its Pages subpath.
  // Purpose: Run this statement as the next step in the surrounding operation.
  get redirectUri() {
    // Resolve to the directory containing the page, rather than a nested file.
    // Purpose: Return the result to the code that called this function.
    return new URL("./", window.location.href).href;
  // Purpose: Close the current block, handler, object, or expression.
  },
  // Send account and file metadata requests to the Dropbox API v2 host.
  // Purpose: Set this named property in the surrounding object or configuration.
  apiBaseUrl: "https://api.dropboxapi.com/2",
  // Send file-byte downloads and uploads to the Dropbox content host.
  // Purpose: Set this named property in the surrounding object or configuration.
  contentBaseUrl: "https://content.dropboxapi.com/2",
  // Start browser-based OAuth authorization at Dropbox's authorization endpoint.
  // Purpose: Set this named property in the surrounding object or configuration.
  oauthAuthorizeUrl: "https://www.dropbox.com/oauth2/authorize",
  // Exchange an authorization code for a short-lived access token at this endpoint.
  // Purpose: Set this named property in the surrounding object or configuration.
  oauthTokenUrl: "https://api.dropboxapi.com/oauth2/token",
  // Request only the account and file permissions used by this application.
  // Purpose: Set this named property in the surrounding object or configuration.
  scopes: Object.freeze([
    // Purpose: Run this statement as the next step in the surrounding operation.
    "account_info.read",
    // Purpose: Run this statement as the next step in the surrounding operation.
    "files.metadata.read",
    // Purpose: Run this statement as the next step in the surrounding operation.
    "files.content.read",
    // Purpose: Run this statement as the next step in the surrounding operation.
    "files.content.write",
  // Purpose: Run this statement as the next step in the surrounding operation.
  ]),
  // Keep the legacy-compatible short-lived session and temporary PKCE values in browser storage.
  // Purpose: Set this named property in the surrounding object or configuration.
  storageKeys: Object.freeze({
    // Preserve the legacy key so a verified Dropbox session can survive a page refresh.
    // Purpose: Set this named property in the surrounding object or configuration.
    accessToken: "lux-omni-dropbox-access-token",
    // Store the deadline alongside the access token so expired sessions are rejected.
    // Purpose: Set this named property in the surrounding object or configuration.
    expiresAt: "lux-omni-dropbox-expires-at",
    // Prefix state-specific verifier keys so separate authorization attempts do not overwrite.
    // Purpose: Set this named property in the surrounding object or configuration.
    pendingVerifier: "lux-omni-dropbox-pkce-verifier",
    // Prefix state-specific state keys so each callback can validate its own attempt.
    // Purpose: Set this named property in the surrounding object or configuration.
    pendingState: "lux-omni-dropbox-oauth-state",
  // Purpose: Close the current block, handler, object, or expression.
  }),
// Purpose: Close the current block, handler, object, or expression.
});

// Give Dropbox failures a consistent error type with useful response details.
// Purpose: Run this statement as the next step in the surrounding operation.
export class DropboxApiError extends Error {
  // Preserve the HTTP status and Dropbox error information for callers.
  // Purpose: Run this statement as the next step in the surrounding operation.
  constructor(message, { status = 0, errorSummary = "", details = null } = {}) {
    // Initialize the regular JavaScript Error message first.
    // Purpose: Run this statement as the next step in the surrounding operation.
    super(message);
    // Use a recognizable name when logging or catching this error.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.name = "DropboxApiError";
    // Keep the HTTP status so connection checks can recognize unauthorized responses.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.status = status;
    // Keep Dropbox's short error description when one is available.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.errorSummary = errorSummary;
    // Keep the parsed server response to help diagnose a failed request.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.details = details;
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Build the service as a class, then export one shared instance below.
// Purpose: Define a class that groups related state and behavior.
class DropboxApi {
  // Cache the active token privately while keeping the legacy-compatible session in browser storage.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #accessToken = null;
  // Cache the token deadline privately and restore it from storage after a page refresh.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #expiresAt = 0;

  // Provide a clear error if browser storage cannot be accessed for PKCE.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #getStorage() {
    // Access browser storage for PKCE validation and legacy-compatible session restoration.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Return the browser storage object used for PKCE values and short-lived session keys.
      // Purpose: Return the result to the code that called this function.
      return window.localStorage;
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Explain that browser storage is required for PKCE validation and session restoration.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new DropboxApiError(
        // Purpose: Run this statement as the next step in the surrounding operation.
        "Browser storage is unavailable. Enable site storage and try again.",
      // Purpose: Close the current call or grouped expression.
      );
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Confirm that the browser provides the secure cryptography required by PKCE.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #getCrypto() {
    // Require secure random values and SHA-256 support before starting sign-in.
    // Purpose: Check this condition before choosing which branch should run.
    if (!window.crypto?.getRandomValues || !window.crypto?.subtle) {
      // Stop early instead of using a weaker random-number fallback.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new DropboxApiError(
        // Purpose: Run this statement as the next step in the surrounding operation.
        "This browser does not provide the secure Web Crypto APIs required for Dropbox PKCE.",
      // Purpose: Close the current call or grouped expression.
      );
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Return the browser's secure cryptography interface.
    // Purpose: Return the result to the code that called this function.
    return window.crypto;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Convert random bytes into the URL-safe text format required by PKCE.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #toBase64Url(bytes) {
    // Build a binary string from each byte before base64 encoding.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let binary = "";
    // Convert every byte into one character for the browser's base64 function.
    // Purpose: Repeat this operation for each item in the loop.
    for (const byte of bytes) binary += String.fromCharCode(byte);
    // Replace the characters that are not safe in a URL and remove padding.
    // Purpose: Return the result to the code that called this function.
    return window.btoa(binary)
      // Purpose: Run this statement as the next step in the surrounding operation.
      .replace(/\+/g, "-")
      // Purpose: Run this statement as the next step in the surrounding operation.
      .replace(/\//g, "_")
      // Purpose: Run this statement as the next step in the surrounding operation.
      .replace(/=+$/g, "");
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Generate strong random URL-safe text for state values and PKCE verifiers.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #randomBase64Url(byteLength = 32) {
    // Allocate exactly the requested number of random bytes.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const bytes = new Uint8Array(byteLength);
    // Fill the array with cryptographically secure random values.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#getCrypto().getRandomValues(bytes);
    // Convert the random bytes into the URL-safe text format.
    // Purpose: Return the result to the code that called this function.
    return this.#toBase64Url(bytes);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Create the S256 challenge that Dropbox receives during authorization.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async #createCodeChallenge(verifier) {
    // Encode the verifier as bytes before calculating its digest.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const encoded = new TextEncoder().encode(verifier);
    // Hash those bytes with SHA-256 as required by the PKCE S256 method.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const digest = await this.#getCrypto().subtle.digest("SHA-256", encoded);
    // Return the digest as URL-safe base64 without trailing padding.
    // Purpose: Return the result to the code that called this function.
    return this.#toBase64Url(new Uint8Array(digest));
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Build the storage key for one authorization attempt's PKCE verifier.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #verifierKey(state) {
    // Include the random state so multiple pending tabs keep separate verifiers.
    // Purpose: Return the result to the code that called this function.
    return DROPBOX_CONFIG.storageKeys.pendingVerifier + ":" + state;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Build the storage key for one authorization attempt's expected state.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #stateKey(state) {
    // Pair this state key with the matching verifier key.
    // Purpose: Return the result to the code that called this function.
    return DROPBOX_CONFIG.storageKeys.pendingState + ":" + state;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Remove temporary PKCE entries without touching application or credential data.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #clearPendingOAuth(state = null) {
    // Storage may be blocked, so cleanup should never hide the original result.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Access the browser storage used for the temporary OAuth values.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const storage = this.#getStorage();
      // Clean only the keys associated with the callback we just handled.
      // Purpose: Check this condition before choosing which branch should run.
      if (state) {
        // Remove this attempt's saved verifier.
        // Purpose: Run this statement as the next step in the surrounding operation.
        storage.removeItem(this.#verifierKey(state));
        // Remove this attempt's saved state.
        // Purpose: Run this statement as the next step in the surrounding operation.
        storage.removeItem(this.#stateKey(state));
      // Purpose: Close the current block, handler, object, or expression.
      } else {
        // Iterate backward because removing a key can change storage indexes.
        // Purpose: Repeat this operation for each item in the loop.
        for (let index = storage.length - 1; index >= 0; index -= 1) {
          // Read the key at the current storage position.
          // Purpose: Declare a variable that stores a value needed by this logic.
          const key = storage.key(index);
          // Check only the temporary state prefix used by this service.
          // Purpose: Declare a variable that stores a value needed by this logic.
          const isPendingState = key?.startsWith(DROPBOX_CONFIG.storageKeys.pendingState + ":");
          // Check only the temporary verifier prefix used by this service.
          // Purpose: Declare a variable that stores a value needed by this logic.
          const isPendingVerifier = key?.startsWith(DROPBOX_CONFIG.storageKeys.pendingVerifier + ":");
          // Leave every unrelated localStorage entry unchanged.
          // Purpose: Check this condition before choosing which branch should run.
          if (key && (isPendingState || isPendingVerifier)) {
            // Remove the temporary PKCE key after it is no longer needed.
            // Purpose: Run this statement as the next step in the surrounding operation.
            storage.removeItem(key);
          // Purpose: Close the current block, handler, object, or expression.
          }
        // Purpose: Close the current block, handler, object, or expression.
        }
      // Purpose: Close the current block, handler, object, or expression.
      }
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Allow sign-out and callback handling to finish if storage is unavailable.
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Remove OAuth query values so codes and state do not remain in the address bar.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #removeOAuthParametersFromAddressBar() {
    // Parse the current URL so unrelated query parameters can be preserved.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const url = new URL(window.location.href);
    // List only query parameters that belong to the OAuth redirect.
    // Purpose: Repeat this operation for each item in the loop.
    for (const key of ["code", "state", "error", "error_description", "scope", "token_access_type"]) {
      // Remove each OAuth parameter from the visible address.
      // Purpose: Run this statement as the next step in the surrounding operation.
      url.searchParams.delete(key);
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Replace the current history entry without adding another navigation step.
    // Purpose: Run this statement as the next step in the surrounding operation.
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Make JSON safe for Dropbox-API-Arg, which is sent inside an HTTP header.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #headerSafeJson(value) {
    // Escape non-ASCII characters so international file paths remain valid headers.
    // Purpose: Return the result to the code that called this function.
    return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) => {
      // Represent each escaped character with its Unicode code point.
      // Purpose: Return the result to the code that called this function.
      return "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0");
    // Purpose: Close the current block, handler, object, or expression.
    });
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Turn an unsuccessful HTTP response into a useful service error.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async #readErrorResponse(response) {
    // Read the server's response body, using an empty string if reading fails.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const raw = await response.text().catch(() => "");
    // Preserve the raw body unless it can be parsed as JSON.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let details = raw;
    // Try parsing the response because Dropbox usually sends structured errors.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Store parsed JSON, or null for an empty response.
      // Purpose: Run this statement as the next step in the surrounding operation.
      details = raw ? JSON.parse(raw) : null;
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Leave the raw text in place when the response is not JSON.
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Select the most useful error description available in the response.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const errorSummary =
      // Purpose: Run this statement as the next step in the surrounding operation.
      details?.error_summary ||
      // Purpose: Run this statement as the next step in the surrounding operation.
      details?.error?.error_summary ||
      // Purpose: Run this statement as the next step in the surrounding operation.
      details?.error_description ||
      // Purpose: Run this statement as the next step in the surrounding operation.
      details?.error ||
      // Purpose: Run this statement as the next step in the surrounding operation.
      response.statusText ||
      // Purpose: Run this statement as the next step in the surrounding operation.
      "Dropbox request failed";

    // Return the status and response details so callers can handle specific errors.
    // Purpose: Return the result to the code that called this function.
    return new DropboxApiError(
      // Purpose: Run this statement as the next step in the surrounding operation.
      "Dropbox request failed (" + response.status + "): " + String(errorSummary),
      // Purpose: Run this statement as the next step in the surrounding operation.
      { status: response.status, errorSummary: String(errorSummary), details },
    // Purpose: Close the current call or grouped expression.
    );
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Remove only the persisted access token and expiry metadata when a session ends.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #clearStoredSession() {
    // Keep cleanup best-effort so it cannot hide the original network or sign-out result.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Read the same storage used by the legacy session so existing sessions can migrate.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const storage = this.#getStorage();
      // Remove the short-lived access token after expiry, revocation, or authorization failure.
      // Purpose: Run this statement as the next step in the surrounding operation.
      storage.removeItem(DROPBOX_CONFIG.storageKeys.accessToken);
      // Remove its deadline so the two session values cannot drift apart.
      // Purpose: Run this statement as the next step in the surrounding operation.
      storage.removeItem(DROPBOX_CONFIG.storageKeys.expiresAt);
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // The in-memory session can still be cleared when browser storage is unavailable.
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Restore a valid short-lived session from localStorage after a page refresh.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #getActiveAccessToken() {
    // Reuse a cached token only while it remains valid beyond the safety margin.
    // Purpose: Check this condition before choosing which branch should run.
    if (this.#accessToken && this.#expiresAt > Date.now() + 15000) {
      // Return the verified-in-memory token while it is still fresh enough to use.
      // Purpose: Return the result to the code that called this function.
      return this.#accessToken;
    // Purpose: Close this conditional branch.
    }

    // Clear stale cached values before looking for the persisted session.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#accessToken = null;
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#expiresAt = 0;

    // Read the saved token and deadline without exposing them to UI modules.
    // Purpose: Start a protected operation so storage failures cannot become valid sessions.
    try {
      // Access the browser storage through this service's private helper.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const storage = this.#getStorage();
      // Read the access token using the exact key used by the legacy implementation.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const storedToken = storage.getItem(DROPBOX_CONFIG.storageKeys.accessToken);
      // Read the expiry deadline saved beside the token.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const storedExpiresAt = Number(storage.getItem(DROPBOX_CONFIG.storageKeys.expiresAt));

      // Reject missing, malformed, expired, or nearly expired session details.
      // Purpose: Check this condition before choosing which branch should run.
      if (!storedToken || !Number.isFinite(storedExpiresAt) || storedExpiresAt <= Date.now() + 15000) {
        // Remove stale saved credentials so later checks start from a clean state.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.#clearStoredSession();
        // Report that there is no usable local session.
        // Purpose: Return the result to the code that called this function.
        return null;
      // Purpose: Close this conditional branch.
      }

      // Restore the verified-lifetime token into the private cache for API requests.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#accessToken = storedToken;
      // Keep its expiry deadline in the private cache too.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#expiresAt = storedExpiresAt;
      // Return the token only to internal service methods.
      // Purpose: Return the result to the code that called this function.
      return this.#accessToken;
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Do not claim a local session when the browser blocks access to storage.
      // Purpose: Return the result to the code that called this function.
      return null;
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Forget an access token if Dropbox reports that the token is unauthorized.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #expireSessionOnUnauthorized(status) {
    // Other HTTP errors do not prove that the access token is invalid.
    // Purpose: Check this condition before choosing which branch should run.
    if (status !== 401) return;
    // Remove the rejected token from the private cache.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#accessToken = null;
    // Remove its expiration deadline from the private cache too.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#expiresAt = 0;
    // Remove persisted credentials because Dropbox has rejected this session.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#clearStoredSession();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Send a JSON request to a Dropbox API v2 endpoint.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async #requestJson(endpoint, args = {}) {
    // Get the current private token and reject calls when it is missing or expired.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const token = this.#getActiveAccessToken();
    // Require a completed authorization flow before accessing account or file data.
    // Purpose: Check this condition before choosing which branch should run.
    if (!token) {
      // Give callers a direct instruction instead of making an anonymous request.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new DropboxApiError("Dropbox is not connected. Authorize the app first.");
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Send the arguments as JSON to the requested API endpoint.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const response = await fetch(DROPBOX_CONFIG.apiBaseUrl + endpoint, {
      // Dropbox API v2 write operations use POST requests.
      // Purpose: Set this named property in the surrounding object or configuration.
      method: "POST",
      // Include JSON content type and the private bearer token in request headers.
      // Purpose: Set this named property in the surrounding object or configuration.
      headers: {
        // Purpose: Run this statement as the next step in the surrounding operation.
        "Content-Type": "application/json",
        // Purpose: Set this named property in the surrounding object or configuration.
        Authorization: "Bearer " + token,
      // Purpose: Close the current block, handler, object, or expression.
      },
      // Encode the options as the JSON request body expected by Dropbox.
      // Purpose: Set this named property in the surrounding object or configuration.
      body: JSON.stringify(args),
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Handle any non-success response before returning data to the caller.
    // Purpose: Check this condition before choosing which branch should run.
    if (!response.ok) {
      // Decode the service response into a descriptive error object.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const error = await this.#readErrorResponse(response);
      // Forget the token if Dropbox says it is no longer authorized.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#expireSessionOnUnauthorized(error.status);
      // Keep the original details available to the code calling this method.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw error;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Return null for a successful response that has no body.
    // Purpose: Check this condition before choosing which branch should run.
    if (response.status === 204) return null;
    // Parse and return the JSON result for normal successful responses.
    // Purpose: Return the result to the code that called this function.
    return response.json();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Send file bytes to or from a Dropbox content endpoint.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async #requestContent(endpoint, args, body) {
    // Retrieve the token from this service's private cache or its valid persisted session.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const token = this.#getActiveAccessToken();
    // Require the user to authorize before transferring any content.
    // Purpose: Check this condition before choosing which branch should run.
    if (!token) {
      // Stop before sending file bytes when there is no valid session.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new DropboxApiError("Dropbox is not connected. Authorize the app first.");
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Use the dedicated Dropbox content host for upload and download calls.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const response = await fetch(DROPBOX_CONFIG.contentBaseUrl + endpoint, {
      // Dropbox content endpoints expect POST with metadata in a header.
      // Purpose: Set this named property in the surrounding object or configuration.
      method: "POST",
      // Add the bearer token, binary content type, and encoded request arguments.
      // Purpose: Set this named property in the surrounding object or configuration.
      headers: {
        // Purpose: Set this named property in the surrounding object or configuration.
        Authorization: "Bearer " + token,
        // Purpose: Run this statement as the next step in the surrounding operation.
        "Content-Type": "application/octet-stream",
        // Purpose: Run this statement as the next step in the surrounding operation.
        "Dropbox-API-Arg": this.#headerSafeJson(args),
      // Purpose: Close the current block, handler, object, or expression.
      },
      // Pass the file Blob or null for downloads, matching the endpoint's needs.
      // Purpose: Run this statement as the next step in the surrounding operation.
      body,
    // Purpose: Close the current block, handler, object, or expression.
    });

    // Convert a failed content request into a DropboxApiError.
    // Purpose: Check this condition before choosing which branch should run.
    if (!response.ok) {
      // Read the service's error response before changing local state.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const error = await this.#readErrorResponse(response);
      // Clear the in-memory and persisted token after an unauthorized response.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#expireSessionOnUnauthorized(error.status);
      // Let the caller present the error or retry the operation.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw error;
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Return the raw response so upload metadata or downloaded bytes can be read.
    // Purpose: Return the result to the code that called this function.
    return response;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Validate a Dropbox path while allowing the empty string to represent its root.
  // Purpose: Run this statement as the next step in the surrounding operation.
  #requireDropboxPath(path, { allowRoot = false } = {}) {
    // Reject values that are not text.
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof path !== "string") {
      // Tell the caller which value type the API expects.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError("A Dropbox path must be a string.");
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Dropbox represents its root folder with an empty path.
    // Purpose: Check this condition before choosing which branch should run.
    if (allowRoot && (path === "" || path === "/")) return "";
    // File and folder paths must be absolute and must not end with a slash.
    // Purpose: Check this condition before choosing which branch should run.
    if (!path.startsWith("/") || path === "/" || path.endsWith("/")) {
      // Show the expected format in the error so it is easy to fix.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError("Use an absolute Dropbox file/folder path, e.g. /Documents/report.pdf.");
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Return the checked path for use in the API request.
    // Purpose: Return the result to the code that called this function.
    return path;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Create a URL for OAuth authorization using the PKCE S256 flow.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async createAuthorizationUrl() {
    // Prepare browser storage for the temporary PKCE state and verifier values.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const storage = this.#getStorage();
    // Create a high-entropy verifier that is kept only during the redirect exchange.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const verifier = this.#randomBase64Url(32);
    // Create a separate random state value to bind the response to this request.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const state = this.#randomBase64Url(32);
    // Derive the public S256 challenge from the verifier.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const challenge = await this.#createCodeChallenge(verifier);

    // Store this attempt's state and verifier under state-specific temporary keys.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Save the expected state for matching the redirect callback.
      // Purpose: Run this statement as the next step in the surrounding operation.
      storage.setItem(this.#stateKey(state), state);
      // Save the verifier that Dropbox will require for the code exchange.
      // Purpose: Run this statement as the next step in the surrounding operation.
      storage.setItem(this.#verifierKey(state), verifier);
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Remove either key if storage failed partway through this operation.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#clearPendingOAuth(state);
      // Stop sign-in when the browser cannot retain the temporary PKCE values.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new DropboxApiError("Browser storage could not save the temporary Dropbox sign-in values.");
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Start with the official Dropbox authorization endpoint.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const url = new URL(DROPBOX_CONFIG.oauthAuthorizeUrl);
    // Identify the public Dropbox application.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("client_id", DROPBOX_CONFIG.appKey);
    // Request an authorization code rather than a token in the browser URL.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("response_type", "code");
    // Tell Dropbox exactly where to redirect after authorization.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("redirect_uri", DROPBOX_CONFIG.redirectUri);
    // Send the S256 challenge instead of sending the verifier.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("code_challenge", challenge);
    // Declare which PKCE challenge transformation was used.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("code_challenge_method", "S256");
    // Include state so the callback can match this authorization attempt.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("state", state);
    // Request only the scopes required for the current Dropbox features.
    // Purpose: Run this statement as the next step in the surrounding operation.
    url.searchParams.set("scope", DROPBOX_CONFIG.scopes.join(" "));
    // Return the full URL so the caller can navigate to Dropbox.
    // Purpose: Return the result to the code that called this function.
    return url.href;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Redirect the current tab to Dropbox to begin the authorization flow.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async beginAuthorization() {
    // Build and store the temporary PKCE values before navigating away.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const authorizationUrl = await this.createAuthorizationUrl();
    // Navigate to the URL without opening a separate popup window.
    // Purpose: Run this statement as the next step in the surrounding operation.
    window.location.assign(authorizationUrl);
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Complete the OAuth exchange when Dropbox returns to the configured site URL.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async handleOAuthCallback() {
    // Read the current address to check whether Dropbox has redirected here.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const url = new URL(window.location.href);
    // Read the authorization code supplied after a successful sign-in.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const code = url.searchParams.get("code");
    // Read any error Dropbox returned when authorization could not complete.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
    // Read the state value that should match the pending attempt.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const returnedState = url.searchParams.get("state");

    // Leave normal page loads untouched when there are no OAuth parameters.
    // Purpose: Check this condition before choosing which branch should run.
    if (!code && !oauthError) return null;

    // Access the short-lived PKCE values for this exact callback state.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const storage = this.#getStorage();
    // Look up the saved state only when Dropbox returned one.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const expectedState = returnedState ? storage.getItem(this.#stateKey(returnedState)) : null;
    // Look up the matching verifier only when Dropbox returned one.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const verifier = returnedState ? storage.getItem(this.#verifierKey(returnedState)) : null;

    // Remove the code and state from the visible URL before processing the response.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#removeOAuthParametersFromAddressBar();

    // Always clean up this attempt's PKCE keys, whether the exchange succeeds or fails.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Show a useful error when Dropbox reports that authorization was denied.
      // Purpose: Check this condition before choosing which branch should run.
      if (oauthError) {
        // Avoid trying to exchange a code after an authorization error.
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new DropboxApiError("Dropbox authorization was not completed: " + oauthError);
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Require a matching random state and its verifier to prevent callback mix-ups.
      // Purpose: Check this condition before choosing which branch should run.
      if (!returnedState || expectedState !== returnedState || !verifier) {
        // Ask the user to restart if this browser cannot validate the response.
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new DropboxApiError("Dropbox sign-in could not be verified. Please authorize again.");
      // Purpose: Close the current block, handler, object, or expression.
      }
      // Require a code when the callback has no authorization error.
      // Purpose: Check this condition before choosing which branch should run.
      if (!code) {
        // Reject an incomplete callback instead of making a malformed request.
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new DropboxApiError("Dropbox did not return an authorization code.");
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Prepare the form data required by the token endpoint.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const form = new URLSearchParams({
        // Identify the authorization-code exchange grant.
        // Purpose: Set this named property in the surrounding object or configuration.
        grant_type: "authorization_code",
        // Pass the one-time code returned by Dropbox.
        // Purpose: Run this statement as the next step in the surrounding operation.
        code,
        // Identify the same public application that started authorization.
        // Purpose: Set this named property in the surrounding object or configuration.
        client_id: DROPBOX_CONFIG.appKey,
        // Repeat the exact redirect URI used in the authorization request.
        // Purpose: Set this named property in the surrounding object or configuration.
        redirect_uri: DROPBOX_CONFIG.redirectUri,
        // Prove possession of the verifier associated with the random state.
        // Purpose: Set this named property in the surrounding object or configuration.
        code_verifier: verifier,
      // Purpose: Close the current block, handler, object, or expression.
      });

      // Exchange the code and verifier for a short-lived access token.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const response = await fetch(DROPBOX_CONFIG.oauthTokenUrl, {
        // The OAuth token endpoint expects form-encoded fields.
        // Purpose: Set this named property in the surrounding object or configuration.
        method: "POST",
        // Identify the body as URL-encoded form data.
        // Purpose: Set this named property in the surrounding object or configuration.
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // Convert the fields into the encoded request body.
        // Purpose: Set this named property in the surrounding object or configuration.
        body: form.toString(),
      // Purpose: Close the current block, handler, object, or expression.
      });

      // Convert token endpoint errors into the same consistent error type.
      // Purpose: Check this condition before choosing which branch should run.
      if (!response.ok) throw await this.#readErrorResponse(response);
      // Parse the successful token response returned by Dropbox.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const tokenResult = await response.json();
      // Require an access token before marking this service as connected.
      // Purpose: Check this condition before choosing which branch should run.
      if (!tokenResult?.access_token) {
        // Do not accept incomplete or unexpected token responses.
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new DropboxApiError("Dropbox did not return an access token.");
      // Purpose: Close the current block, handler, object, or expression.
      }

      // Use Dropbox's expiry value, with the same four-hour fallback as the legacy flow.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const expiresIn = Math.max(60, Number(tokenResult.expires_in) || 14400);
      // Keep the token in the private cache used by this service.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#accessToken = tokenResult.access_token;
      // Calculate the short-lived session deadline from Dropbox token metadata.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#expiresAt = Date.now() + expiresIn * 1000;

      // Persist the session using the same access-token keys as the legacy implementation.
      // Purpose: Start a protected operation so a partial storage write cannot leave stale credentials.
      try {
        // Access the browser storage only inside the Dropbox service.
        // Purpose: Declare a variable that stores a value needed by this logic.
        const storage = this.#getStorage();
        // Save the short-lived token so the next page load can restore and verify the session.
        // Purpose: Run this statement as the next step in the surrounding operation.
        storage.setItem(DROPBOX_CONFIG.storageKeys.accessToken, this.#accessToken);
        // Save the expiry deadline beside the token so expired sessions are rejected.
        // Purpose: Run this statement as the next step in the surrounding operation.
        storage.setItem(DROPBOX_CONFIG.storageKeys.expiresAt, String(this.#expiresAt));
      // Purpose: Close the current block, handler, object, or expression.
      } catch {
        // Remove a partial write and clear the current cache if session storage failed.
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.#clearStoredSession();
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.#accessToken = null;
        // Purpose: Run this statement as the next step in the surrounding operation.
        this.#expiresAt = 0;
        // Require a working browser storage session before reporting sign-in as complete.
        // Purpose: Report an invalid input or failed operation to the caller.
        throw new DropboxApiError("Dropbox signed in, but the browser could not save the session. Please authorize again.");
      // Purpose: Close this conditional branch.
      }

      // Return connection metadata without exposing the access token to callers.
      // Purpose: Return the result to the code that called this function.
      return {
        // Tell the caller that the code exchange succeeded.
        // Purpose: Set this named property in the surrounding object or configuration.
        connected: true,
        // Report the token expiration time for UI status if needed.
        // Purpose: Set this named property in the surrounding object or configuration.
        expiresAt: this.#expiresAt,
        // Provide an account identifier when Dropbox includes one.
        // Purpose: Set this named property in the surrounding object or configuration.
        accountId: tokenResult.account_id || null,
      // Purpose: Close the current block, handler, object, or expression.
      };
    // Purpose: Close the current block, handler, object, or expression.
    } finally {
      // Remove the one-time state and verifier as soon as this attempt finishes.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#clearPendingOAuth(returnedState);
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Report whether this service can restore a valid short-lived session locally.
  // Purpose: Run this statement as the next step in the surrounding operation.
  hasLocalSession() {
    // Return a boolean without returning the private token itself.
    // Purpose: Return the result to the code that called this function.
    return Boolean(this.#getActiveAccessToken());
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Check the active connection by requesting the current Dropbox account.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async checkConnection() {
    // Return early when no valid cached or saved short-lived token exists.
    // Purpose: Check this condition before choosing which branch should run.
    if (!this.hasLocalSession()) return { connected: false, account: null };
    // Ask Dropbox to verify the account associated with the current token.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Return both the connection flag and current account information.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const account = await this.getCurrentAccount();
      // A successful account request confirms the connection is active.
      // Purpose: Return the result to the code that called this function.
      return { connected: true, account };
    // Purpose: Close the current block, handler, object, or expression.
    } catch (error) {
      // A 401 response means the connection is no longer authorized.
      // Purpose: Check this condition before choosing which branch should run.
      if (error?.status === 401) return { connected: false, account: null };
      // Other failures should remain visible to the caller.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw error;
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Retrieve account details for the currently authorized Dropbox user.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async getCurrentAccount() {
    // Call the exact Dropbox API v2 endpoint used by the legacy service.
    // Purpose: Return the result to the code that called this function.
    return this.#requestJson("/users/get_current_account", {});
  // Purpose: Close the current block, handler, object, or expression.
  }

  // List one folder, with an empty path representing the account's root folder.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async listFolder({
    // Start from the root unless the caller specifies another path.
    // Purpose: Run this statement as the next step in the surrounding operation.
    path = "",
    // Keep nested-folder traversal optional by default.
    // Purpose: Run this statement as the next step in the surrounding operation.
    recursive = false,
    // Use Dropbox's normal upper bound for folder result batches.
    // Purpose: Run this statement as the next step in the surrounding operation.
    limit = 1000,
    // Exclude deleted entries unless the caller requests them.
    // Purpose: Run this statement as the next step in the surrounding operation.
    includeDeleted = false,
  // Purpose: Close the current block, handler, object, or expression.
  } = {}) {
    // Convert an accepted root slash into the empty path expected by Dropbox.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const folderPath = path === "" || path === "/" ? "" : this.#requireDropboxPath(path);
    // Clamp the requested result count to Dropbox's supported range.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const safeLimit = Math.max(1, Math.min(2000, Math.floor(Number(limit) || 1000)));
    // Ask Dropbox for the requested folder entries and paging cursor.
    // Purpose: Return the result to the code that called this function.
    return this.#requestJson("/files/list_folder", {
      // Supply the validated path, with the empty string for root.
      // Purpose: Set this named property in the surrounding object or configuration.
      path: folderPath,
      // Send the recursive option as a consistent boolean.
      // Purpose: Set this named property in the surrounding object or configuration.
      recursive: Boolean(recursive),
      // Send the include-deleted option as a consistent boolean.
      // Purpose: Set this named property in the surrounding object or configuration.
      include_deleted: Boolean(includeDeleted),
      // Keep the result count inside the allowed range.
      // Purpose: Set this named property in the surrounding object or configuration.
      limit: safeLimit,
    // Purpose: Close the current block, handler, object, or expression.
    });
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Fetch every page of a folder listing until Dropbox has no remaining entries.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async listAllFolderEntries(options = {}) {
    // Request the first page using the same options as listFolder.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let page = await this.listFolder(options);
    // Copy the first page's entries so the returned array can be built safely.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const entries = [...(page.entries || [])];

    // Continue while Dropbox reports more entries and gives us a cursor.
    // Purpose: Repeat the operation while its condition remains true.
    while (page.has_more && page.cursor) {
      // Request the next batch with the cursor returned by Dropbox.
      // Purpose: Wait for the asynchronous operation to finish before continuing.
      page = await this.#requestJson("/files/list_folder/continue", { cursor: page.cursor });
      // Add all entries from this page to the combined result.
      // Purpose: Run this statement as the next step in the surrounding operation.
      entries.push(...(page.entries || []));
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Return a flat array with all entries collected from the folder.
    // Purpose: Return the result to the code that called this function.
    return entries;
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Download the binary contents and metadata of a file or file ID.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async downloadFile(pathOrId) {
    // Reject empty or non-text file identifiers before making a network request.
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof pathOrId !== "string" || !pathOrId.trim()) {
      // Tell the caller that a Dropbox path or ID is required.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError("downloadFile expects a Dropbox path or file ID.");
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Allow Dropbox file IDs while validating normal absolute file paths.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const path = pathOrId.startsWith("id:") ? pathOrId : this.#requireDropboxPath(pathOrId);
    // Ask the content endpoint to return the file's bytes.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const response = await this.#requestContent("/files/download", { path }, null);
    // Dropbox puts file metadata in this response header.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const resultHeader = response.headers.get("Dropbox-API-Result");
    // Start with no metadata in case the header is absent or malformed.
    // Purpose: Declare a variable that stores a value needed by this logic.
    let metadata = null;
    // Parse the metadata header only when Dropbox supplied one.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Store the decoded file details for the caller.
      // Purpose: Run this statement as the next step in the surrounding operation.
      metadata = resultHeader ? JSON.parse(resultHeader) : null;
    // Purpose: Close the current block, handler, object, or expression.
    } catch {
      // Still allow the download if optional metadata cannot be parsed.
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Return the downloaded bytes and any metadata as a single result.
    // Purpose: Return the result to the code that called this function.
    return { blob: await response.blob(), metadata };
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Upload a new file or replace a file at the specified Dropbox path.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async uploadFile({
    // Require the caller to choose the destination path.
    // Purpose: Run this statement as the next step in the surrounding operation.
    path,
    // Accept a File or Blob containing the bytes to upload.
    // Purpose: Run this statement as the next step in the surrounding operation.
    file,
    // Add a new file by default to avoid accidental replacement.
    // Purpose: Run this statement as the next step in the surrounding operation.
    mode = "add",
    // Do not rename duplicate files unless the caller asks.
    // Purpose: Run this statement as the next step in the surrounding operation.
    autorename = false,
    // Keep Dropbox notifications quiet unless requested otherwise.
    // Purpose: Run this statement as the next step in the surrounding operation.
    mute = false,
  // Purpose: Close the current block, handler, object, or expression.
  } = {}) {
    // Validate the destination as an absolute Dropbox file path.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const destination = this.#requireDropboxPath(path);
    // Require binary data so the content request has a supported body.
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof Blob === "undefined" || !(file instanceof Blob)) {
      // Explain the accepted content types to the caller.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError("file must be a File, Blob, or another Blob-compatible value.");
    // Purpose: Close the current block, handler, object, or expression.
    }
    // Limit upload modes to the two explicit options supported by this method.
    // Purpose: Check this condition before choosing which branch should run.
    if (!["add", "overwrite"].includes(mode)) {
      // Keep revision-aware updates in the dedicated saveEditedFile method.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError('uploadFile mode must be "add" or "overwrite". Use saveEditedFile() for revision-aware updates.');
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Send the file bytes with the destination and mode in Dropbox-API-Arg.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const response = await this.#requestContent("/files/upload", {
      // Tell Dropbox where to create or replace the file.
      // Purpose: Set this named property in the surrounding object or configuration.
      path: destination,
      // Choose whether to add the file or replace the path's current contents.
      // Purpose: Run this statement as the next step in the surrounding operation.
      mode,
      // Convert the duplicate-name preference to a boolean.
      // Purpose: Set this named property in the surrounding object or configuration.
      autorename: Boolean(autorename),
      // Convert the notification preference to a boolean.
      // Purpose: Set this named property in the surrounding object or configuration.
      mute: Boolean(mute),
    // Purpose: Close the current block, handler, object, or expression.
    }, file);

    // Return the metadata describing the uploaded file.
    // Purpose: Return the result to the code that called this function.
    return response.json();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Save edited bytes back to the original path with optional revision protection.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async saveEditedFile({
    // Use the original path so edits replace the selected source file.
    // Purpose: Run this statement as the next step in the surrounding operation.
    originalPath,
    // Receive the new file bytes produced by the editor.
    // Purpose: Run this statement as the next step in the surrounding operation.
    content,
    // Use a revision when provided to prevent overwriting newer edits.
    // Purpose: Run this statement as the next step in the surrounding operation.
    originalRevision = null,
    // Allow callers to silence Dropbox notifications explicitly.
    // Purpose: Run this statement as the next step in the surrounding operation.
    mute = false,
  // Purpose: Close the current block, handler, object, or expression.
  } = {}) {
    // Validate the original path before uploading the edited bytes.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const destination = this.#requireDropboxPath(originalPath);
    // Require a Blob because edited documents must be uploaded as binary data.
    // Purpose: Check this condition before choosing which branch should run.
    if (typeof Blob === "undefined" || !(content instanceof Blob)) {
      // Give the caller a clear error when the content has the wrong type.
      // Purpose: Report an invalid input or failed operation to the caller.
      throw new TypeError("content must be a Blob containing the edited file bytes.");
    // Purpose: Close the current block, handler, object, or expression.
    }

    // Match a particular revision when possible to protect concurrent edits.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const mode = originalRevision
      // Purpose: Run this statement as the next step in the surrounding operation.
      ? { ".tag": "update", update: originalRevision }
      // Otherwise explicitly replace the selected original path.
      // Purpose: Run this statement as the next step in the surrounding operation.
      : { ".tag": "overwrite" };

    // Upload to Dropbox using the revision-aware or overwrite mode.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const response = await this.#requestContent("/files/upload", {
      // Keep the original location as the save destination.
      // Purpose: Set this named property in the surrounding object or configuration.
      path: destination,
      // Use the selected revision policy for this save operation.
      // Purpose: Run this statement as the next step in the surrounding operation.
      mode,
      // Do not silently rename an edited copy to a different filename.
      // Purpose: Set this named property in the surrounding object or configuration.
      autorename: false,
      // Respect the caller's notification preference.
      // Purpose: Set this named property in the surrounding object or configuration.
      mute: Boolean(mute),
    // Purpose: Close the current block, handler, object, or expression.
    }, content);

    // Return the revision and metadata of the newly saved file.
    // Purpose: Return the result to the code that called this function.
    return response.json();
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Revoke the current Dropbox token and clear cached and persisted session details.
  // Purpose: Run this statement as the next step in the surrounding operation.
  async revokeToken() {
    // Keep a local reference only long enough to send the revoke request.
    // Purpose: Declare a variable that stores a value needed by this logic.
    const token = this.#getActiveAccessToken();
    // Clear this session regardless of whether the remote request succeeds.
    // Purpose: Start a protected operation so failures can be handled cleanly.
    try {
      // Report that there was no active connection to revoke when no token exists.
      // Purpose: Check this condition before choosing which branch should run.
      if (!token) return { revoked: false, reason: "no-active-token" };

      // Ask the official Dropbox API v2 endpoint to revoke this bearer token.
      // Purpose: Declare a variable that stores a value needed by this logic.
      const response = await fetch(DROPBOX_CONFIG.apiBaseUrl + "/auth/token/revoke", {
        // Revoke operations use POST and do not require a request body.
        // Purpose: Set this named property in the surrounding object or configuration.
        method: "POST",
        // Authorize the revocation with the token kept in memory.
        // Purpose: Set this named property in the surrounding object or configuration.
        headers: { Authorization: "Bearer " + token },
      // Purpose: Close the current block, handler, object, or expression.
      });

      // Pass remote errors back to the caller rather than hiding them.
      // Purpose: Check this condition before choosing which branch should run.
      if (!response.ok) throw await this.#readErrorResponse(response);
      // Report the successful remote revocation.
      // Purpose: Return the result to the code that called this function.
      return { revoked: true };
    // Purpose: Close the current block, handler, object, or expression.
    } finally {
      // Forget the active token even when the revoke endpoint returns an error.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#accessToken = null;
      // Forget the token deadline so the old session cannot be reused.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#expiresAt = 0;
      // Remove the persisted session so refresh cannot restore a disconnected account.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#clearStoredSession();
      // Remove any unfinished PKCE state and verifier values.
      // Purpose: Run this statement as the next step in the surrounding operation.
      this.#clearPendingOAuth();
    // Purpose: Close the current block, handler, object, or expression.
    }
  // Purpose: Close the current block, handler, object, or expression.
  }

  // Clear the in-memory connection, persisted session, and temporary authorization attempt.
  // Purpose: Run this statement as the next step in the surrounding operation.
  clearSession() {
    // Forget the private access-token cache before removing the persisted session.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#accessToken = null;
    // Reset its expiry deadline at the same time.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#expiresAt = 0;
    // Remove the saved short-lived session as well as any pending PKCE values.
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#clearStoredSession();
    // Purpose: Run this statement as the next step in the surrounding operation.
    this.#clearPendingOAuth();
  // Purpose: Close the current block, handler, object, or expression.
  }
// Purpose: Close the current block, handler, object, or expression.
}

// Create one shared service instance so every module uses the same private token.
// Purpose: Declare a variable that stores a value needed by this logic.
const dropboxApi = new DropboxApi();

// Export the singleton with the requested name for named imports.
// Purpose: Run this statement as the next step in the surrounding operation.
export { dropboxApi as DropboxApi };

// Also provide the same singleton as the default export for simpler imports.
// Purpose: Run this statement as the next step in the surrounding operation.
export default dropboxApi;
