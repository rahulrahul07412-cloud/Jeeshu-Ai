// ─────────────────────────────────────────────────────────────────
// Jeeshu AI — Frontend JavaScript (app.js)
//
// This file handles:
//  1. UI interactions (sidebar, popups, modals)
//  2. Image upload preview
//  3. Sending generation requests to our backend
//  4. Displaying generated images in the chat
//  5. Saving/loading history to localStorage
// ─────────────────────────────────────────────────────────────────

// ── Helper: get element by ID (shorter to type) ──────────────────
const $ = id => document.getElementById(id);

// ── State: track current settings ────────────────────────────────
const S = {
  ratio:   "Auto",  // Selected aspect ratio
  count:   1,       // Number of images to generate
  upUrl:   null,    // Base64 data URL of uploaded image (for preview)
  upFile:  null,    // Actual File object (sent to server)
  vSrc:    null,    // Current image shown in fullscreen viewer
  hist:    [],      // Chat history array
};

// ── Map aspect ratio strings to CSS classes ───────────────────────
const RC = {
  "Auto" : "ra",
  "16:9" : "r169",
  "3:2"  : "r32",
  "4:3"  : "r43",
  "1:1"  : "r11",
  "2:3"  : "r23",
  "9:16" : "r916",
};

// ─────────────────────────────────────────────────────────────────
// BUILD PREFERENCE PANELS
// These are the popups that let the user choose aspect ratio/count
// ─────────────────────────────────────────────────────────────────

// Aspect ratio options with SVG preview shapes
const ratioOpts = [
  { v: "Auto", w: 18, h: 18 },
  { v: "16:9", w: 26, h: 15 },
  { v: "3:2",  w: 22, h: 15 },
  { v: "4:3",  w: 20, h: 15 },
  { v: "1:1",  w: 16, h: 16 },
  { v: "2:3",  w: 15, h: 22 },
  { v: "9:16", w: 13, h: 22 },
];

ratioOpts.forEach(o => {
  const d = document.createElement("div");
  d.className = "si" + (o.v === S.ratio ? " sel" : "");
  d.dataset.v = o.v;
  // SVG shows the shape of that aspect ratio visually
  d.innerHTML = `
    <div class="sil">
      <svg class="rv" width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}">
        <rect x="1" y="1" width="${o.w-2}" height="${o.h-2}" rx="2"
              fill="none" stroke="#666" stroke-width="1.4"/>
      </svg>
      <span>${o.v}</span>
    </div>
    <i class="fas fa-check chk"></i>`;
  d.onclick = () => {
    // Deselect all, select clicked one
    $("rPop").querySelectorAll(".si").forEach(x => x.classList.remove("sel"));
    d.classList.add("sel");
    S.ratio = o.v;
    $("rLbl").textContent = o.v; // Update label in main popup
    $("rPop").classList.remove("on");
    $("pp").classList.add("on"); // Go back to main popup
  };
  $("rPop").appendChild(d);
});

// Count options
const countOpts = [
  { v: 1, l: "1 image" },
  { v: 2, l: "2 images" },
  { v: 4, l: "4 images" },
];

countOpts.forEach(o => {
  const d = document.createElement("div");
  d.className = "si" + (o.v === S.count ? " sel" : "");
  d.dataset.v = o.v;
  const icon = o.v === 1 ? "image" : o.v === 2 ? "images" : "th-large";
  d.innerHTML = `
    <div class="sil">
      <i class="fas fa-${icon}" style="color:var(--t3);width:16px;text-align:center;"></i>
      <span>${o.l}</span>
    </div>
    <i class="fas fa-check chk"></i>`;
  d.onclick = () => {
    $("cPop").querySelectorAll(".si").forEach(x => x.classList.remove("sel"));
    d.classList.add("sel");
    S.count = o.v;
    $("cLbl").textContent = o.l;
    $("cPop").classList.remove("on");
    $("pp").classList.add("on");
  };
  $("cPop").appendChild(d);
});

// ─────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────

const openSB  = () => { $("sb").classList.add("on");  $("ov").classList.add("on"); };
const closeSB = () => { $("sb").classList.remove("on"); $("ov").classList.remove("on"); };

$("menuBtn").onclick = openSB;
$("ov").onclick      = closeSB;
$("newBtn").onclick  = closeSB; // Closing sidebar on "New" is enough for now

// ─────────────────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────────────────

$("loginBtn").onclick = () => $("lm").classList.add("on");
$("mX").onclick       = () => $("lm").classList.remove("on");
$("lm").onclick = e => {
  if (e.target === $("lm")) $("lm").classList.remove("on");
};

