const ALLOWED_PATTERNS = [
  /Download the React DevTools/i,
  /firebase/i,
  /WebChannelConnection/i,
];

export function attachConsoleGuard(page, errors) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ALLOWED_PATTERNS.some((p) => p.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
}