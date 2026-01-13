---
name: start
description: Start the main visualizer app on http://localhost:5173
---

You are helping the user start the main organization visualizer application.

Execute these steps:

1. Use the Bash tool to run `npm run dev` in background mode
2. Wait 3 seconds for the Vite development server to start
3. Read the background task output file to check:
   - If the server started successfully
   - Which port it's running on (default 5173, or alternative if port is in use)
4. Inform the user with a clear message:
   - "✅ Main visualizer app is running at http://localhost:[PORT]"
   - "This is the organization visualization dashboard"

Handle errors gracefully:
- If the command fails, read the error output and explain the issue to the user
- If there's a port conflict, report the actual port being used
- If dependencies are missing, suggest running `npm install` first
