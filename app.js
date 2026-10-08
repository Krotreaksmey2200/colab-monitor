// Colab Anti-Disconnect & OCR Telemetry Monitor

let wakeLock = null;
let pingCount = 0;
let pingIntervalSec = 60;
let secondsSinceStart = 0;
let timerLoop = null;
let isAudioActive = true;

// DOM Elements
const wakeLockBtn = document.getElementById("wakeLockBtn");
const wakeLockState = document.getElementById("wakeLockState");
const toggleSoundBtn = document.getElementById("toggleSoundBtn");
const audioState = document.getElementById("audioState");
const silentAudio = document.getElementById("silentAudio");
const intervalSelect = document.getElementById("intervalSelect");
const scriptCodeBlock = document.getElementById("scriptCodeBlock");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const copyIcon = document.getElementById("copyIcon");
const pingerBar = document.getElementById("pingerBar");
const pingStats = document.getElementById("pingStats");
const consoleLog = document.getElementById("consoleLog");
const sendTestPingBtn = document.getElementById("sendTestPingBtn");
const clearLogBtn = document.getElementById("clearLogBtn");
const bookmarkletLink = document.getElementById("bookmarkletLink");

// Telemetry Elements
const liveSimToggle = document.getElementById("liveSimToggle");
const currentEpochVal = document.getElementById("currentEpochVal");
const epochProgressFill = document.getElementById("epochProgressFill");
const currentCerVal = document.getElementById("currentCerVal");
const currentLossVal = document.getElementById("currentLossVal");
const valLossSub = document.getElementById("valLossSub");
const savedCountVal = document.getElementById("savedCountVal");
const gtText = document.getElementById("gtText");
const predText = document.getElementById("predText");
const sampleImgCanvas = document.getElementById("sampleImgCanvas");
const lossCanvas = document.getElementById("lossCanvas");
const cerCanvas = document.getElementById("cerCanvas");

// Sample text database for simulated / real stream
const sampleDatabase = [
  { text: "គណនាកន្សោម $f(x) = 2x^2 + 5$", cls: "Khmer & Math" },
  { text: "តម្លៃនៃ $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$", cls: "Khmer & Math" },
  { text: "ដោះស្រាយសមីការ $3x - 12 = 0$", cls: "Khmer & Math" },
  { text: "ផលបូកចំនួនកុំផ្លិច $z = a + bi$", cls: "Khmer & Math" },
  { text: "ក្រឡាផ្ទៃរង្វង់ $S = \\pi r^2$", cls: "Khmer & Math" },
  { text: "ត្រីកោណមាត្រ $\\sin^2 \\theta + \\cos^2 \\theta = 1$", cls: "Khmer & Math" },
  { text: "អនុគមន៍លីនេអ៊ែរ $y = ax + b$", cls: "Khmer & Math" }
];

// 1. Screen Wake Lock API
async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLockState.innerText = "ACTIVE";
      wakeLockBtn.classList.remove("btn-secondary");
      wakeLockBtn.classList.add("btn-primary");
      appendLog("🛡️ Screen Wake Lock ត្រូវបានបើកដំណើរការ (អេក្រង់នឹងមិនបិទ)!", "success");

      wakeLock.addEventListener("release", () => {
        wakeLockState.innerText = "OFF";
        wakeLockBtn.classList.remove("btn-primary");
        wakeLockBtn.classList.add("btn-secondary");
        appendLog("⚠️ Screen Wake Lock ត្រូវបានដោះលែង។", "warn");
      });
    } catch (err) {
      appendLog(`⚠️ Wake Lock Error: ${err.message}`, "warn");
    }
  } else {
    appendLog("⚠️ Browser នេះមិនទាន់ Support Screen Wake Lock API ទេ។", "warn");
  }
}

async function toggleWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  } else {
    await requestWakeLock();
  }
}

// Re-acquire wake lock if tab is focused back
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await requestWakeLock();
  }
});

