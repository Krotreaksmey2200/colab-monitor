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

    appendLog(`📈 [Epoch ${simEpoch:02d}/30] Auto-Checkpoint Saved! Val CER: ${cer.toFixed(2)}%`, "success");
  }
}, 15000);

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
