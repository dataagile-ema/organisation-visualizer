---
name: start-all
description: Start both the main app and admin app
---

You are helping the user start all applications: the main visualizer and the admin app.

Execute these steps:

1. Check dependencies in all locations:
   - Check if root `node_modules` exists (main app)
   - Check if `admin/node_modules` exists (admin backend)
   - Check if `admin/client/node_modules` exists (admin frontend)
   - Install any missing dependencies using `npm install` in the appropriate directory

2. Start the main visualizer app:
   - Use Bash to run `npm run dev` in background mode
   - This starts the Vite dev server (default port 5173)

3. Start the admin app:
   - Use Bash to run `cd admin && npm run dev` in background mode
   - This starts both backend (3001) and frontend (5174)

4. Wait 5 seconds for all servers to initialize

5. Read all background task outputs to get actual ports:
   - Check main app port (usually 5173 but may vary)
   - Check admin backend port (3001)
   - Check admin frontend port (5174)

6. Inform the user with all URLs:
   - "✅ All servers are running!"
   - "📊 Main Visualizer: http://localhost:[PORT]"
   - "🔧 Admin Backend API: http://localhost:3001"
   - "⚙️ Admin Frontend: http://localhost:5174"
   - ""
   - "💡 Use main app (5173) to view organization data"
   - "💡 Use admin app (5174) to edit organization structure"
   - "⚠️ After editing in admin, refresh main app (F5) to see changes"

Handle errors:
- If any port is in use, report the actual ports being used
- If any server fails to start, report which one and why
- If dependencies are missing, install them before starting servers
