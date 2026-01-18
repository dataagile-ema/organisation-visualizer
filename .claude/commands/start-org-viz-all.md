---
description: Starta alla appar (visualizer och admin)
allowed-tools: Bash(npm:*), Bash(netstat:*), Bash(taskkill:*), Bash(findstr:*)
---

# Starta alla appar

Startar både huvudvisualiseraren och admin-appen.

## Före start

1. **Kontrollera beroenden**:
   - Kolla om `node_modules` finns i root (huvudapp)
   - Kolla om `admin/node_modules` finns (admin backend)
   - Kolla om `admin/client/node_modules` finns (admin frontend)
   - Installera saknade beroenden med `npm install` i respektive katalog

2. **Kolla portarna**: Kör följande för att se om portarna är upptagna:
   - `netstat -ano | findstr :5173` (visualizer)
   - `netstat -ano | findstr :3001` (admin backend)
   - `netstat -ano | findstr :5174` (admin frontend)
   - Om portarna är upptagna, fråga användaren om de vill döda processerna
   - Använd `cmd //c "taskkill /PID <pid> /F"` för att frigöra portarna vid behov

## Starta servrarna

1. **Starta huvudvisualiseraren** (i bakgrunden):
   ```bash
   npm run dev
   ```
   Startar Vite dev server på http://localhost:5173

2. **Starta admin-appen** (i bakgrunden):
   ```bash
   cd admin && npm run dev
   ```
   Startar backend (3001) och frontend (5174)

## Efter start

När alla servrar är igång, informera användaren:
- Huvudvisualiseraren: http://localhost:5173
- Admin Backend API: http://localhost:3001
- Admin Frontend: http://localhost:5174

**Tips:**
- Huvudappen visar organisationsdata
- Admin-appen används för att redigera organisationsstrukturen
- Efter ändringar i admin, tryck F5 i huvudappen för att se uppdateringar
