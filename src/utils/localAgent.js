// WebSocket client for the GI Local Agent. This is the ONLY place in
// the web app that talks to the local agent — every action is a
// discrete, named request (never a free-form command string sent
// over the wire), and nothing here auto-connects or auto-executes
// anything without the user explicitly pairing first.

const STORAGE_TOKEN_KEY = "gi-agent-token";
const STORAGE_URL_KEY = "gi-agent-url";
const DEFAULT_URL = "ws://127.0.0.1:8787";

let ws = null;
let paired = false;
let projectPath = "";
const listeners = new Set();
const pending = new Map(); // requestId -> {resolve, reject}

function notify() {
  const state = { connected: ws?.readyState === WebSocket.OPEN, paired, projectPath };
  listeners.forEach((fn) => fn(state));
}

export function onAgentStateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSavedToken() {
  try { return localStorage.getItem(STORAGE_TOKEN_KEY) || ""; } catch { return ""; }
}
export function getSavedUrl() {
  try { return localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_URL; } catch { return DEFAULT_URL; }
}

export function connectAgent(url, token) {
  return new Promise((resolve) => {
    try { ws?.close(); } catch { /* noop */ }
    paired = false;
    ws = new WebSocket(url || DEFAULT_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "pair", token }));
    };

    ws.onmessage = (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }

      if (msg.type === "hello") {
        projectPath = msg.projectPath || "";
      }
      if (msg.type === "pair_result") {
        paired = !!msg.ok;
        if (paired) {
          try {
            localStorage.setItem(STORAGE_TOKEN_KEY, token);
            localStorage.setItem(STORAGE_URL_KEY, url || DEFAULT_URL);
          } catch { /* ignore */ }
        }
        notify();
        resolve(paired);
      }
      if (msg.type === "action_result" && pending.has(msg.requestId)) {
        pending.get(msg.requestId).resolve(msg);
        pending.delete(msg.requestId);
      }
    };

    ws.onerror = () => { notify(); resolve(false); };
    ws.onclose = () => { paired = false; notify(); resolve(false); };
  });
}

export function disconnectAgent() {
  try { ws?.close(); } catch { /* noop */ }
  ws = null;
  paired = false;
  notify();
}

export function isAgentReady() {
  return ws?.readyState === WebSocket.OPEN && paired;
}

// The ONLY way to reach the agent — every call names a specific,
// fixed action. There is no path anywhere in this file that accepts
// or forwards an arbitrary command string.
export function sendAgentAction(action, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!isAgentReady()) return reject(new Error("Local Agent not connected"));
    const requestId = Math.random().toString(36).slice(2);
    pending.set(requestId, { resolve, reject });
    ws.send(JSON.stringify({ type: "action", action, payload, requestId }));
    setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        reject(new Error("Local Agent action timed out"));
      }
    }, 15000);
  });
}