// 2. Background Audio Keep-Alive
function toggleAudio() {
  isAudioActive = !isAudioActive;
  if (isAudioActive) {
    silentAudio.play().catch(() => {});
    audioState.innerText = "ON";
    toggleSoundBtn.classList.remove("btn-outline");
    toggleSoundBtn.classList.add("btn-secondary");
    appendLog("🔊 Background Keep-Alive Audio បានបើក!", "info");
  } else {
    silentAudio.pause();
    audioState.innerText = "OFF";
    toggleSoundBtn.classList.remove("btn-secondary");
    toggleSoundBtn.classList.add("btn-outline");
    appendLog("🔇 Background Audio ត្រូវបានបិទ។", "warn");
  }
}

// 3. Script Generator & Bookmarklet
function updateScript(interval) {
  pingIntervalSec = parseInt(interval);
  const code = `// Colab Auto Anti-Disconnect Script (${pingIntervalSec}s)
function keepAlive() {
  const btn = document.querySelector("colab-connect-button") 
           || document.querySelector("#connect") 
           || document.querySelector("colab-toolbar-button")
           || document.querySelector("paper-button#connect");
  if (btn) {
    btn.click();
    console.log("⚡ [" + new Date().toLocaleTimeString() + "] Colab pinged successfully!");
  }
}
setInterval(keepAlive, ${pingIntervalSec * 1000});
console.log("🛡️ Colab Keep-Alive 24H is running (${pingIntervalSec}s interval)!");`;

  scriptCodeBlock.innerText = code;

  // Update Bookmarklet href
  const bkmk = `javascript:(function(){let c=0;const n=document.createElement('div');n.style.cssText='position:fixed;top:10px;right:10px;z-index:999999;background:#10b981;color:#fff;padding:8px 14px;border-radius:8px;font-family:sans-serif;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:bold;';n.innerText='⚡ Colab Keep-Alive Active!';document.body.appendChild(n);setInterval(function(){const b=document.querySelector('colab-connect-button')||document.querySelector('#connect')||document.querySelector('colab-toolbar-button');if(b){b.click();c++;n.innerText='⚡ Active ('+c+' pings)';}},${pingIntervalSec*1000});console.log('Colab Keep-Alive Started!');})();`;
  bookmarkletLink.setAttribute("href", bkmk);
}

intervalSelect.addEventListener("change", (e) => {
  updateScript(e.target.value);
  appendLog(`⚙️ បានប្ដូរ Interval ទៅជា ${e.target.value} វិនាទី។`, "info");
});

// Copy script button
copyScriptBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(scriptCodeBlock.innerText).then(() => {
    copyIcon.innerText = "✅";
    copyScriptBtn.innerText = "✅ បានចម្លងរួចរាល់ (Copied!)";
    copyScriptBtn.style.background = "#10b981";
    copyScriptBtn.style.color = "#000";
    appendLog("📋 បាន Copy កូដ Console Script! សូមយកទៅ Paste ក្នុង Console នៃ Colab។", "success");

    setTimeout(() => {
      copyIcon.innerText = "📋";
      copyScriptBtn.innerText = "📋 ចម្លងកូដ (Copy)";
      copyScriptBtn.style.background = "";
      copyScriptBtn.style.color = "";
    }, 2000);
  });
});

// 4. Log helper
function appendLog(msg, type = "info") {
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
  line.innerText = `${timeStr} ${msg}`;
  consoleLog.appendChild(line);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}

clearLogBtn.addEventListener("click", () => {
  consoleLog.innerHTML = "";
  appendLog("បានសម្អាត Log។", "info");
});

sendTestPingBtn.addEventListener("click", () => {
  pingCount++;
  appendLog(`⚡ [Test Ping #${pingCount}] បានក្លែងធ្វើការចុច Keep-Alive ដោយជោគជ័យ!`, "success");
  updatePingDisplay();
});

// 5. Timer & Progress Heartbeat
function updatePingDisplay() {
  const mins = Math.floor(secondsSinceStart / 60);
  pingStats.innerText = `ដំណើរការបាន: ${mins} នាទី | Pings: ${pingCount} ដង`;
}

