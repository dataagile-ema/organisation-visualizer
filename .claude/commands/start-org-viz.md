---
description: Starta organisation-visualizer utvecklingsservern
allowed-tools: Bash(npm:*), Bash(netstat:*), Bash(taskkill:*), Bash(findstr:*)
---

# Starta Utvecklingsserver

Startar Vite utvecklingsservern för organisation-visualizer.

## Före start

1. **Kolla port 5173**: Kör `netstat -ano | findstr :5173` för att se om porten är upptagen
   - Om porten är upptagen, fråga användaren om de vill döda processen
   - Använd `cmd //c "taskkill /PID <pid> /F"` för att frigöra porten vid behov

## Starta servern

Kör: `npm run dev`

Detta startar:
- Vite dev server på http://localhost:5173
- Hot Module Replacement (HMR) aktiverat
- File watching för automatisk uppdatering

## Efter start

När servern är igång:
- Ge användaren URL:en: http://localhost:5173
- Bekräfta att servern körs
- Påminn om att servern körs tills den stoppas (Ctrl+C)

## Om appen

Detta är en React + TypeScript organisationsvisualiserare med:
- Hierarkisk organisationsstruktur
- Dashboard med metrics (anställda, intäkter, kostnader)
- Interaktiva grafer med Recharts
- Responsiv layout med Tailwind CSS
