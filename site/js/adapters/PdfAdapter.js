// Import EventBus so this module can listen for file requests and notify other modules.
// Purpose: Connect this module to the other application modules.
import EventBus from "../core/EventBus.js";
// Import Store so the requested Full or Split layout becomes visible before rendering.
// Purpose: Connect this module to the other application modules.
import Store from "../core/Store.js";

/*
 * Lux Omni PDF editor adapter.
 * Uses the pinned Mozilla PDF.js distribution and viewer components.
 * PDF.js assets are loaded only when a PDF is opened.
 */
// Purpose: Store the value needed by the following logic.
const PDFJS_VERSION = "6.4.299";
// Purpose: Store the value needed by the following logic.
const PDFJS_BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + PDFJS_VERSION;
// Purpose: Store the value needed by the following logic.
const PDFJS_VIEWER_STYLESHEET = PDFJS_BASE + "/web/pdf_viewer.css";

// Purpose: Store the value needed by the following logic.
let pdfjsModulesPromise = null;
// Purpose: Store the value needed by the following logic.
const stylesheetPromises = new WeakMap();

// Purpose: Define a reusable operation for the PDF viewing workflow.
function ensureViewerStylesheet(shadowRoot) {
  // Purpose: Store the value needed by the following logic.
  const existingPromise = stylesheetPromises.get(shadowRoot);
  // Purpose: Check this condition before continuing.
  if (existingPromise) return existingPromise;

  // Purpose: Store the value needed by the following logic.
  const stylesheetUrls = [
    // Purpose: Run this statement as the next step in the PDF workflow.
    { url: PDFJS_VIEWER_STYLESHEET, attribute: "data-lux-pdfjs-stylesheet" },
    // Purpose: Run this statement as the next step in the PDF workflow.
    { url: new URL("../../components/pdf-editor.css", import.meta.url).href, attribute: "data-lux-pdf-editor-stylesheet" }
  // Purpose: Run this statement as the next step in the PDF workflow.
  ];
  // Purpose: Store the value needed by the following logic.
  let links = [];
  // Purpose: Store the value needed by the following logic.
  const promise = new Promise((resolve, reject) => {
    // Purpose: Store the value needed by the following logic.
    let remaining = stylesheetUrls.length;
    // Purpose: Store the value needed by the following logic.
    let settled = false;
    // Purpose: Store the value needed by the following logic.
    const fail = () => {
      // Purpose: Check this condition before continuing.
      if (settled) return;
      // Purpose: Run this statement as the next step in the PDF workflow.
      settled = true;
      // Purpose: Repeat this step for each item in the collection.
      for (const link of links) link.remove();
      // Purpose: Run this statement as the next step in the PDF workflow.
      stylesheetPromises.delete(shadowRoot);
      // Purpose: Run this statement as the next step in the PDF workflow.
      reject(new Error("PDF editor styles could not be loaded into the isolated viewer."));
    // Purpose: Close the current block or callback.
    };

    // Purpose: Repeat this step for each item in the collection.
    for (const item of stylesheetUrls) {
      // Purpose: Store the value needed by the following logic.
      const link = document.createElement("link");
      // Purpose: Run this statement as the next step in the PDF workflow.
      link.rel = "stylesheet";
      // Purpose: Run this statement as the next step in the PDF workflow.
      link.href = item.url;
      // Purpose: Run this statement as the next step in the PDF workflow.
      link.setAttribute(item.attribute, "true");
      // Purpose: Register a handler for this user or viewer event.
      link.addEventListener("load", () => {
        // Purpose: Run this statement as the next step in the PDF workflow.
        remaining -= 1;
        // Purpose: Check this condition before continuing.
        if (remaining === 0 && !settled) {
          // Purpose: Run this statement as the next step in the PDF workflow.
          settled = true;
          // Purpose: Run this statement as the next step in the PDF workflow.
          resolve();
        // Purpose: Close the current block or callback.
        }
      // Purpose: Close the current block or callback.
      }, { once: true });
      // Purpose: Register a handler for this user or viewer event.
      link.addEventListener("error", fail, { once: true });
      // Purpose: Run this statement as the next step in the PDF workflow.
      links.push(link);
      // Purpose: Run this statement as the next step in the PDF workflow.
      shadowRoot.append(link);
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  });
  // Purpose: Run this statement as the next step in the PDF workflow.
  stylesheetPromises.set(shadowRoot, promise);
  // Purpose: Return the result to the caller.
  return promise;
// Purpose: Close the current block or callback.
}

// Purpose: Define a reusable operation for the PDF viewing workflow.
function loadPdfJsModules() {
  // Purpose: Check this condition before continuing.
  if (!pdfjsModulesPromise) {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfjsModulesPromise = (async () => {
      // Purpose: Wait for the asynchronous operation before continuing.
      const pdfjsLib = await import(PDFJS_BASE + "/build/pdf.mjs");
      // The distribution viewer components read the public core API from this namespace.
      // Assign it before importing the viewer module; parallel imports can race during module evaluation.
      // Purpose: Run this statement as the next step in the PDF workflow.
      globalThis.pdfjsLib = pdfjsLib;
      // Purpose: Wait for the asynchronous operation before continuing.
      const pdfjsViewer = await import(PDFJS_BASE + "/web/pdf_viewer.mjs");
      // Purpose: Check this condition before continuing.
      if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
        // Purpose: Report an error to the calling operation.
        throw new Error("The pinned Mozilla PDF.js build did not expose the viewer APIs Lux Omni requires.");
      // Purpose: Close the current block or callback.
      }
      // Purpose: Run this statement as the next step in the PDF workflow.
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + "/build/pdf.worker.mjs";
      // Purpose: Return the result to the caller.
      return { pdfjsLib, pdfjsViewer };
    // Purpose: Close the current block or callback.
    })().catch((error) => {
      // Purpose: Run this statement as the next step in the PDF workflow.
      pdfjsModulesPromise = null;
      // Purpose: Report an error to the calling operation.
      throw error;
    // Purpose: Close the current block or callback.
    });
  // Purpose: Close the current block or callback.
  }
  // Purpose: Return the result to the caller.
  return pdfjsModulesPromise;
// Purpose: Close the current block or callback.
}

// Create a recognizable cancellation error when a newer file replaces a pending PDF.
// Purpose: Define a reusable operation for the PDF viewing workflow.
function createAbortError() {
  // Make the cancellation look like a normal Error in all supported browsers.
  // Purpose: Store the value needed by the following logic.
  const error = new Error("This PDF request was replaced by a newer file request.");
  // Give callers a stable name so expected cancellation is not reported as a failure.
  // Purpose: Run this statement as the next step in the PDF workflow.
  error.name = "AbortError";
  // Return the error to the async renderer.
  // Purpose: Return the result to the caller.
  return error;
// Purpose: Close the current block or callback.
}

// Purpose: Define a reusable operation for the PDF viewing workflow.
function createElement(tag, className, text) {
  // Purpose: Store the value needed by the following logic.
  const element = document.createElement(tag);
  // Purpose: Check this condition before continuing.
  if (className) element.className = className;
  // Purpose: Check this condition before continuing.
  if (text !== undefined) element.textContent = text;
  // Purpose: Return the result to the caller.
  return element;
// Purpose: Close the current block or callback.
}

// Purpose: Define a reusable operation for the PDF viewing workflow.
function createToolbarButton(label, title, command, className = "") {
  // Purpose: Store the value needed by the following logic.
  const button = createElement("button", "lux-pdf-tool " + className, label);
  // Purpose: Run this statement as the next step in the PDF workflow.
  button.type = "button";
  // Purpose: Run this statement as the next step in the PDF workflow.
  button.title = title;
  // Purpose: Run this statement as the next step in the PDF workflow.
  button.setAttribute("aria-label", title);
  // Purpose: Run this statement as the next step in the PDF workflow.
  button.dataset.pdfCommand = command;
  // Purpose: Run this statement as the next step in the PDF workflow.
  button.setAttribute("aria-pressed", "false");
  // Purpose: Return the result to the caller.
  return button;
// Purpose: Close the current block or callback.
}

