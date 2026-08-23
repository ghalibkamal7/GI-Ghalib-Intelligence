# GI Local Agent — Setup

This is a **separate, standalone program** — NOT part of your GI web app's
build. It runs on your own Mac, only listens on `127.0.0.1` (never
accessible from the internet or your local network), and can only
perform 5 fixed, safe actions inside one folder you explicitly allow.

## Setup

1. `cd gi-agent`
2. `npm install`
3. Edit `config.json` — set `allowedProjectPath` to your GI project's
   actual folder path.
4. `npm start`
5. Copy the **pairing token** printed in the terminal.
6. In the GI web app, open the **Local Agent** panel and paste the token.

## What it can do (and nothing else)

- Open VS Code / Chrome / Terminal
- Open your GI project in VS Code
- Create a new file or folder **inside your allowed project folder only**
- Run `npm install` / `npm run build` / `npm test` / `npm run dev`
  **inside your allowed project folder only**

It cannot delete files, run arbitrary shell commands, access other
folders, or do anything not explicitly listed above.

## Stopping / re-pairing

- Close the terminal window to stop the agent completely.
- Delete `~/.gi-agent-token` to force a fresh pairing token next time
  you start it (e.g. if you think the old one leaked).