// ─────────────────────────────────────────────────────────────────
// PREFERENCES POPUP
// ─────────────────────────────────────────────────────────────────

// Close all preference popups
const cPops = () => {
  $("pp").classList.remove("on");
  $("rPop").classList.remove("on");
  $("cPop").classList.remove("on");
  $("prefBtn").classList.remove("on");
};

// Toggle main prefs popup
$("prefBtn").onclick = e => {
  e.stopPropagation();
  const open = $("pp").classList.toggle("on");
  $("prefBtn").classList.toggle("on", open);
  $("rPop").classList.remove("on");
  $("cPop").classList.remove("on");
};

// Navigate into sub-panels
$("oRatio").onclick = e => { e.stopPropagation(); $("pp").classList.remove("on"); $("rPop").classList.add("on"); };
$("oCount").onclick = e => { e.stopPropagation(); $("pp").classList.remove("on"); $("cPop").classList.add("on"); };

// Back buttons in sub-panels
$("bkR").onclick = e => { e.stopPropagation(); $("rPop").classList.remove("on"); $("pp").classList.add("on"); };
$("bkC").onclick = e => { e.stopPropagation(); $("cPop").classList.remove("on"); $("pp").classList.add("on"); };

// Reset preferences to defaults
$("rstBtn").onclick = e => {
  e.stopPropagation();
  S.ratio = "Auto"; S.count = 1;
  $("rLbl").textContent = "Auto";
  $("cLbl").textContent = "1 image";
  $("rPop").querySelectorAll(".si").forEach(i => i.classList.toggle("sel", i.dataset.v === "Auto"));
  $("cPop").querySelectorAll(".si").forEach(i => i.classList.toggle("sel", +i.dataset.v === 1));
};

// Click outside = close all popups
document.onclick = e => {
  const inside = [$("pp"), $("rPop"), $("cPop"), $("prefBtn")].some(el => el.contains(e.target));
  if (!inside) cPops();
};

// ─────────────────────────────────────────────────────────────────
// IMAGE UPLOAD HANDLING
// ─────────────────────────────────────────────────────────────────

$("upBtn").onclick = () => $("fi").click(); // Trigger hidden file input

$("fi").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  S.upFile = file; // Save file for sending to server

  // Show thumbnail preview above input
  const reader = new FileReader();
  reader.onload = ev => {
    S.upUrl = ev.target.result;
    $("upTh").src = ev.target.result;
    $("upName").textContent = file.name.length > 20
      ? file.name.slice(0, 20) + "…"
      : file.name;
    $("ups").classList.add("on");
    updateSendBtn();
  };
  reader.readAsDataURL(file);
  e.target.value = ""; // Reset so same file can be re-selected
};

// Remove uploaded image
$("upRm").onclick = () => {
  S.upUrl = null;
  S.upFile = null;
  $("ups").classList.remove("on");
  $("upTh").src = "";
  updateSendBtn();
};

// ─────────────────────────────────────────────────────────────────
// TEXTAREA: auto-resize and send button state
// ─────────────────────────────────────────────────────────────────

$("ta").oninput = function () {
  // Auto-grow textarea height
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 108) + "px";
  updateSendBtn();
};

// Enter key sends (Shift+Enter = new line)
$("ta").onkeydown = e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    go();
  }
};

$("sendBtn").onclick = go;

// Enable/disable send button glow
function updateSendBtn() {
  const hasText = $("ta").value.trim().length > 0;
  $("sendBtn").classList.toggle("on", hasText || !!S.upUrl);
}

// ─────────────────────────────────────────────────────────────────
// MAIN: GENERATE IMAGE
// This is called when the user presses Send
// ─────────────────────────────────────────────────────────────────