function startHeartbeat() {
  timerLoop = setInterval(() => {
    secondsSinceStart++;
    const progressPct = ((secondsSinceStart % pingIntervalSec) / pingIntervalSec) * 100;
    pingerBar.style.width = `${progressPct}%`;

    if (secondsSinceStart % pingIntervalSec === 0) {
      pingCount++;
      appendLog(`⚡ [Auto-Ping #${pingCount}] រក្សា Connection សកម្មជានិច្ច...`, "info");
      updatePingDisplay();
    }
  }, 1000);
}

// 6. Canvas Chart Drawing
const trainingHistory = {
  epochs: [1, 2, 3, 4, 5, 6, 7, 8],
  trainLoss: [1.85, 1.12, 0.74, 0.49, 0.32, 0.22, 0.16, 0.13],
  valLoss: [1.98, 1.25, 0.82, 0.58, 0.39, 0.28, 0.21, 0.16],
  valCer: [16.5, 9.8, 6.2, 4.1, 2.8, 2.1, 1.7, 1.42]
};

function drawLossChart() {
  const ctx = lossCanvas.getContext("2d");
  const w = lossCanvas.width;
  const h = lossCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 20, right: 30, bottom: 25, left: 40 };
  const graphW = w - pad.left - pad.right;
  const graphH = h - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (graphH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  const maxLoss = 2.2;
  const n = 30; // max 30 epochs

  // Train Loss line (Blue)
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  trainingHistory.trainLoss.forEach((loss, i) => {
    const x = pad.left + (graphW / (n - 1)) * i;
    const y = pad.top + graphH * (1 - loss / maxLoss);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Val Loss line (Amber)
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  trainingHistory.valLoss.forEach((loss, i) => {
    const x = pad.left + (graphW / (n - 1)) * i;
    const y = pad.top + graphH * (1 - loss / maxLoss);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Legend
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("● Train Loss", w - 160, 16);
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("● Val Loss", w - 85, 16);
}

function drawCerChart() {
  const ctx = cerCanvas.getContext("2d");
  const w = cerCanvas.width;
  const h = cerCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 20, right: 30, bottom: 25, left: 40 };
  const graphW = w - pad.left - pad.right;
  const graphH = h - pad.top - pad.bottom;

  // Grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (graphH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  const maxCer = 20.0;
  const n = 30;

  // CER curve (Green)
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  trainingHistory.valCer.forEach((cer, i) => {
    const x = pad.left + (graphW / (n - 1)) * i;
    const y = pad.top + graphH * (1 - cer / maxCer);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw points
  trainingHistory.valCer.forEach((cer, i) => {
    const x = pad.left + (graphW / (n - 1)) * i;
    const y = pad.top + graphH * (1 - cer / maxCer);
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Target line at 2%
  const targetY = pad.top + graphH * (1 - 2.0 / maxCer);
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, targetY);
  ctx.lineTo(w - pad.right, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#10b981";
  ctx.fillText("● Validation CER (%)", pad.left + 5, 16);
  ctx.fillStyle = "#f43f5e";
  ctx.fillText("-- Target 2%", w - 90, 16);
}

// 7. Synthetic Image Generator for Preview
function renderSampleImage(text) {
  const ctx = sampleImgCanvas.getContext("2d");
  const w = sampleImgCanvas.width;
  const h = sampleImgCanvas.height;

  // Background with subtle texture
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Subtle noise lines
  ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  ctx.lineTo(w, h * 0.7);
  ctx.stroke();

  // Text
  ctx.fillStyle = "#0f172a";
  ctx.font = "600 17px 'Kantumruy Pro', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
}

// 8. Live Simulation Cycle (Advances every 15s when toggle is on)
let simEpoch = 8;
setInterval(() => {
  if (liveSimToggle.checked && simEpoch < 30) {
    simEpoch++;
    const trainL = Math.max(0.04, trainingHistory.trainLoss[trainingHistory.trainLoss.length - 1] * 0.88);
    const valL = Math.max(0.06, trainingHistory.valLoss[trainingHistory.valLoss.length - 1] * 0.90);
    const cer = Math.max(0.75, trainingHistory.valCer[trainingHistory.valCer.length - 1] * 0.91);

    trainingHistory.epochs.push(simEpoch);
    trainingHistory.trainLoss.push(trainL);
    trainingHistory.valLoss.push(valL);
    trainingHistory.valCer.push(cer);

    // Update UI
    currentEpochVal.innerHTML = `${String(simEpoch).padStart(2, '0')} <span class="metric-sub">/ 30</span>`;
    epochProgressFill.style.width = `${(simEpoch / 30) * 100}%`;
    currentCerVal.innerText = `${cer.toFixed(2)}%`;
    currentLossVal.innerText = trainL.toFixed(3);
    valLossSub.innerText = `Val Loss: ${valL.toFixed(3)}`;
    savedCountVal.innerHTML = `${simEpoch} <span class="metric-sub">Checkpoints</span>`;

    // Rotate sample
    const sample = sampleDatabase[simEpoch % sampleDatabase.length];
    gtText.innerText = sample.text;
    predText.innerText = sample.text;
    renderSampleImage(sample.text);

    drawLossChart();
    drawCerChart();

    appendLog(`📈 [Epoch ${String(simEpoch).padStart(2, '0')}/30] Auto-Checkpoint Saved! Val CER: ${cer.toFixed(2)}%`, "success");
  }
}, 15000);

// =========================================================================
// 9. COLAB NOTEBOOK UPLOADER & KEEP-ALIVE INJECTOR
// =========================================================================

let currentNotebookData = null;
let currentNotebookFilename = "";

const dropZone = document.getElementById("dropZone");
const colabFileInput = document.getElementById("colabFileInput");
const browseFileBtn = document.getElementById("browseFileBtn");
const uploadedPanel = document.getElementById("uploadedPanel");
const uploadedFileName = document.getElementById("uploadedFileName");
const uploadedFileStats = document.getElementById("uploadedFileStats");
const removeUploadedFileBtn = document.getElementById("removeUploadedFileBtn");
const detectedTagsRow = document.getElementById("detectedTagsRow");
const injectKeepAliveBtn = document.getElementById("injectKeepAliveBtn");
const toggleCellViewerBtn = document.getElementById("toggleCellViewerBtn");
const copyAllCodeBtn = document.getElementById("copyAllCodeBtn");
const cellCountBadge = document.getElementById("cellCountBadge");
const notebookCellsViewer = document.getElementById("notebookCellsViewer");
const cellsListContainer = document.getElementById("cellsListContainer");
const collapseCellsBtn = document.getElementById("collapseCellsBtn");

if (browseFileBtn && colabFileInput) {
  browseFileBtn.addEventListener("click", () => colabFileInput.click());
  dropZone.addEventListener("click", (e) => {
    if (e.target !== browseFileBtn) colabFileInput.click();
  });

  // Drag and drop events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNotebookFile(e.dataTransfer.files[0]);
    }
  });

  colabFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleNotebookFile(e.target.files[0]);
    }
  });
}

function handleNotebookFile(file) {
  if (!file.name.endsWith(".ipynb") && !file.name.endsWith(".json")) {
    alert("⚠️ សូមជ្រើសរើសឯកសារ Jupyter Notebook (.ipynb)");
    return;
  }

  currentNotebookFilename = file.name;
  const fileSizeKB = (file.size / 1024).toFixed(1);

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const nb = JSON.parse(event.target.result);
      if (!nb.cells || !Array.isArray(nb.cells)) {
        throw new Error("ទម្រង់ឯកសារមិនត្រឹមត្រូវ (No cells array found)");
      }
      currentNotebookData = nb;

      // Stats
      const totalCells = nb.cells.length;
      const codeCells = nb.cells.filter(c => c.cell_type === "code").length;
      const mdCells = nb.cells.filter(c => c.cell_type === "markdown").length;

      uploadedFileName.innerText = file.name;
      uploadedFileStats.innerText = `ទំហំ: ${fileSizeKB} KB | កោសិកា: ${totalCells} (${codeCells} Code, ${mdCells} Markdown)`;
      cellCountBadge.innerText = totalCells;

      // Smart Feature Detection
      detectFeatures(nb);

      // Render cell list
      renderCellsPreview(nb.cells);

      // UI Switch
      dropZone.style.display = "none";
      uploadedPanel.style.display = "flex";
      appendLog(`📂 បាន Upload Notebook: ${file.name} (${totalCells} Cells)`, "info");
    } catch (err) {
      alert(`⚠️ មិនអាចអាន Notebook បានទេ: ${err.message}`);
      appendLog(`❌ Error parsing notebook: ${err.message}`, "warn");
    }
  };
  reader.readAsText(file);
}

