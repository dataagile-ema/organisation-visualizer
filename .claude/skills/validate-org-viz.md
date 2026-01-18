---
description: Validera organization.json
allowed-tools: Read
---

# Validera Organisationsstruktur

Kör komplett validering av `src/data/organization.json` och rapportera eventuella fel.

## Steg 1: Läs konfigurationsfiler

Läs dessa filer:
- `src/data/organization.json` - Organisationsstrukturen att validera
- `src/data/unit-types.json` - Giltiga enhetstyper och regler

## Steg 2: Validera varje enhet

Traversera hela organisationsträdet och validera varje enhet mot dessa regler:

### ID-validering
- **Format**: Endast lowercase alfanumeriskt och bindestreck (regex: `^[a-z0-9-]+$`)
- **Unikhet**: Alla ID:n måste vara unika i hela trädet

### Namn-validering
- **Obligatoriskt**: Namn får inte vara tomt
- **Längd**: Max 100 tecken

### Typ-validering
- **Giltiga typer**: koncern, division, avdelning, stab, enhet (från unit-types.json)
- **Djup**: Kontrollera att typen är tillåten på aktuellt djup enligt `allowedAtDepth`
  - koncern: endast djup 0
  - division: endast djup 1
  - avdelning: djup 2-3
  - stab: endast djup 2
  - enhet: djup 2-4

### Kostnadsställe-validering
- **Format**: Exakt 4 siffror (regex: `^\d{4}$`)
- **Unikhet**: Alla kostnadsställen måste vara unika

### Hierarki-validering
- Kontrollera att varje barn-typ är tillåten under förälder-typen enligt `allowedChildren`
  - koncern får ha: division
  - division får ha: avdelning, stab, enhet
  - avdelning får ha: enhet
  - stab får ha: enhet
  - enhet får inte ha barn

## Steg 3: Rapportera resultat

Presentera resultatet i detta format:

```
## Valideringsresultat för organization.json

### Sammanfattning
- Totalt antal enheter: X
- Fel: X
- Varningar: X

### Fel (måste åtgärdas)
- [FEL] enhet-id: Beskrivning av felet

### Varningar
- [VARNING] enhet-id: Beskrivning av varningen

### Statistik per enhetstyp
- koncern: X st
- division: X st
- avdelning: X st
- stab: X st
- enhet: X st
```

Om inga fel hittas:
```
## Valideringsresultat

Alla X enheter validerade utan fel.

### Statistik per enhetstyp
...
```