async function go() {
  const prompt = $("ta").value.trim();
  if (!prompt && !S.upFile) return; // Nothing to send

  // Hide empty state on first message
  $("empty").style.display = "none";

  // Close any open popups
  cPops();

  // ── Show user message on right side ──
  const userRow = document.createElement("div");
  userRow.className = "row user";

  const bubble = document.createElement("div");
  bubble.className = "ubub";

  // If user uploaded a reference image, show small thumbnail in bubble
  if (S.upUrl) {
    const img = document.createElement("img");
    img.src = S.upUrl;
    img.className = "u-ref";
    bubble.appendChild(img);
  }

  // Show the text prompt
  if (prompt) {
    const span = document.createElement("span");
    span.textContent = prompt;
    bubble.appendChild(span);
  }

  userRow.appendChild(bubble);
  $("chat").appendChild(userRow);

  // ── Save values before resetting inputs ──
  const P = prompt || "Reference image";
  const R = S.ratio;
  const C = S.count;
  const fileToSend = S.upFile;

  // ── Reset inputs ──
  $("ta").value = "";
  $("ta").style.height = "auto";
  $("sendBtn").classList.remove("on");
  $("ups").classList.remove("on");
  $("upTh").src = "";
  S.upUrl = null;
  S.upFile = null;

  scrollBottom();

  // ── Show shimmer loading card on left side ──
  const aiRow = document.createElement("div");
  aiRow.className = "row ai";
  aiRow.appendChild(makeShimmer());
  $("chat").appendChild(aiRow);
  scrollBottom();

  // ── Call our backend API ──
  try {
    // Build form data (supports both text and image)
    const formData = new FormData();
    formData.append("prompt",       P);
    formData.append("aspectRatio",  R);
    formData.append("count",        C);
    if (fileToSend) {
      formData.append("image", fileToSend); // Attach reference image
    }

    // POST to our backend — NOT directly to Reve AI
    // The API key stays on the server, never visible to the browser
    const res = await fetch("/generate-image", {
      method: "POST",
      body:   formData,
      // Note: Don't set Content-Type header — browser sets it with boundary
    });

    const data = await res.json();

    // ── Handle error response ──
    if (!res.ok || !data.success) {
      aiRow.innerHTML = "";
      const errDiv = document.createElement("div");
      errDiv.className = "err-msg";
      errDiv.textContent = "⚠ " + (data.error || "Generation failed. Try again.");
      aiRow.appendChild(errDiv);
      scrollBottom();
      return;
    }

    // ── Display generated images ──
    const imageUrls = data.images || [];
    aiRow.innerHTML = ""; // Remove shimmer

    if (imageUrls.length === 0) {
      const errDiv = document.createElement("div");
      errDiv.className = "err-msg";
      errDiv.textContent = "⚠ No images returned. Try a different prompt.";
      aiRow.appendChild(errDiv);
      return;
    }

    const rc = RC[R] || "ra"; // CSS class for aspect ratio

    if (C === 1 || imageUrls.length === 1) {
      // Single image — show full card
      aiRow.appendChild(makeCard(imageUrls[0], P, rc));
    } else {
      // Multiple images — show grid
      const grid = document.createElement("div");
      grid.className = `igrid n${imageUrls.length}`;

      imageUrls.forEach(src => {
        const cell = document.createElement("div");
        cell.className = "gcell";
        const img = document.createElement("img");
        img.src = src;
        img.alt = P;
        img.loading = "lazy";
        img.onclick = () => openViewer(src);
        cell.appendChild(img);
        grid.appendChild(cell);
      });

      // Title + action buttons below the grid
      const footer = document.createElement("div");
      footer.className = "gfoot";
      footer.innerHTML = `
        <span class="gft">${clamp(P, 28)}</span>
        <div class="gacts">
          <div class="ga" onclick="dlImg('${imageUrls[0]}')">
            <i class="fas fa-download"></i>
          </div>
          <div class="ga">
            <i class="fas fa-share-alt"></i>
          </div>
        </div>`;

      aiRow.appendChild(grid);
      aiRow.appendChild(footer);
    }

    // ── Save to history ──
    addHistory(P, imageUrls[0]);
    scrollBottom();

  } catch (err) {
    // Network error (server not running, etc.)
    aiRow.innerHTML = "";
    const errDiv = document.createElement("div");
    errDiv.className = "err-msg";
    errDiv.innerHTML = `⚠ Could not reach server.<br><small>Make sure the backend is running.</small>`;
    aiRow.appendChild(errDiv);
    scrollBottom();
    console.error("Fetch error:", err);
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPER: Create a single image card
// ─────────────────────────────────────────────────────────────────

function makeCard(src, title, ratioClass) {
  const card = document.createElement("div");
  card.className = "acard";
  card.innerHTML = `
    <div class="aimg ${ratioClass}">
      <img src="${src}" alt="${escHtml(title)}" loading="lazy">
    </div>
    <div class="ainfo">
      <div class="atitle">${clamp(escHtml(title), 34)}</div>
      <div class="adesc">AI generated · ${S.ratio}</div>
    </div>
    <div class="aacts">
      <div class="abtn dl-b"><i class="fas fa-download"></i> Download</div>
      <div class="abtn sh-b"><i class="fas fa-share-alt"></i> Share</div>
    </div>`;

  // Click image to open fullscreen viewer
  card.querySelector(".aimg").onclick = () => openViewer(src);

  // Download button
  card.querySelector(".dl-b").onclick = e => {
    e.stopPropagation();
    dlImg(src);
  };

  // Share button
  card.querySelector(".sh-b").onclick = e => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: title, url: src });
    } else {
      navigator.clipboard?.writeText(src);
      alert("Image URL copied to clipboard!");
    }
  };

  return card;
}