function detectFeatures(nb) {
  detectedTagsRow.innerHTML = "";
  const allText = nb.cells.map(c => {
    if (Array.isArray(c.source)) return c.source.join("");
    return String(c.source || "");
  }).join("\n").toLowerCase();

  const features = [];
  if (allText.includes("torch") || allText.includes("nn.module")) features.push({ name: "PyTorch", color: "#f43f5e" });
  if (allText.includes("cuda") || allText.includes("gpu")) features.push({ name: "CUDA/GPU", color: "#10b981" });
  if (allText.includes("lora") || allText.includes("peft")) features.push({ name: "LoRA Fine-Tune", color: "#f59e0b" });
  if (allText.includes("timm") || allText.includes("visiontransformer")) features.push({ name: "ViT / timm", color: "#38bdf8" });
  if (allText.includes("huggingface") || allText.includes("datasets")) features.push({ name: "Hugging Face", color: "#fbbf24" });
  if (allText.includes("autocast") || allText.includes("amp")) features.push({ name: "Mixed Precision (AMP)", color: "#a855f7" });
  if (allText.includes("keepalive") || allText.includes("colab-connect")) features.push({ name: "Keep-Alive Injected", color: "#34d399" });

  if (features.length === 0) {
    features.push({ name: "Jupyter Notebook", color: "#38bdf8" });
  }

  features.forEach(f => {
    const span = document.createElement("span");
    span.className = "detect-tag";
    span.style.borderColor = f.color;
    span.style.color = f.color;
    span.innerText = `🏷️ ${f.name}`;
    detectedTagsRow.appendChild(span);
  });
}

