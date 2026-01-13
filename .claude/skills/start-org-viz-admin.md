---
name: start-admin
description: Start the admin app (backend on :3001, frontend on :5174)
---

You are helping the user start the admin application for editing organization structure.

Execute these steps:

1. Check if dependencies are installed:
   - Use Bash to check if `admin/node_modules` exists
   - Use Bash to check if `admin/client/node_modules` exists
   - If either is missing, inform the user and run the appropriate `npm install` command

2. Start the admin application:
   - Use the Bash tool to run `cd admin && npm run dev` in background mode
   - This starts both the Express backend (port 3001) and React frontend (port 5174)

3. Wait 4 seconds for both servers to initialize

4. Read the background task output to verify both servers started:
   - Backend should show "Admin API server running on http://localhost:3001"
   - Frontend should show "Local: http://localhost:5174"

5. Inform the user with URLs:
   - "✅ Admin Backend API: http://localhost:3001"
   - "✅ Admin Frontend: http://localhost:5174"
   - "💡 Use this to edit organization structure"
   - "⚠️ Changes require refreshing the main app (F5)"

Handle errors:
- If ports are in use, check output for alternative ports
- If dependencies are missing, install them automatically
- If startup fails, read error output and explain to user
