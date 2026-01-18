---
description: Exportera organisationsrapport till markdown
allowed-tools: Read, Write, Bash(mkdir:*)
---

# Exportera Organisationsrapport

Generera en sammanfattande rapport av organisationens metrics i markdown-format.

## Steg 1: Läs datafiler

Läs dessa filer:
- `src/data/organization.json` - Organisationsstrukturen
- `src/data/data.json` - Metrics per kostnadsställe
- `src/data/thresholds.json` - Tröskelvärden för nyckeltal

## Steg 2: Aggregera data

### Räkna enheter
Traversera organisationsträdet och räkna:
- Antal enheter per typ (koncern, division, avdelning, stab, enhet)
- Totalt antal enheter

### Summera personal
Summera `antal_anstallda` från data.json för alla kostnadsställen.

### Beräkna ekonomi
Summera för hela organisationen:
- Total budget (kostnader): personal + lokaler + material + externa + ovrigt (yearly)
- Totalt utfall (kostnader)
- Total budgetavvikelse i % = ((utfall - budget) / budget) * 100
- Totala intäkter (budget och utfall)

### Beräkna medelvärden för nyckeltal
Beräkna medelvärden (viktat eller oviktat) för:
- Personalomsättning (%)
- Sjukfrånvaro (%)
- Kundnöjdhet (%) - endast enheter med värde
- Kvalitetsindex - endast enheter med värde

### Identifiera enheter med avvikelser
Använd thresholds.json för att klassificera:

**Personalomsättning**:
- Bra (grön): <= 10%
- Varning (gul): <= 15%
- Kritisk (röd): > 15%

**Sjukfrånvaro**:
- Bra (grön): <= 3.5%
- Varning (gul): <= 5%
- Kritisk (röd): > 5%

**Kundnöjdhet**:
- Bra (grön): >= 85%
- Varning (gul): >= 75%
- Kritisk (röd): < 75%

**Budgetavvikelse**:
- Bra (grön): <= 0%
- Varning (gul): <= 5%
- Kritisk (röd): > 5%

## Steg 3: Generera rapport

Skapa mappen `reports/` om den inte finns (använd `mkdir reports` om nödvändigt).

Skriv rapporten till `reports/organisation-rapport-YYYY-MM-DD.md` med dagens datum.

### Rapportformat

```markdown
# Organisationsrapport

Genererad: YYYY-MM-DD HH:MM

## Organisationsöversikt

| Enhetstyp | Antal |
|-----------|-------|
| Koncern | X |
| Division | X |
| Avdelning | X |
| Stab | X |
| Enhet | X |
| **Totalt** | **X** |

Totalt antal anställda: X

## Ekonomisk sammanfattning

| Kategori | Budget (tkr) | Utfall (tkr) | Avvikelse |
|----------|-------------|--------------|-----------|
| Intäkter | X | X | X% |
| Kostnader | X | X | X% |
| **Resultat** | **X** | **X** | **X%** |

## Personalnyckeltal

| Nyckeltal | Medelvärde | Status |
|-----------|------------|--------|
| Personalomsättning | X% | [STATUS] |
| Sjukfrånvaro | X% | [STATUS] |

## Produktionsnyckeltal

| Nyckeltal | Medelvärde | Status |
|-----------|------------|--------|
| Kundnöjdhet | X% | [STATUS] |
| Kvalitetsindex | X | - |

## Enheter med kritiska värden

### Kritisk personalomsättning (> 15%)
| Enhet | Kostnadsställe | Värde |
|-------|----------------|-------|
| Namn | XXXX | X% |

### Kritisk sjukfrånvaro (> 5%)
| Enhet | Kostnadsställe | Värde |
|-------|----------------|-------|
| Namn | XXXX | X% |

### Kritisk kundnöjdhet (< 75%)
| Enhet | Kostnadsställe | Värde |
|-------|----------------|-------|
| Namn | XXXX | X% |

## Enheter med varningar

### Förhöjd personalomsättning (10-15%)
...

### Förhöjd sjukfrånvaro (3.5-5%)
...

### Låg kundnöjdhet (75-85%)
...

---
*Rapport genererad av Organisation Visualizer*
```

## Steg 4: Bekräfta

Bekräfta för användaren:
- Sökväg till den genererade rapporten
- Kort sammanfattning av eventuella kritiska värden