function renderCellsPreview(cells) {
  cellsListContainer.innerHTML = "";
  cells.forEach((cell, idx) => {
    const card = document.createElement("div");
    card.className = "cell-card";

    const top = document.createElement("div");
    top.className = "cell-card-top";

    const typeSpan = document.createElement("span");
    typeSpan.className = `cell-type-badge ${cell.cell_type}`;
    typeSpan.innerText = `[${idx + 1}] ${cell.cell_type.toUpperCase()}`;

    const linesCount = Array.isArray(cell.source) ? cell.source.length : String(cell.source || "").split("\n").length;
    const lenSpan = document.createElement("span");
    lenSpan.innerText = `${linesCount} បន្ទាត់`;

    top.appendChild(typeSpan);
    top.appendChild(lenSpan);

    const pre = document.createElement("pre");
    pre.className = "cell-code-preview";
    const codeText = Array.isArray(cell.source) ? cell.source.join("") : String(cell.source || "");
    pre.innerText = codeText.slice(0, 350) + (codeText.length > 350 ? "\n... (ច្រើនទៀត)" : "");

    card.appendChild(top);
    card.appendChild(pre);
    cellsListContainer.appendChild(card);
  });
}

// Reset Upload
if (removeUploadedFileBtn) {
  removeUploadedFileBtn.addEventListener("click", () => {
    currentNotebookData = null;
    currentNotebookFilename = "";
    colabFileInput.value = "";
    uploadedPanel.style.display = "none";
    dropZone.style.display = "block";
    notebookCellsViewer.style.display = "none";
  });
}