// ─────────────────────────────────────────────────────────────────
// HELPER: Create loading shimmer card
// ─────────────────────────────────────────────────────────────────

function makeShimmer() {
  const d = document.createElement("div");
  d.className = "shim";
  d.innerHTML = `
    <div class="shim-img ra"></div>
    <div class="shim-body">
      <div class="sl"></div>
      <div class="sl s"></div>
    </div>
    <div class="shim-cap">Creating cinematic magic…</div>`;
  return d;
}

// ─────────────────────────────────────────────────────────────────
// FULLSCREEN VIEWER
// ─────────────────────────────────────────────────────────────────

function openViewer(src) {
  S.vSrc = src;
  $("vwImg").src = src;
  $("vw").classList.add("on");
}

$("vwX").onclick  = () => $("vw").classList.remove("on");
$("vwDl").onclick = () => dlImg(S.vSrc);
$("vwSh").onclick = () => {
  if (navigator.share) navigator.share({ url: S.vSrc });
  else navigator.clipboard?.writeText(S.vSrc);
};
$("vwDel").onclick = () => {
  // In a real app this would remove the message from chat too
  $("vw").classList.remove("on");
};

// Close viewer on backdrop click
$("vw").onclick = e => {
  if (e.target === $("vw") || e.target === $("vw").querySelector(".vi")) {
    $("vw").classList.remove("on");
  }
};

// ─────────────────────────────────────────────────────────────────
// DOWNLOAD FUNCTION
// ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function dlImg(src) {
  const a = document.createElement("a");
  a.href = src;
  a.download = "jeeshu-ai-" + Date.now() + ".jpg";
  a.target = "_blank";
  a.rel = "noopener";
  a.click();
}

// ─────────────────────────────────────────────────────────────────
// HISTORY — saved in localStorage so it persists after page refresh
// ─────────────────────────────────────────────────────────────────

// Load history from localStorage when page opens
function loadHistory() {
  try {
    const saved = localStorage.getItem("jeeshu-ai-history");
    if (saved) S.hist = JSON.parse(saved);
  } catch (e) {
    S.hist = [];
  }
  renderHistory();
}

// Save history to localStorage
function saveHistory() {
  try {
    // Keep only the last 50 items
    localStorage.setItem("jeeshu-ai-history", JSON.stringify(S.hist.slice(0, 50)));
  } catch (e) {
    console.warn("Could not save history:", e);
  }
}

// Add a new item to history
function addHistory(title, thumbUrl) {
  S.hist.unshift({
    title,
    thumb: thumbUrl,
    time:  Date.now(),
  });
  saveHistory();
  renderHistory();
}

// Render history items in sidebar
function renderHistory() {
  const container = $("hlist");
  container.innerHTML = "";

  if (S.hist.length === 0) {
    container.innerHTML = `<div style="padding:18px 14px;font-size:12px;color:var(--t3);text-align:center;">No history yet</div>`;
    return;
  }

  S.hist.forEach(item => {
    const el = document.createElement("div");
    el.className = "h-item";
    el.innerHTML = `
      <div class="h-th">
        <img src="${item.thumb}" alt="${escHtml(item.title)}" loading="lazy">
      </div>
      <div class="h-txt">
        <div class="h-name">${clamp(escHtml(item.title), 22)}</div>
        <div class="h-age">${timeAgo(item.time)}</div>
      </div>`;
    el.onclick = () => {
      closeSB();
      openViewer(item.thumb);
    };
    container.appendChild(el);
  });
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

// Scroll chat to bottom
function scrollBottom() {
  const chat = $("chat");
  chat.scrollTop = chat.scrollHeight;
}

// Shorten text with ellipsis
function clamp(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// Prevent XSS by escaping HTML characters
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Human-readable time ("2 minutes ago")
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// ─────────────────────────────────────────────────────────────────
// INIT: Run on page load
// ─────────────────────────────────────────────────────────────────

loadHistory(); // Load saved history from localStorage
