import { WebSocketServer } from "ws";
import { exec } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { randomBytes } from "crypto";
import { join, resolve, sep } from "path";
import { homedir } from "os";

// ── Config ──────────────────────────────────────────────────
const CONFIG = JSON.parse(readFileSync(new URL("./config.json", import.meta.url)));
const PROJECT_PATH = resolve(CONFIG.allowedProjectPath);
const PORT = CONFIG.port || 8787;

// ── Pairing token — persisted so it survives restarts, but you can
// delete this file any time to force re-pairing (e.g. if you think
// the token leaked). ──────────────────────────────────────────
const TOKEN_FILE = join(homedir(), ".gi-agent-token");
let TOKEN;
if (existsSync(TOKEN_FILE)) {
  TOKEN = readFileSync(TOKEN_FILE, "utf8").trim();
} else {
  TOKEN = randomBytes(16).toString("hex");
  writeFileSync(TOKEN_FILE, TOKEN);
}

console.log("═══════════════════════════════════════════");
console.log("  GI Local Agent");
console.log("═══════════════════════════════════════════");
console.log(`  Listening on: ws://127.0.0.1:${PORT}`);
console.log(`  Allowed project: ${PROJECT_PATH}`);
console.log(`  Pairing token: ${TOKEN}`);
console.log("  (Paste this token into GI's Local Agent panel)");
console.log("═══════════════════════════════════════════");

// ── Fixed, safe app-open commands — no arbitrary app names accepted. ──
const APP_COMMANDS = {
  vscode: process.platform === "darwin" ? 'open -a "Visual Studio Code"' : "code",
  chrome: process.platform === "darwin" ? 'open -a "Google Chrome"' : "google-chrome",
  terminal: process.platform === "darwin" ? "open -a Terminal" : "x-terminal-emulator",
};

const recentActions = [];
function logAction(entry) {
  recentActions.unshift({ ...entry, t: Date.now() });
  if (recentActions.length > 30) recentActions.pop();
}

// Prevents any path traversal outside the allowlisted project folder —
// this is the core safety boundary for create_file/create_folder.
function safeJoin(base, relativePath) {
  const target = resolve(base, relativePath);
  if (!target.startsWith(base + sep) && target !== base) {
    throw new Error("Path escapes the allowed project directory");
  }
  return target;
}

function run(cmd, cwd, cb) {
  exec(cmd, { cwd, timeout: 120000 }, (err, stdout, stderr) => {
    cb(err ? (stderr || err.message) : stdout, !err);
  });
}

// ── The ONLY actions this agent can ever perform. Nothing here
// accepts a free-form shell string from the client — every action
// type has fixed, narrow parameters. ──────────────────────────
function executeAction(action, payload) {
  return new Promise((resolvePromise) => {
    try {
      switch (action) {
        case "open_app": {
          const cmd = APP_COMMANDS[payload?.app];
          if (!cmd) return resolvePromise({ ok: false, output: "Unknown app" });
          run(cmd, undefined, (output, ok) => resolvePromise({ ok, output: output || `Opened ${payload.app}` }));
          return;
        }
        case "open_project": {
          const cmd = process.platform === "darwin"
            ? `open -a "Visual Studio Code" "${PROJECT_PATH}"`
            : `code "${PROJECT_PATH}"`;
          run(cmd, undefined, (output, ok) => resolvePromise({ ok, output: output || "Opened project in VS Code" }));
          return;
        }
        case "create_folder": {
          const name = String(payload?.name || "").trim();
          if (!name || /[/\\]/.test(name)) return resolvePromise({ ok: false, output: "Invalid folder name" });
          const target = safeJoin(PROJECT_PATH, name);
          mkdirSync(target, { recursive: true });
          resolvePromise({ ok: true, output: `Created folder: ${name}` });
          return;
        }
        case "create_file": {
          const name = String(payload?.name || "").trim();
          if (!name || name.includes("..")) return resolvePromise({ ok: false, output: "Invalid file name" });
          const target = safeJoin(PROJECT_PATH, name);
          writeFileSync(target, payload?.content || "", { flag: "wx" }); // 'wx' = never overwrite existing files
          resolvePromise({ ok: true, output: `Created file: ${name}` });
          return;
        }
        case "run_npm_script": {
          const script = payload?.script;
          if (!CONFIG.allowedNpmScripts.includes(script)) {
            return resolvePromise({ ok: false, output: "Script not in allowlist" });
          }
          run(`npm run ${script}`, PROJECT_PATH, (output, ok) => resolvePromise({ ok, output }));
          return;
        }
        default:
          resolvePromise({ ok: false, output: "Unknown action" });
      }
    } catch (err) {
      resolvePromise({ ok: false, output: err.message });
    }
  });
}

// ── WebSocket server — localhost ONLY, never bind 0.0.0.0 ──────
const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });

wss.on("connection", (ws) => {
  let paired = false;

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "pair") {
      paired = msg.token === TOKEN;
      ws.send(JSON.stringify({ type: "pair_result", ok: paired }));
      return;
    }

    if (!paired) {
      ws.send(JSON.stringify({ type: "error", message: "Not paired" }));
      return;
    }

    if (msg.type === "get_log") {
      ws.send(JSON.stringify({ type: "log", entries: recentActions }));
      return;
    }

    if (msg.type === "action") {
      const result = await executeAction(msg.action, msg.payload);
      logAction({ action: msg.action, payload: msg.payload, ok: result.ok });
      ws.send(JSON.stringify({ type: "action_result", requestId: msg.requestId, ...result }));
      return;
    }
  });

  ws.send(JSON.stringify({ type: "hello", projectPath: PROJECT_PATH }));
});

console.log("Agent ready. Waiting for GI to connect...");