// Toggle cell viewer
if (toggleCellViewerBtn) {
  toggleCellViewerBtn.addEventListener("click", () => {
    if (notebookCellsViewer.style.display === "none") {
      notebookCellsViewer.style.display = "flex";
      toggleCellViewerBtn.innerText = "❌ បិទមើលកោសិកា";
    } else {
      notebookCellsViewer.style.display = "none";
      toggleCellViewerBtn.innerHTML = `👁️ មើលកោសិកាកូដ (<span id="cellCountBadge">${currentNotebookData ? currentNotebookData.cells.length : 0}</span>)`;
    }
  });
}

if (collapseCellsBtn) {
  collapseCellsBtn.addEventListener("click", () => {
    notebookCellsViewer.style.display = "none";
    if (toggleCellViewerBtn) {
      toggleCellViewerBtn.innerHTML = `👁️ មើលកោសិកាកូដ (<span id="cellCountBadge">${currentNotebookData ? currentNotebookData.cells.length : 0}</span>)`;
    }
  });
}

// Copy All Code
if (copyAllCodeBtn) {
  copyAllCodeBtn.addEventListener("click", () => {
    if (!currentNotebookData) return;
    const allCode = currentNotebookData.cells
      .filter(c => c.cell_type === "code")
      .map(c => Array.isArray(c.source) ? c.source.join("") : String(c.source || ""))
      .join("\n\n# ==========================================\n\n");

    navigator.clipboard.writeText(allCode).then(() => {
      copyAllCodeBtn.innerText = "✅ បានចម្លងជោគជ័យ!";
      setTimeout(() => {
        copyAllCodeBtn.innerText = "📋 ចម្លងកូដទាំងអស់";
      }, 2000);
      appendLog("📋 បានចម្លងកូដ Python ទាំងអស់ចូលក្នុង Clipboard!", "success");
    });
  });
}