// Purpose: Define a reusable operation for the PDF viewing workflow.
function normalizePdfName(name) {
  // Purpose: Store the value needed by the following logic.
  const cleaned = String(name || "document.pdf").replace(/[\\/:*?"<>|]+/g, "_");
  // Purpose: Return the result to the caller.
  return /\.pdf$/i.test(cleaned) ? cleaned : cleaned + ".pdf";
// Purpose: Close the current block or callback.
}

// Purpose: Define a reusable operation in the PDF viewing workflow.
async function mountPdfEditor({ root, blob, fileName, viewportType, onDirty, onEdited, isCurrent = () => true }) {
  // Purpose: Check this condition before continuing.
  if (!(blob instanceof Blob)) throw new TypeError("PDF.js needs a PDF Blob.");

  // Apply the host class whose complete presentation is defined in the component stylesheet.
  // Purpose: Run this statement as the next step in the PDF workflow.
  root.classList.add("lux-pdf-editor-root");

  // PDF.js ships generic selectors such as ".sidebar". Keep all viewer CSS and
  // its imported stylesheets inside an open Shadow DOM so they cannot restyle Lux Omni.
  // Purpose: Store the value needed by the following logic.
  const shadowRoot = root.shadowRoot || root.attachShadow({ mode: "open" });
  // Purpose: Run this statement as the next step in the PDF workflow.
  root.replaceChildren();
  // Purpose: Run this statement as the next step in the PDF workflow.
  shadowRoot.replaceChildren();
  // Purpose: Wait for asynchronous work to finish before continuing.
  await ensureViewerStylesheet(shadowRoot);
  // Stop when another request replaced this document during stylesheet loading.
  if (!isCurrent()) throw createAbortError();
  // Load Mozilla PDF.js modules only after the external viewer stylesheets are ready.
  const modules = await loadPdfJsModules();
  // Avoid constructing detached viewer controls for an out-of-date request.
  if (!isCurrent()) throw createAbortError();
  // Purpose: Store the value that the following logic needs.
  const pdfjsLib = modules.pdfjsLib;
  // Purpose: Store the value that the following logic needs.
  const pdfjsViewer = modules.pdfjsViewer;
  // Purpose: Store the value that the following logic needs.
  const AnnotationEditorType = pdfjsLib.AnnotationEditorType || pdfjsViewer.AnnotationEditorType;
  // Purpose: Check this condition before continuing.
  if (!AnnotationEditorType || AnnotationEditorType.HIGHLIGHT === undefined ||
      // Purpose: Run this statement as the next step in the PDF workflow.
      AnnotationEditorType.FREETEXT === undefined || AnnotationEditorType.INK === undefined) {
    // Purpose: Report an error to the calling operation.
    throw new Error("This Mozilla PDF.js build does not expose the annotation tools Lux Omni requires.");
  // Purpose: Close the current block or callback.
  }

  // Purpose: Store the value needed by the following logic.
  const shell = createElement("section", "lux-pdf-editor");
  // Purpose: Run this statement as the next step in the PDF workflow.
  shell.setAttribute("aria-label", "PDF editor");
  // Purpose: Store the value needed by the following logic.
  const toolbar = createElement("div", "lux-pdf-toolbar");
  // Purpose: Run this statement as the next step in the PDF workflow.
  toolbar.setAttribute("role", "toolbar");
  // Purpose: Run this statement as the next step in the PDF workflow.
  toolbar.setAttribute("aria-label", "PDF navigation and annotation tools");

  // Purpose: Store the value needed by the following logic.
  const toolGroup = createElement("div", "lux-pdf-toolbar-group");
  // Purpose: Run this statement as the next step in the PDF workflow.
  toolGroup.setAttribute("role", "group");
  // Purpose: Run this statement as the next step in the PDF workflow.
  toolGroup.setAttribute("aria-label", "Annotation tools");
  // Purpose: Store the value that the following logic needs.
  const tools = [
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["↖", "Select text and links", "select"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["✋", "Hand tool: drag to pan", "hand"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["▰", "Highlight selected text", "highlight"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["✎", "Freehand pen", "pen"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["T", "Add free text", "text"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["▣", "Add a stamp", "stamp"],
    // Purpose: Run this statement as the next step in the PDF workflow.
    ["✍", "Add a signature", "signature"]
  // Purpose: Run this statement as the next step in the PDF workflow.
  ];
  // Purpose: Store the value that the following logic needs.
  const toolButtons = new Map();
  // Purpose: Repeat this step for each item in the collection.
  for (const item of tools) {
    // Purpose: Store the value that the following logic needs.
    const button = createToolbarButton(item[0], item[1], item[2]);
    // Purpose: Run this statement as the next step in the PDF workflow.
    toolButtons.set(item[2], button);
    // Purpose: Run this statement as the next step in the PDF workflow.
    toolGroup.append(button);
  // Purpose: Close the current block or callback.
  }

  // Purpose: Store the value needed by the following logic.
  const pageGroup = createElement("div", "lux-pdf-toolbar-group lux-pdf-page-controls");
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageGroup.setAttribute("role", "group");
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageGroup.setAttribute("aria-label", "Page navigation");
  // Purpose: Store the value needed by the following logic.
  const previousButton = createToolbarButton("‹", "Previous page", "previous");
  // Purpose: Store the value needed by the following logic.
  const pageInput = createElement("input", "lux-pdf-page-input");
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageInput.type = "number";
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageInput.min = "1";
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageInput.value = "1";
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageInput.setAttribute("aria-label", "Current PDF page");
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageInput.title = "Current page";
  // Purpose: Store the value needed by the following logic.
  const pageCount = createElement("span", "lux-pdf-page-count", "of —");
  // Purpose: Store the value needed by the following logic.
  const nextButton = createToolbarButton("›", "Next page", "next");
  // Purpose: Run this statement as the next step in the PDF workflow.
  pageGroup.append(previousButton, pageInput, pageCount, nextButton);

  // Purpose: Store the value needed by the following logic.
  const zoomGroup = createElement("div", "lux-pdf-toolbar-group lux-pdf-zoom-controls");
  // Purpose: Run this statement as the next step in the PDF workflow.
  zoomGroup.setAttribute("role", "group");
  // Purpose: Run this statement as the next step in the PDF workflow.
  zoomGroup.setAttribute("aria-label", "Zoom and rotation");
  // Purpose: Store the value needed by the following logic.
  const zoomOutButton = createToolbarButton("−", "Zoom out", "zoom-out");
  // Purpose: Store the value needed by the following logic.
  const zoomValue = createElement("span", "lux-pdf-zoom-value", "Fit width");
  // Purpose: Store the value needed by the following logic.
  const zoomInButton = createToolbarButton("+", "Zoom in", "zoom-in");
  // Purpose: Store the value needed by the following logic.
  const fitButton = createToolbarButton("↔", "Fit page width", "fit-width");
  // Purpose: Store the value needed by the following logic.
  const rotateButton = createToolbarButton("↻", "Rotate clockwise", "rotate");
  // Purpose: Run this statement as the next step in the PDF workflow.
  zoomGroup.append(zoomOutButton, zoomValue, zoomInButton, fitButton, rotateButton);

  // Purpose: Store the value needed by the following logic.
  const searchGroup = createElement("div", "lux-pdf-toolbar-group lux-pdf-search-controls");
  // Purpose: Run this statement as the next step in the PDF workflow.
  searchGroup.setAttribute("role", "search");
  // Purpose: Store the value needed by the following logic.
  const searchInput = createElement("input", "lux-pdf-search-input");
  // Purpose: Run this statement as the next step in the PDF workflow.
  searchInput.type = "search";
  // Purpose: Run this statement as the next step in the PDF workflow.
  searchInput.placeholder = "Find in PDF";
  // Purpose: Run this statement as the next step in the PDF workflow.
  searchInput.setAttribute("aria-label", "Find text in this PDF");
  // Purpose: Store the value needed by the following logic.
  const searchPreviousButton = createToolbarButton("↑", "Previous search result", "find-previous");
  // Purpose: Store the value needed by the following logic.
  const searchNextButton = createToolbarButton("↓", "Next search result", "find-next");
  // Purpose: Run this statement as the next step in the PDF workflow.
  searchGroup.append(searchInput, searchPreviousButton, searchNextButton);

  // Purpose: Store the value needed by the following logic.
  const saveGroup = createElement("div", "lux-pdf-toolbar-group lux-pdf-save-controls");
  // Purpose: Run this statement as the next step in the PDF workflow.
  saveGroup.setAttribute("role", "group");
  // Purpose: Run this statement as the next step in the PDF workflow.
  saveGroup.setAttribute("aria-label", "Export PDF");
  // Purpose: Store the value needed by the following logic.
  const downloadButton = createToolbarButton("↓ Save PDF", "Download a copy of the current PDF including supported edits", "download", "lux-pdf-save-button");
  // Purpose: Run this statement as the next step in the PDF workflow.
  saveGroup.append(downloadButton);

  // Purpose: Store the value needed by the following logic.
  const status = createElement("span", "lux-pdf-status", "Loading PDF…");
  // Purpose: Run this statement as the next step in the PDF workflow.
  status.setAttribute("role", "status");
  // Purpose: Run this statement as the next step in the PDF workflow.
  status.setAttribute("aria-live", "polite");
  // Purpose: Run this statement as the next step in the PDF workflow.
  toolbar.append(toolGroup, pageGroup, zoomGroup, searchGroup, saveGroup, status);

  // Purpose: Store the value needed by the following logic.
  const viewerFrame = createElement("div", "lux-pdf-viewer-frame");
  // Purpose: Store the value needed by the following logic.
  const scrollContainer = createElement("div", "lux-pdf-viewer-container");
  // Purpose: Run this statement as the next step in the PDF workflow.
  scrollContainer.tabIndex = 0;
  // Purpose: Run this statement as the next step in the PDF workflow.
  scrollContainer.setAttribute("aria-label", "PDF pages");
  // Purpose: Store the value needed by the following logic.
  const pages = createElement("div", "pdfViewer");
  // Purpose: Run this statement as the next step in the PDF workflow.
  scrollContainer.append(pages);
  // Purpose: Run this statement as the next step in the PDF workflow.
  viewerFrame.append(scrollContainer);
  // Purpose: Run this statement as the next step in the PDF workflow.
  shell.append(toolbar, viewerFrame);
  // Attach the viewer shell so the browser can calculate styles within its Shadow DOM.
  // Purpose: Ensure the PDF.js container exists in the rendered document tree before initialization.
  shadowRoot.append(shell);
  // Wait one rendering frame so external stylesheets and computed layout are ready for PDF.js.
  // Purpose: Allow the browser to apply the absolute-position rule before PDFViewer checks it.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  // Read the computed position instead of assuming the component stylesheet applied correctly.
  // Purpose: Validate the container requirement before constructing PDF.js's viewer.
  const containerPosition = getComputedStyle(scrollContainer).position;
  // Stop with a targeted diagnostic if an asset path or CSS regression leaves the container unpositioned.
  // Purpose: Explain the actual setup failure before PDF.js throws its generic container error.
  if (containerPosition !== "absolute") throw new Error("PDF viewer CSS did not apply position: absolute to its page container.");

  // Purpose: Store the value that the following logic needs.
  const eventBus = new pdfjsViewer.EventBus();
  // Purpose: Store the value that the following logic needs.
  const linkService = new pdfjsViewer.PDFLinkService({ eventBus });
  // Purpose: Store the value that the following logic needs.
  const findController = new pdfjsViewer.PDFFindController({ eventBus, linkService });
  // Purpose: Store the value that the following logic needs.
  const pdfViewer = new pdfjsViewer.PDFViewer({
    // Purpose: Set this property in the surrounding object.
    container: scrollContainer,
    // Purpose: Set this property in the surrounding object.
    viewer: pages,
    // Purpose: Run this statement as the next step in the PDF workflow.
    eventBus,
    // Purpose: Run this statement as the next step in the PDF workflow.
    linkService,
    // Purpose: Run this statement as the next step in the PDF workflow.
    findController,
    // Purpose: Set this property in the surrounding object.
    textLayerMode: 2,
    // Purpose: Set this property in the surrounding object.
    annotationMode: pdfjsLib.AnnotationMode ? pdfjsLib.AnnotationMode.ENABLE_FORMS : 2,
    // Purpose: Set this property in the surrounding object.
    annotationEditorMode: AnnotationEditorType.NONE,
    // Purpose: Set this property in the surrounding object.
    enableScripting: false
  // Purpose: Close the current block or callback.
  });
  // Purpose: Run this statement as the next step in the PDF workflow.
  linkService.setViewer(pdfViewer);

  // Purpose: Store the value that the following logic needs.
  let pdfDocument = null;
  // Purpose: Store the value that the following logic needs.
  let loadingTask = null;
  // Purpose: Store the value that the following logic needs.
  let disposed = false;
  // Purpose: Store the value that the following logic needs.
  let dirty = false;
  // Purpose: Store the value that the following logic needs.
  let handMode = false;
  // Purpose: Store the value that the following logic needs.
  let dragging = null;
  // Purpose: Store the value that the following logic needs.
  let searchCount = 0;

  // Purpose: Define a reusable operation for the PDF viewing workflow.
  function setStatus(message, state = "") {
    // Purpose: Run this statement as the next step in the PDF workflow.
    status.textContent = message;
    // Purpose: Update the element's accessible or data state.
    status.dataset.state = state;
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function markDirty() {
    // Purpose: Check this condition before continuing.
    if (disposed || dirty) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    dirty = true;
    // Purpose: Run this statement as the next step in the PDF workflow.
    setStatus("Unsaved changes", "dirty");
    // Purpose: Run this statement as the next step in the PDF workflow.
    onDirty?.();
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function setActiveTool(tool) {
    // Purpose: Repeat this step for each item in the collection.
    for (const [name, button] of toolButtons) {
      // Purpose: Store the value that the following logic needs.
      const active = name === tool;
      // Purpose: Run this statement as the next step in the PDF workflow.
      button.classList.toggle("is-active", active);
      // Purpose: Run this statement as the next step in the PDF workflow.
      button.setAttribute("aria-pressed", String(active));
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function setHandMode(active) {
    // Purpose: Run this statement as the next step in the PDF workflow.
    handMode = active;
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.classList.toggle("is-hand-tool", active);
    // Purpose: Store the value needed by the following logic.
    const button = toolButtons.get("hand");
    // Purpose: Run this statement as the next step in the PDF workflow.
    button.classList.toggle("is-active", active);
    // Purpose: Run this statement as the next step in the PDF workflow.
    button.setAttribute("aria-pressed", String(active));
    // Purpose: Check this condition before continuing.
    if (active) {
      // Purpose: Repeat this step for each item in the collection.
      for (const [name, item] of toolButtons) {
        // Purpose: Check this condition before continuing.
        if (name !== "hand") {
          // Purpose: Run this statement as the next step in the PDF workflow.
          item.classList.remove("is-active");
          // Purpose: Run this statement as the next step in the PDF workflow.
          item.setAttribute("aria-pressed", "false");
        // Purpose: Close the current block or callback.
        }
      // Purpose: Close the current block or callback.
      }
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("Hand tool active — drag the page to pan", "ready");
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function setEditorMode(mode, toolName) {
    // Purpose: Run this statement as the next step in the PDF workflow.
    setHandMode(false);
    // Purpose: Store the value that the following logic needs.
    const chosenMode = AnnotationEditorType[mode];
    // Purpose: Check this condition before continuing.
    if (chosenMode === undefined) {
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("This annotation tool is not available in the loaded PDF.js build.", "error");
      // Purpose: Return the result to the code that called this operation.
      return;
    // Purpose: Close the current block or callback.
    }
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.annotationEditorMode = { mode: chosenMode };
    // Purpose: Run this statement as the next step in the PDF workflow.
    setActiveTool(toolName);
    // Purpose: Store the value that the following logic needs.
    const messages = {
      // Purpose: Set this property in the surrounding object.
      NONE: "Text selection active",
      // Purpose: Set this property in the surrounding object.
      HIGHLIGHT: "Highlight tool active — select text to highlight",
      // Purpose: Set this property in the surrounding object.
      INK: "Pen tool active — draw on the page",
      // Purpose: Set this property in the surrounding object.
      FREETEXT: "Text tool active — click the page to add text",
      // Purpose: Set this property in the surrounding object.
      STAMP: "Stamp tool active",
      // Purpose: Set this property in the surrounding object.
      SIGNATURE: "Signature tool active"
    // Purpose: Close the current block or callback.
    };
    // Purpose: Run this statement as the next step in the PDF workflow.
    setStatus(messages[mode] || "Annotation tool active", "ready");
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function renderPageState() {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pageInput.max = String(pdfViewer.pagesCount || 1);
    // Purpose: Run this statement as the next step in the PDF workflow.
    pageInput.value = String(pdfViewer.currentPageNumber || 1);
    // Purpose: Run this statement as the next step in the PDF workflow.
    pageCount.textContent = "of " + (pdfViewer.pagesCount || "—");
    // Purpose: Run this statement as the next step in the PDF workflow.
    previousButton.disabled = !pdfViewer.pagesCount || pdfViewer.currentPageNumber <= 1;
    // Purpose: Run this statement as the next step in the PDF workflow.
    nextButton.disabled = !pdfViewer.pagesCount || pdfViewer.currentPageNumber >= pdfViewer.pagesCount;
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function renderScaleState() {
    // Purpose: Run this statement as the next step in the PDF workflow.
    zoomValue.textContent = pdfViewer.currentScale ? Math.round(pdfViewer.currentScale * 100) + "%" : "Fit width";
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  async function exportEditedBlob() {
    // Purpose: Check this condition before continuing.
    if (!pdfDocument) throw new Error("The PDF document is not ready to export.");
    // Purpose: Wait for asynchronous work to finish before continuing.
    const bytes = await pdfDocument.saveDocument();
    // Purpose: Return the result to the caller.
    return new Blob([bytes], { type: "application/pdf" });
  // Purpose: Close the current block or callback.
  }

  // Purpose: Define a reusable operation in the PDF viewing workflow.
  async function downloadPdf() {
    // Purpose: Run this statement as the next step in the PDF workflow.
    downloadButton.disabled = true;
    // Purpose: Start a protected operation that may fail.
    try {
      // Purpose: Wait for asynchronous work to finish before continuing.
      const editedBlob = await exportEditedBlob();
      // Purpose: Run this statement as the next step in the PDF workflow.
      onEdited?.(editedBlob);
      // Purpose: Store the value that the following logic needs.
      const downloadUrl = URL.createObjectURL(editedBlob);
      // Purpose: Store the value needed by the following logic.
      const anchor = createElement("a");
      // Purpose: Run this statement as the next step in the PDF workflow.
      anchor.href = downloadUrl;
      // Purpose: Run this statement as the next step in the PDF workflow.
      anchor.download = normalizePdfName(fileName);
      // Purpose: Run this statement as the next step in the PDF workflow.
      anchor.hidden = true;
      // Purpose: Run this statement as the next step in the PDF workflow.
      document.body.append(anchor);
      // Purpose: Run this statement as the next step in the PDF workflow.
      anchor.click();
      // Purpose: Run this statement as the next step in the PDF workflow.
      anchor.remove();
      // Purpose: Run this statement as the next step in the PDF workflow.
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("PDF copy downloaded — Dropbox Sync can save these bytes", "ready");
    // Purpose: Close the current block or callback.
    } catch (error) {
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("Could not export the PDF: " + (error?.message || "unknown error"), "error");
      // Purpose: Report an error so the calling operation can handle the failure.
      throw error;
    // Purpose: Close the current block or callback.
    } finally {
      // Purpose: Run this statement as the next step in the PDF workflow.
      downloadButton.disabled = false;
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  }

  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("select").addEventListener("click", () => setEditorMode("NONE", "select"));
  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("hand").addEventListener("click", () => setHandMode(!handMode));
  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("highlight").addEventListener("click", () => setEditorMode("HIGHLIGHT", "highlight"));
  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("pen").addEventListener("click", () => setEditorMode("INK", "pen"));
  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("text").addEventListener("click", () => setEditorMode("FREETEXT", "text"));
  // Purpose: Register a handler for this user or viewer event.
  toolButtons.get("stamp").addEventListener("click", () => setEditorMode("STAMP", "stamp"));
  // Purpose: Check this condition before continuing.
  if (AnnotationEditorType.SIGNATURE === undefined) {
    // Purpose: Run this statement as the next step in the PDF workflow.
    toolButtons.get("signature").hidden = true;
  // Purpose: Close the current block or callback.
  } else {
    // Purpose: Register a handler for this user or viewer event.
    toolButtons.get("signature").addEventListener("click", () => setEditorMode("SIGNATURE", "signature"));
  // Purpose: Close the current block or callback.
  }

  // Purpose: Register a handler for this user or viewer event.
  previousButton.addEventListener("click", () => { if (pdfViewer.currentPageNumber > 1) pdfViewer.currentPageNumber -= 1; });
  // Purpose: Register a handler for this user or viewer event.
  nextButton.addEventListener("click", () => { if (pdfViewer.currentPageNumber < pdfViewer.pagesCount) pdfViewer.currentPageNumber += 1; });
  // Purpose: Register a handler for this user or viewer event.
  pageInput.addEventListener("change", () => {
    // Purpose: Store the value that the following logic needs.
    const value = Number.parseInt(pageInput.value, 10);
    // Purpose: Check this condition before continuing.
    if (Number.isFinite(value)) pdfViewer.currentPageNumber = Math.max(1, Math.min(pdfViewer.pagesCount || 1, value));
    // Purpose: Run this statement as the next step in the PDF workflow.
    renderPageState();
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  pageInput.addEventListener("keydown", (event) => {
    // Purpose: Check this condition before continuing.
    if (event.key === "Enter") {
      // Purpose: Run this statement as the next step in the PDF workflow.
      event.preventDefault();
      // Purpose: Run this statement as the next step in the PDF workflow.
      pageInput.blur();
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  zoomOutButton.addEventListener("click", () => {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.currentScaleValue = String(Math.max(0.25, (pdfViewer.currentScale || 1) / 1.15));
    // Purpose: Run this statement as the next step in the PDF workflow.
    renderScaleState();
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  zoomInButton.addEventListener("click", () => {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.currentScaleValue = String(Math.min(5, (pdfViewer.currentScale || 1) * 1.15));
    // Purpose: Run this statement as the next step in the PDF workflow.
    renderScaleState();
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  fitButton.addEventListener("click", () => {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.currentScaleValue = "page-width";
    // Purpose: Run this statement as the next step in the PDF workflow.
    renderScaleState();
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  rotateButton.addEventListener("click", () => {
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.pagesRotation = ((pdfViewer.pagesRotation || 0) + 90) % 360;
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  searchInput.addEventListener("keydown", (event) => {
    // Purpose: Check this condition before continuing.
    if (event.key !== "Enter") return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    event.preventDefault();
    // Purpose: Store the value that the following logic needs.
    const query = searchInput.value.trim();
    // Purpose: Check this condition before continuing.
    if (!query) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    eventBus.dispatch("find", {
      // Purpose: Set this property in the surrounding object.
      source: searchInput,
      // Purpose: Set this property in the surrounding object.
      type: searchCount++ ? "again" : "",
      // Purpose: Run this statement as the next step in the PDF workflow.
      query,
      // Purpose: Set this property in the surrounding object.
      phraseSearch: true,
      // Purpose: Set this property in the surrounding object.
      caseSensitive: false,
      // Purpose: Set this property in the surrounding object.
      entireWord: false,
      // Purpose: Set this property in the surrounding object.
      highlightAll: true,
      // Purpose: Set this property in the surrounding object.
      findPrevious: event.shiftKey
    // Purpose: Close the current block or callback.
    });
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  searchPreviousButton.addEventListener("click", () => {
    // Purpose: Store the value that the following logic needs.
    const query = searchInput.value.trim();
    // Purpose: Check this condition before continuing.
    if (!query) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    eventBus.dispatch("find", { source: searchInput, type: "again", query, phraseSearch: true, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: true });
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  searchNextButton.addEventListener("click", () => {
    // Purpose: Store the value that the following logic needs.
    const query = searchInput.value.trim();
    // Purpose: Check this condition before continuing.
    if (!query) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    eventBus.dispatch("find", { source: searchInput, type: "again", query, phraseSearch: true, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: false });
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  downloadButton.addEventListener("click", () => { void downloadPdf(); });

  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("input", markDirty, true);
  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("change", markDirty, true);
  // Purpose: Run this statement as the next step in the PDF workflow.
  eventBus.on("annotationeditorstateschanged", (event) => {
    // Purpose: Check this condition before continuing.
    if (event?.details?.hasSomethingToUndo) markDirty();
  // Purpose: Close the current block or callback.
  });
  // Purpose: Run this statement as the next step in the PDF workflow.
  eventBus.on("pagechanging", renderPageState);
  // Purpose: Run this statement as the next step in the PDF workflow.
  eventBus.on("scalechanging", renderScaleState);

  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("pointerdown", (event) => {
    // Purpose: Check this condition before continuing.
    if (!handMode || event.button !== 0 || event.target.closest("a, input, button, textarea, select")) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    event.preventDefault();
    // Purpose: Run this statement as the next step in the PDF workflow.
    dragging = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: scrollContainer.scrollLeft, top: scrollContainer.scrollTop };
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.setPointerCapture(event.pointerId);
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.classList.add("is-panning");
  // Purpose: Close the current block or callback.
  });
  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("pointermove", (event) => {
    // Purpose: Check this condition before continuing.
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.scrollLeft = dragging.left - (event.clientX - dragging.x);
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.scrollTop = dragging.top - (event.clientY - dragging.y);
  // Purpose: Close the current block or callback.
  });
  // Purpose: Define a reusable operation in the PDF viewing workflow.
  function endPan(event) {
    // Purpose: Check this condition before continuing.
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    // Purpose: Run this statement as the next step in the PDF workflow.
    dragging = null;
    // Purpose: Run this statement as the next step in the PDF workflow.
    scrollContainer.classList.remove("is-panning");
  // Purpose: Close the current block or callback.
  }
  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("pointerup", endPan);
  // Purpose: Register a handler for this user or viewer event.
  scrollContainer.addEventListener("pointercancel", endPan);

  // Purpose: Store the value that the following logic needs.
  const pagesReady = new Promise((resolve) => {
    // Purpose: Run this statement as the next step in the PDF workflow.
    eventBus.on("pagesinit", () => {
      // Purpose: Run this statement as the next step in the PDF workflow.
      pdfViewer.currentScaleValue = "page-width";
      // Purpose: Run this statement as the next step in the PDF workflow.
      renderPageState();
      // Purpose: Run this statement as the next step in the PDF workflow.
      renderScaleState();
      // Purpose: Run this statement as the next step in the PDF workflow.
      resolve();
    // Purpose: Close the current block or callback.
    });
  // Purpose: Close the current block or callback.
  });
  // Purpose: Start a protected operation that may fail.
  try {
    // Purpose: Wait for asynchronous work to finish before continuing.
    const data = new Uint8Array(await blob.arrayBuffer());
    // Purpose: Run this statement as the next step in the PDF workflow.
    loadingTask = pdfjsLib.getDocument({
      // Purpose: Run this statement as the next step in the PDF workflow.
      data,
      // Purpose: Set this property in the surrounding object.
      cMapUrl: PDFJS_BASE + "/cmaps/",
      // Purpose: Set this property in the surrounding object.
      cMapPacked: true,
      // Purpose: Set this property in the surrounding object.
      standardFontDataUrl: PDFJS_BASE + "/standard_fonts/",
      // Purpose: Set this property in the surrounding object.
      wasmUrl: PDFJS_BASE + "/wasm/",
      // Purpose: Set this property in the surrounding object.
      iccUrl: PDFJS_BASE + "/iccs/",
      // Purpose: Set this property in the surrounding object.
      enableXfa: true
    // Purpose: Close the current block or callback.
    });
    // Purpose: Run this statement as the next step in the PDF workflow.
    loadingTask.onProgress = (progress) => {
      // Purpose: Check this condition before continuing.
      if (progress?.total) setStatus("Loading PDF " + Math.round(progress.loaded / progress.total * 100) + "%", "loading");
    // Purpose: Close the current block or callback.
    };
    // Purpose: Wait for asynchronous work to finish before continuing.
    pdfDocument = await loadingTask.promise;
    // Release the PDF document if the user replaced or closed this viewport while it loaded.
    if (disposed || !isCurrent()) {
      // Purpose: Wait for asynchronous work to finish before continuing.
      await pdfDocument.destroy();
      // Purpose: Report an error so the calling operation can handle the failure.
      throw createAbortError();
    // Purpose: Close the current block or callback.
    }
    // Purpose: Run this statement as the next step in the PDF workflow.
    pdfViewer.setDocument(pdfDocument);
    // Purpose: Run this statement as the next step in the PDF workflow.
    linkService.setDocument(pdfDocument, null);
    // Purpose: Wait for asynchronous work to finish before continuing.
    await Promise.race([
      // Purpose: Run this statement as the next step in the PDF workflow.
      pagesReady,
      // Purpose: Run this statement as the next step in the PDF workflow.
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("PDF.js did not finish initializing its page viewer.")), 30000))
    // Purpose: Run this statement as the next step in the PDF workflow.
    ]);
    // Skip the ready message when this viewer no longer represents the current file.
    if (!isCurrent()) throw createAbortError();
    // Purpose: Run this statement as the next step in the PDF workflow.
    setStatus("Ready · " + pdfViewer.pagesCount + (pdfViewer.pagesCount === 1 ? " page" : " pages"), "ready");
    // Purpose: Run this statement as the next step in the PDF workflow.
    setEditorMode("NONE", "select");
  // Purpose: Close the current block or callback.
  } catch (error) {
    // Show the error only when this render request is still current.
    // Purpose: Check this condition before continuing.
    if (isCurrent() && error?.name !== "AbortError") {
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("Could not open PDF: " + (error?.message || "unknown error"), "error");
    // Purpose: Close the current block or callback.
    }
    // Purpose: Start a protected operation that may fail.
    try { pdfViewer.setDocument(null); } catch (_) {}
    // Purpose: Start a protected operation that may fail.
    try { linkService.setDocument(null, null); } catch (_) {}
    // Purpose: Start a protected operation that may fail.
    try { await loadingTask?.destroy(); } catch (_) {}
    // Purpose: Report an error so the calling operation can handle the failure.
    throw error;
  // Purpose: Close the current block or callback.
  }

  // Purpose: Return the result to the code that called this operation.
  return {
    // Purpose: Run this statement as the next step in the PDF workflow.
    get isDirty() { return dirty; },
    // Purpose: Run this statement as the next step in the PDF workflow.
    async exportEditedBlob() { return exportEditedBlob(); },
    // Purpose: Run this statement as the next step in the PDF workflow.
    markSaved() {
      // Purpose: Run this statement as the next step in the PDF workflow.
      dirty = false;
      // Purpose: Run this statement as the next step in the PDF workflow.
      setStatus("Saved to Dropbox", "saved");
    // Purpose: Close the current block or callback.
    },
    // Purpose: Run this statement as the next step in the PDF workflow.
    async dispose() {
      // Purpose: Check this condition before continuing.
      if (disposed) return;
      // Purpose: Run this statement as the next step in the PDF workflow.
      disposed = true;
      // Purpose: Start a protected operation that may fail.
      try { pdfViewer.setDocument(null); } catch (_) {}
      // Purpose: Start a protected operation that may fail.
      try { linkService.setDocument(null, null); } catch (_) {}
      // Purpose: Start a protected operation that may fail.
      try { await loadingTask?.destroy(); } catch (_) {}
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  };
// Purpose: Close the current block or callback.
}
// Route PDF file-open requests to the right viewport and own each viewer's lifecycle.
export class PdfAdapter {
  // Initialize request tracking and subscribe to the shared file-open event.
  constructor() {
    // Store an increasing request number for each target viewport.
    this.requestIds = new Map();
    // Keep successful renderers so they can be disposed before replacing a PDF.
    this.renderers = new Map();
    // Track pending PDF loads so a newer request can invalidate them.
    this.pendingRequests = new Map();
    // Remember whether this adapter has already been shut down.
    this.isDisposed = false;
    // Keep a stable callback reference for safe EventBus unsubscription.
    this.fileOpenHandler = (payload) => {
      // Start the async handler without blocking other subscribers.
      void this.handleFileOpenRequested(payload);
    // Purpose: Close the current block or callback.
    };
    // Listen for the shared event emitted when a file is assigned to a viewport.
    // Purpose: Register this adapter to receive a shared application event.
    EventBus.subscribe("FILE_OPEN_REQUESTED", this.fileOpenHandler);
    // Keep one stable listener for requests to close a viewport window.
    // Purpose: Store a callback needed by the shared event system.
    this.viewportCloseHandler = (payload = {}) => {
      // Let this adapter cancel pending work and release any active PDF.js renderer.
      // Purpose: Run the next viewport cleanup operation.
      this.handleViewportCloseRequested(payload);
    // Purpose: Close the current callback.
    };
    // Receive window-close notifications without coupling WorkspaceUI to PDF.js.
    // Purpose: Subscribe to the shared event that announces viewport closure.
    EventBus.subscribe("VIEWPORT_CLOSE_REQUESTED", this.viewportCloseHandler);
    // Keep a stable callback for notifications that transfer an existing mounted viewer.
    // Purpose: Store a callback that can be removed when the adapter is disposed.
    this.viewportContentsMovedHandler = (payload = {}) => {
      // Re-key the adapter's lifecycle records after WorkspaceUI moves live DOM nodes.
      // Purpose: Keep Close and Replace connected to the moved viewer instance.
      this.handleViewportContentsMoved(payload);
    // Purpose: Close the moved-content callback.
    };
    // Listen for DOM-preserving moves without coupling WorkspaceUI to PDF.js internals.
    // Purpose: Subscribe to the shared viewport contents moved event.
    EventBus.subscribe("VIEWPORT_CONTENTS_MOVED", this.viewportContentsMovedHandler);
  // Purpose: Close the current block or callback.
  }

  // Transfer adapter ownership when WorkspaceUI moves a live viewport into another host.
  // Purpose: Preserve PDF.js renderer lifecycle tracking across dock drag-and-drop.
  handleViewportContentsMoved({ sourceSide, targetSide, sourceRoot, targetRoot } = {}) {
    // Accept only the supported source and target viewport names and existing DOM hosts.
    // Purpose: Keep invalid move notifications from changing adapter ownership.
    if (!['full', 'left', 'right'].includes(sourceSide) || !['full', 'left', 'right'].includes(targetSide) || sourceSide === targetSide || !sourceRoot || !targetRoot) return;
    // Find a successfully mounted renderer that still belongs to the source root.
    // Purpose: Locate the live PDF.js instance being moved.
    const activeRenderer = this.renderers.get(sourceSide);
    // Re-key the renderer without disposing it when the source and host match.
    // Purpose: Let later viewport cleanup reach the same editor instance.
    if (activeRenderer?.root === sourceRoot) {
      // Remove the old key so only the destination side owns this renderer.
      // Purpose: Prevent duplicate lifecycle ownership of the moved viewer.
      this.renderers.delete(sourceSide);
      // Store the original editor and payload with its new viewport root.
      // Purpose: Preserve the existing PDF.js instance while updating its host reference.
      this.renderers.set(targetSide, { ...activeRenderer, root: targetRoot });
    // Purpose: Close the active-renderer condition.
    }
    // Find a source request that has not finished mounting its PDF viewer yet.
    // Purpose: Handle drops that occur while the source document is still loading.
    const pendingRequest = this.pendingRequests.get(sourceSide);
    // Reissue only an unfinished request because it has no complete viewer instance to preserve.
    // Purpose: Prevent an asynchronous render from mounting into the now-hidden source host.
    if (pendingRequest?.payload) {
      // Invalidate the old asynchronous request before it can write to its original host.
      // Purpose: Mark the original request as stale.
      this.requestIds.set(sourceSide, (this.requestIds.get(sourceSide) || 0) + 1);
      // Remove the source pending marker before requesting the same file at the new target.
      // Purpose: Let the new target become the only owner of the pending request.
      this.pendingRequests.delete(sourceSide);
      // Route the still-loading document to the target; no finished viewer instance is lost.
      // Purpose: Resume the uncompleted open operation at its new viewport.
      EventBus.publish('FILE_OPEN_REQUESTED', { ...pendingRequest.payload, viewportType: targetSide });
    // Purpose: Close the pending-render condition.
    }
  // Purpose: Close the moved-content method.
  }

  // Find the Full, Left, or Right container using the active HTML IDs and data attributes.
  getViewportElement(viewportType) {
    // Map accepted target names to the matching containers from site/index.html.
    const selectors = {
      // Purpose: Set this property in the surrounding object.
      full: '#viewport-fullscreen-layout [data-viewport-side="full"]',
      // Purpose: Set this property in the surrounding object.
      left: '#viewport-split-layout [data-viewport-side="left"]',
      // Purpose: Set this property in the surrounding object.
      right: '#viewport-split-layout [data-viewport-side="right"]',
    // Purpose: Close the current block or callback.
    };
    // Read only a selector defined above so arbitrary payload text is never used as CSS.
    const selector = selectors[viewportType];
    // Return the matching viewport or null when the target name is not supported.
    return selector ? document.querySelector(selector) : null;
  // Purpose: Close the current block or callback.
  }

  // Cancel an unfinished PDF load or dispose its renderer when a viewport closes.
  // Purpose: Run the next viewport cleanup operation.
  handleViewportCloseRequested({ viewportType } = {}) {
    // Accept only the supported Full, Left, and Right viewport targets.
    // Purpose: Check this condition before choosing which branch should run.
    if (!["full", "left", "right"].includes(viewportType)) return;
    // Increase the target's request sequence so older pending loads are stale.
    // Purpose: Store a value needed by the next viewport cleanup operation.
    const nextRequestId = (this.requestIds.get(viewportType) || 0) + 1;
    // Save the updated sequence before cleaning up the existing renderer.
    // Purpose: Update the active request sequence.
    this.requestIds.set(viewportType, nextRequestId);
    // Reuse the adapter's normal cleanup path for mounted and pending viewers.
    // Purpose: Run the next viewport cleanup operation.
    this.clearTargetViewport(viewportType);
  // Purpose: Close the current method.
  }

  // Check the filename, MIME type, or small file signature before claiming a PDF.
  async isPdfPayload(payload) {
    // Read the most useful name available from the file-open event.
    // Purpose: Store the value needed by the following logic.
    const fileName = String(payload?.fileName || payload?.fileData?.name || payload?.metadata?.name || payload?.originalPath || payload?.path || "");
    // Read the MIME type supplied by the provider or the downloaded Blob.
    // Purpose: Store the value needed by the following logic.
    const mimeType = String(payload?.mimeType || payload?.fileData?.mime_type || payload?.blob?.type || "").toLowerCase();
    // Accept the standard PDF MIME type when the file provider supplies it.
    // Purpose: Check this condition before continuing.
    if (mimeType === "application/pdf" || mimeType.includes("/pdf")) return true;
    // Accept PDF filenames even when the response Blob has no MIME metadata.
    if (/\.pdf$/i.test(fileName)) return true;
    // Do not try to read a signature when the event does not contain binary file data.
    if (!(payload?.blob instanceof Blob)) return false;
    // Read only five bytes so checking the signature does not load the whole file again.
    const signature = await payload.blob.slice(0, 5).text();
    // PDF files normally begin with the magic header %PDF-.
    // Purpose: Return the result to the caller.
    return signature.startsWith("%PDF-");
  // Purpose: Close the current block or callback.
  }

  // Clear a viewport owned by this adapter and release its previous PDF.js document.
  clearTargetViewport(viewportType, fallbackRoot = null) {
    // Find a successfully mounted viewer for this target, if one exists.
    const activeRenderer = this.renderers.get(viewportType);
    // Find a host that is currently being filled by a pending render, if one exists.
    const pendingRequest = this.pendingRequests.get(viewportType);
    // Reuse the adapter's recorded root or fall back to the page's current target element.
    const root = activeRenderer?.root || pendingRequest?.root || fallbackRoot;
    // Remove these references first so the same renderer is not disposed twice.
    this.renderers.delete(viewportType);
    // Forget the pending marker because this request is being replaced or cleared.
    this.pendingRequests.delete(viewportType);
    // Release resources from the old editor while allowing the new request to continue.
    if (activeRenderer?.editor) {
      // Purpose: Start a protected operation that may fail.
      try {
        // The editor begins synchronous cleanup and returns a promise for async resource release.
        const disposal = activeRenderer.editor.dispose();
        // Catch a late cleanup error so it cannot become an unhandled promise rejection.
        void Promise.resolve(disposal).catch((error) => {
          // Report cleanup problems for developers without blocking the next document.
          // Purpose: Run this statement as the next step in the PDF workflow.
          console.warn("Lux Omni PDF viewport cleanup failed:", error);
        // Purpose: Close the current block or callback.
        });
      // Purpose: Close the current block or callback.
      } catch (error) {
        // Continue resetting the DOM even if the old editor throws during disposal.
        // Purpose: Run this statement as the next step in the PDF workflow.
        console.warn("Lux Omni PDF viewport cleanup failed:", error);
      // Purpose: Close the current block or callback.
      }
    // Purpose: Close the current block or callback.
    }
    // Stop if this viewport element no longer exists.
    if (!root) return;
    // Remove viewer nodes inside the open Shadow DOM that isolates PDF.js CSS.
    if (root.shadowRoot) root.shadowRoot.replaceChildren();
    // Remove any ordinary children so the host is reusable by another adapter.
    root.replaceChildren();
    // Clear the name so an emptied viewport cannot show a stale dock label.
    // Purpose: Remove old filename metadata from the viewport host.
    root.removeAttribute("data-file-name");
    // Remove the class that applies layout styles specifically to an active PDF viewer.
    // Purpose: Run this statement as the next step in the PDF workflow.
    root.classList.remove("lux-pdf-editor-root");
    // Remove the error-state class if a previous load failed.
    // Purpose: Run this statement as the next step in the PDF workflow.
    root.classList.remove("lux-pdf-render-error");
  // Purpose: Close the current block or callback.
  }

  // Handle a document-open event while leaving non-PDF payloads to other adapters.
  async handleFileOpenRequested(payload) {
    // Ignore requests after the adapter has been disposed.
    if (this.isDisposed) return;
    // Read the name of the requested destination viewport.
    const viewportType = payload?.viewportType;
    // Accept only the three target containers implemented by the legacy workspace.
    // Purpose: Check this condition before continuing.
    if (!["full", "left", "right"].includes(viewportType)) return;
    // Advance the request sequence before any await so older loads can detect replacement.
    const requestId = (this.requestIds.get(viewportType) || 0) + 1;
    // Store the latest request sequence for this specific viewport.
    this.requestIds.set(viewportType, requestId);
    // Define a quick check that detects whether this request is still current.
    const isCurrent = () => this.requestIds.get(viewportType) === requestId;
    // Find the viewport without changing the workspace layout yet.
    const root = this.getViewportElement(viewportType);
    // Dispose previous PDF content so a new document can use the same container.
    if (this.renderers.has(viewportType) || this.pendingRequests.has(viewportType)) {
      // Clear only content owned by this PDF adapter; other viewport targets remain untouched.
      this.clearTargetViewport(viewportType, root);
    // Purpose: Close the current block or callback.
    }
    // Check whether this event contains a PDF before clearing content owned by other adapters.
    let isPdf = false;
    // Purpose: Start a protected operation that may fail.
    try {
      // Use metadata or the PDF file signature to identify the correct adapter.
      isPdf = await this.isPdfPayload(payload);
    // Purpose: Close the current block or callback.
    } catch (error) {
      // Notify other modules when the payload could not be inspected.
      // Purpose: Notify other application modules through the shared event system.
      EventBus.publish("FILE_OPEN_FAILED", {
        // Identify the adapter that attempted to inspect this document.
        // Purpose: Set this property in the surrounding object.
        adapter: "pdf",
        // Include the destination to help a user interface show the right error.
        viewportType,
        // Include a readable message without building HTML from external data.
        // Purpose: Set this property in the surrounding object.
        message: error?.message || "Could not inspect the selected file.",
        // Carry the original request for correlation in logs or future UI.
        request: payload,
      // Purpose: Close the current block or callback.
      });
      // Stop here rather than attempting a render with invalid data.
      return;
    // Purpose: Close the current block or callback.
    }
    // Let Markdown, image, or other adapters handle files that are not PDFs.
    if (!isPdf) return;
    // Do not act on an older request that was replaced while its signature was checked.
    if (!isCurrent()) return;
    // Publish a clear failure if the expected viewport container is absent.
    if (!root) {
      // Purpose: Notify other application modules through the shared event system.
      EventBus.publish("FILE_OPEN_FAILED", {
        // Identify the adapter handling this file.
        // Purpose: Set this property in the surrounding object.
        adapter: "pdf",
        // Keep the requested viewport for debugging or notification logic.
        viewportType,
        // Explain why the file cannot be shown.
        // Purpose: Set this property in the surrounding object.
        message: "The requested PDF viewport was not found in the page.",
        // Preserve the original event payload for correlation.
        request: payload,
      // Purpose: Close the current block or callback.
      });
      // No rendering can continue without a target container.
      return;
    // Purpose: Close the current block or callback.
    }
    // Reveal Full Screen for the full viewport or Split Screen for either side viewport.
    // Purpose: Run this statement as the next step in the PDF workflow.
    Store.setState({ activeLayout: viewportType === "full" ? "full" : "split" });
    // Clear the target before attaching the new PDF viewer.
    this.clearTargetViewport(viewportType, root);
    // Remember the payload so an unfinished render can be rerouted if its window is moved.
    // Purpose: Preserve enough request data to resume loading at a different viewport.
    this.pendingRequests.set(viewportType, { root, requestId, payload });
    // Choose the file name displayed by the PDF toolbar and the local download button.
    // Purpose: Store the value needed by the following logic.
    const fileName = String(payload?.fileName || payload?.fileData?.name || payload?.metadata?.name || payload?.originalPath || "document.pdf");
    // Purpose: Start a protected operation that may fail.
    try {
      // Mount the viewer and editing toolbar adapted from the legacy PDF engine.
      const editor = await mountPdfEditor({
        // Pass the chosen viewport as the host for the isolated viewer.
        root,
        // Use the binary file contents already delivered with the event.
        blob: payload.blob,
        // Preserve the source file name for labels and Save PDF downloads.
        fileName,
        // Preserve the target in events from this viewer.
        viewportType,
        // Tell other modules when the PDF contains edits that may need saving.
        // Purpose: Notify other application modules through the shared event system.
        onDirty: () => EventBus.publish("PDF_DOCUMENT_DIRTY", {
          // Identify which viewport contains the dirty PDF document.
          viewportType,
          // Include the source name for status displays.
          fileName,
          // Tie the update to the file that was originally opened.
          request: payload,
        // Purpose: Close the current block or callback.
        }),
        // Make exported PDF bytes available to storage or sync consumers.
        // Purpose: Notify other application modules through the shared event system.
        onEdited: (blob) => EventBus.publish("PDF_DOCUMENT_EDITED", {
          // Identify the viewport the exported bytes came from.
          viewportType,
          // Send the updated Blob rather than exposing any service token.
          blob,
          // Preserve the filename for later save workflows.
          fileName,
          // Keep source metadata attached to this exported result.
          request: payload,
        // Purpose: Close the current block or callback.
        }),
        // Let the renderer detect that a later file request has superseded this one.
        isCurrent,
      // Purpose: Close the current block or callback.
      });
      // Release a result if a different request arrived before this render completed.
      if (!isCurrent()) {
        // Dispose the now-stale viewer so its document and worker resources are released.
        await editor.dispose();
        // Stop without publishing a stale success event.
        return;
      // Purpose: Close the current block or callback.
      }
      // Store this renderer only after the PDF.js pages have initialized successfully.
      // Expose the displayed filename so the minimized dock can identify this window.
      // Purpose: Update viewport metadata for the user interface.
      root.dataset.fileName = fileName;
      // Store this renderer only after the PDF.js pages have initialized successfully.
      this.renderers.set(viewportType, { root, editor, fileName, payload });
      // Remove only the pending record that belongs to this completed request.
      if (this.pendingRequests.get(viewportType)?.requestId === requestId) {
        // Mark this request as no longer pending.
        this.pendingRequests.delete(viewportType);
      // Purpose: Close the current block or callback.
      }
      // Notify the rest of the app that the requested PDF opened successfully.
      // Purpose: Notify other application modules through the shared event system.
      EventBus.publish("PDF_OPENED", {
        // Include the destination viewport.
        viewportType,
        // Include the displayed file name.
        fileName,
        // Keep the original request available to event consumers.
        request: payload,
      // Purpose: Close the current block or callback.
      });
    // Purpose: Close the current block or callback.
    } catch (error) {
      // Treat a newer request or explicit cancellation as normal flow, not a failure.
      // Purpose: Check this condition before continuing.
      if (!isCurrent() || error?.name === "AbortError") return;
      // Remove only the pending marker that belongs to this failed open request.
      if (this.pendingRequests.get(viewportType)?.requestId === requestId) {
        // Drop the pending record so a future event can start cleanly.
        this.pendingRequests.delete(viewportType);
      // Purpose: Close the current block or callback.
      }
      // Display a text-only error inside the viewer's isolated Shadow DOM when it exists.
      if (root.shadowRoot) {
        // Clear stale viewer controls before showing the error.
        root.shadowRoot.replaceChildren();
        // Create a paragraph using the normal DOM API.
        // Purpose: Store the value needed by the following logic.
        const message = document.createElement("p");
        // Reuse a status class whose appearance is defined in pdf-editor.css.
        // Purpose: Run this statement as the next step in the PDF workflow.
        message.className = "lux-pdf-status";
        // Set text safely rather than interpreting an error message as markup.
        // Purpose: Run this statement as the next step in the PDF workflow.
        message.textContent = "Could not open PDF: " + (error?.message || "unknown error");
        // Add the error message to the viewport's Shadow DOM.
        root.shadowRoot.append(message);
      // Purpose: Close the current block or callback.
      }
      // Publish the failed request so a UI module can show a notification if needed.
      // Purpose: Notify other application modules through the shared event system.
      EventBus.publish("FILE_OPEN_FAILED", {
        // Identify which adapter failed.
        // Purpose: Set this property in the surrounding object.
        adapter: "pdf",
        // Identify where the user requested the document to open.
        viewportType,
        // Include the filename so a toast can provide context.
        fileName,
        // Provide the error message in ordinary text form.
        // Purpose: Set this property in the surrounding object.
        message: error?.message || "Could not open the PDF.",
        // Preserve the original request for correlation.
        request: payload,
      // Purpose: Close the current block or callback.
      });
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  }

  // Unsubscribe and release all rendered documents when this adapter is no longer needed.
  dispose() {
    // Mark the instance inactive before cleaning up its resources.
    this.isDisposed = true;
    // Stop receiving future file-open requests.
    // Purpose: Run this statement as the next step in the PDF workflow.
    EventBus.unsubscribe("FILE_OPEN_REQUESTED", this.fileOpenHandler);
    // Stop receiving close notifications after this adapter is disposed.
    // Purpose: Unsubscribe this module from the shared close event.
    EventBus.unsubscribe("VIEWPORT_CLOSE_REQUESTED", this.viewportCloseHandler);
    // Stop receiving viewport-move events after this adapter has been disposed.
    // Purpose: Remove the moved-content listener during adapter cleanup.
    EventBus.unsubscribe("VIEWPORT_CONTENTS_MOVED", this.viewportContentsMovedHandler);
    // Collect targets that have either a pending or successfully mounted PDF.
    const viewportTypes = new Set([...this.renderers.keys(), ...this.pendingRequests.keys()]);
    // Clear every viewport currently owned by this adapter.
    for (const viewportType of viewportTypes) {
      // Use its recorded DOM root when the visible layout has changed.
      this.clearTargetViewport(viewportType);
    // Purpose: Close the current block or callback.
    }
  // Purpose: Close the current block or callback.
  }
// Purpose: Close the current block or callback.
}

// Export the class so main.js can create the adapter alongside the user-interface classes.
export default PdfAdapter;
