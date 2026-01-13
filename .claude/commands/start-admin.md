---
description: Starta admin-appen för att redigera organisationsstrukturen
allowed-tools: Bash(npm:*), Bash(netstat:*), Bash(taskkill:*), Bash(findstr:*)
---

# Starta Admin-appen

Startar admin-applikationen för att redigera organisationsstrukturen.

## Före start

1. **Kolla portarna**: Kör följande för att se om portarna är upptagna:
   - `netstat -ano | findstr :3001` (backend)
   - `netstat -ano | findstr :5174` (frontend)
   - Om portarna är upptagna, fråga användaren om de vill döda processerna
   - Använd `taskkill /PID <pid> /F` för att frigöra portarna vid behov

## Starta servern

Kör från admin-katalogen:
```bash
cd admin && npm run dev
```

Detta startar:
- Backend API på http://localhost:3001
- Frontend UI på http://localhost:5174

## Efter start

När servern är igång:
- Ge användaren URL:en: http://localhost:5174
- Bekräfta att båda servrarna körs
- Påminn om att servrarna körs tills de stoppas (Ctrl+C)

## Om admin-appen

Admin-appen är ett verktyg för att redigera organisationsstrukturen med:
- Trädvy för organisationshierarkin
- Skapa, redigera och ta bort enheter
- Validering av kostnadsställen och enhets-ID:n
- Automatiska backuper innan varje ändring
- Ändringar skrivs till `src/data/organization.json`

**OBS:** Huvudvisualiseraren (port 5173) kräver F5 för att se ändringar gjorda här.