// Inject Keep-Alive & Download
if (injectKeepAliveBtn) {
  injectKeepAliveBtn.addEventListener("click", () => {
    if (!currentNotebookData) return;

    // Clone notebook
    const updatedNb = JSON.parse(JSON.stringify(currentNotebookData));

    // Keep-alive cell
    const keepAliveCell = {
      cell_type: "code",
      execution_count: null,
      metadata: { id: "colab_keepalive_24h_injected" },
      outputs: [],
      source: [
        "# =========================================================================\n",
        "# 🛡️ COLAB 24H ANTI-DISCONNECT KEEP-ALIVE (Injected by Colab Keeper)\n",
        "# ដំណើការស្វ័យប្រវត្តិដើម្បីការពារកុំឱ្យ Google Colab ដាច់ Connection\n",
        "# =========================================================================\n",
        "import IPython\n",
        "IPython.display.display(IPython.display.Javascript('''\n",
        "  (function() {\n",
        "    let count = 0;\n",
        "    const notify = document.createElement('div');\n",
        "    notify.style.cssText = 'position:fixed;top:14px;right:14px;z-index:999999;background:#10b981;color:#fff;padding:8px 16px;border-radius:8px;font-family:sans-serif;font-size:12px;font-weight:bold;box-shadow:0 4px 14px rgba(0,0,0,0.35);';\n",
        "    notify.innerText = '⚡ Colab Keep-Alive Active!';\n",
        "    document.body.appendChild(notify);\n",
        "    setInterval(function() {\n",
        "      const btn = document.querySelector('colab-connect-button') || document.querySelector('#connect') || document.querySelector('colab-toolbar-button');\n",
        "      if (btn) { btn.click(); count++; notify.innerText = '⚡ Keep-Alive Active (' + count + ' pings)'; }\n",
        "    }, 60000);\n",
        "    console.log('⚡ Colab Keep-Alive Active!');\n",
        "  })();\n",
        "'''))\n"
      ]
    };

    // Prepend to cells
    updatedNb.cells.unshift(keepAliveCell);

    // Create Download Blob
    const blob = new Blob([JSON.stringify(updatedNb, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const newName = currentNotebookFilename.replace(".ipynb", "") + "_with_keepalive.ipynb";
    a.href = downloadUrl;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    appendLog(`🛡️ បានចាក់បញ្ចូល Keep-Alive និងទាញយក: ${newName}`, "success");
    injectKeepAliveBtn.innerText = "✅ បានបញ្ចូល & ទាញយករួច!";
    setTimeout(() => {
      injectKeepAliveBtn.innerText = "🛡️ បញ្ចូល Keep-Alive + ទាញយក";
    }, 2500);
  });
}

// =========================================================================
// 10. GOOGLE COLAB EMBEDDED WEBVIEW CONTROLLER
// =========================================================================

const webviewContainer = document.getElementById("webviewContainer");
const colabIframe = document.getElementById("colabIframe");
const colabUrlInput = document.getElementById("colabUrlInput");
const loadColabUrlBtn = document.getElementById("loadColabUrlBtn");
const openPopupColabBtn = document.getElementById("openPopupColabBtn");
const openTabColabBtn = document.getElementById("openTabColabBtn");
const copyColabUrlBtn = document.getElementById("copyColabUrlBtn");
const toggleFullscreenBtn = document.getElementById("toggleFullscreenBtn");

function refreshColabIframe() {
  const url = colabUrlInput.value.trim();
  if (url) {
    colabIframe.src = url;
    if (openTabColabBtn) openTabColabBtn.href = url;
    appendLog(`🌐 កំពុងផ្ទុក Colab URL ឡើងវិញ: ${url.slice(0, 45)}...`, "info");
  }
}

if (loadColabUrlBtn) {
  loadColabUrlBtn.addEventListener("click", refreshColabIframe);
}

if (colabUrlInput) {
  colabUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") refreshColabIframe();
  });
}

if (openPopupColabBtn) {
  openPopupColabBtn.addEventListener("click", () => {
    const url = colabUrlInput ? colabUrlInput.value.trim() : "https://colab.research.google.com/drive/1OMZLKPw7Lr17xokY0q5_5UYUW7Y38VNK?usp=sharing";
    window.open(url, "GoogleColabApp", "width=1280,height=850,menubar=no,status=no,toolbar=no,location=yes,scrollbars=yes,resizable=yes");
    appendLog("🪟 បានបើក Colab ជាផ្ទាំង Popup App ដាច់ដោយឡែក!", "success");
  });
}

if (copyColabUrlBtn) {
  copyColabUrlBtn.addEventListener("click", () => {
    const url = colabUrlInput ? colabUrlInput.value.trim() : "";
    navigator.clipboard.writeText(url).then(() => {
      copyColabUrlBtn.innerText = "✅ Copied!";
      setTimeout(() => {
        copyColabUrlBtn.innerText = "📋 Copy Link";
      }, 2000);
      appendLog("📋 បានចម្លង Colab Link ចូល clipboard!", "success");
    });
  });
}

if (toggleFullscreenBtn && webviewContainer) {
  toggleFullscreenBtn.addEventListener("click", () => {
    webviewContainer.classList.toggle("fullscreen");
    if (webviewContainer.classList.contains("fullscreen")) {
      toggleFullscreenBtn.innerText = "❌ ចាកចេញពីពេញអេក្រង់";
    } else {
      toggleFullscreenBtn.innerText = "⛶ ពេញអេក្រង់";
    }
  });

  // ESC key to exit fullscreen
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && webviewContainer.classList.contains("fullscreen")) {
      webviewContainer.classList.remove("fullscreen");
      toggleFullscreenBtn.innerText = "⛶ ពេញអេក្រង់";
    }
  });
}

// Colab Cell Execution Simulator
window.toggleCellRun = function(btn, outputId) {
  const out = document.getElementById(outputId);
  btn.classList.add("running");
  btn.innerText = "⏳";
  setTimeout(() => {
    btn.classList.remove("running");
    btn.innerText = "✓";
    if (out) out.style.display = "block";
    appendLog(`⚡ បានដំណើរការ Cell [${outputId}] ជោគជ័យ!`, "success");
    setTimeout(() => { btn.innerText = "▶"; }, 2000);
  }, 600);
};

const colabRunAllBtn = document.getElementById("colabRunAllBtn");
if (colabRunAllBtn) {
  colabRunAllBtn.addEventListener("click", () => {
    colabRunAllBtn.innerText = "⏳ Running All Cells...";
    const playButtons = document.querySelectorAll(".colab-play-btn");
    playButtons.forEach((btn, i) => {
      setTimeout(() => {
        btn.click();
      }, (i + 1) * 700);
    });
    setTimeout(() => {
      colabRunAllBtn.innerText = "▶ Run all";
      appendLog("🚀 បាន Run All កោសិកាទាំងអស់ក្នុង Colab Workspace!", "success");
    }, (playButtons.length + 1) * 750);
  });
}

// Mode Switching (Real Iframe vs Interactive Replica)
const modeIframeBtn = document.getElementById("modeIframeBtn");
const modeReplicaBtn = document.getElementById("modeReplicaBtn");
const realColabIframeView = document.getElementById("realColabIframeView");
const replicaColabView = document.getElementById("replicaColabView");
const iframeHelperBar = document.getElementById("iframeHelperBar");
const openAppWindowBtn = document.getElementById("openAppWindowBtn");

function switchColabMode(mode) {
  if (mode === "iframe") {
    if (modeIframeBtn) modeIframeBtn.classList.add("active");
    if (modeReplicaBtn) modeReplicaBtn.classList.remove("active");
    if (realColabIframeView) realColabIframeView.style.display = "block";
    if (replicaColabView) replicaColabView.style.display = "none";
    if (iframeHelperBar) iframeHelperBar.style.display = "flex";
    appendLog("🌐 បានប្តូរទៅកាន់ Mode: Live Colab Iframe ពិតប្រាកដ", "info");
  } else {
    if (modeReplicaBtn) modeReplicaBtn.classList.add("active");
    if (modeIframeBtn) modeIframeBtn.classList.remove("active");
    if (realColabIframeView) realColabIframeView.style.display = "none";
    if (replicaColabView) replicaColabView.style.display = "flex";
    if (iframeHelperBar) iframeHelperBar.style.display = "none";
    appendLog("📱 បានប្តូរទៅកាន់ Mode: Interactive Colab Replica", "info");
  }
}

if (modeIframeBtn) modeIframeBtn.addEventListener("click", () => switchColabMode("iframe"));
if (modeReplicaBtn) modeReplicaBtn.addEventListener("click", () => switchColabMode("replica"));

function openColabAsApp() {
  const url = colabUrlInput ? colabUrlInput.value.trim() : "https://colab.research.google.com/drive/1OMZLKPw7Lr17xokY0q5_5UYUW7Y38VNK?usp=sharing";
  window.open(url, "GoogleColabLiveApp", "width=1280,height=850,menubar=no,status=no,toolbar=no,location=yes,scrollbars=yes,resizable=yes");
  appendLog("🪟 បានបើក Colab ជា Real App Window ដាច់ដោយឡែក (ដំណើរការ ១០០%)!", "success");
}

if (openAppWindowBtn) openAppWindowBtn.addEventListener("click", openColabAsApp);
window.openColabAsApp = openColabAsApp;

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  updateScript(60);
  startHeartbeat();
  drawLossChart();
  drawCerChart();
  renderSampleImage(sampleDatabase[0].text);

  // Audio start on first user interaction
  document.body.addEventListener("click", () => {
    if (isAudioActive) silentAudio.play().catch(() => {});
  }, { once: true });

  wakeLockBtn.addEventListener("click", toggleWakeLock);
  toggleSoundBtn.addEventListener("click", toggleAudio);
  appendLog("🚀 Colab Keeper Dashboard ដំណើរការជោគជ័យ!", "success");
});


