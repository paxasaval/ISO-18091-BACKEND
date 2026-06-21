# Informe de migración v1 → v2

**Modo:** DRY-RUN
**Fecha:** 2026-06-21T01:18:27.768Z

## Conteos por colección

| Colección | Docs v1 | Escritos v2 |
|-----------|---------|-------------|
| rols | 2 | 2 |
| valuations | 2 | 2 |
| ods | 1 | 1 |
| users | 1 | 1 |
| gads | 1 | 1 |
| indicators | 1 | 1 |
| types | 1 | 1 |
| characteristics | 2 | 2 |
| periods | 1 | 1 |
| indicatorInstances | 1 | 1 |
| subindicators | 1 | 1 |
| evidences | 2 | 2 |
| characteristic_assessments | 4 | 1 |

## Diff de scoring (qualification cambiada)

_Sin diffs de scoring (dry-run o no hay cambios)._

## Consolidaciones de rúbrica

Se fusionaron 1 pares (subindicador, característica) desde rúbricas por evidencia a CharacteristicAssessment v2.

### Par 6a373be30d1cee28f3d4244b / 6a373be30d1cee28f3d42441
- Evidencias: 6a373be30d1cee28f3d4244e, 6a373be30d1cee28f3d42450
- Criterios (UNION): [{"valuationId":"6a373be30d1cee28f3d42433","met":true,"weight":2},{"valuationId":"6a373be30d1cee28f3d42435","met":true,"weight":3}]
- Verified: true


## Anomalías / Decisiones

- [dry-run] Se crearía rol Metodólogo (no existe en v1)
- Type.red/Type.yellow son STRING en v1 (p.ej "0.50"). El scoring.service los parsea con parseFloat; defaults 0.50/0.75 si NaN. Se copian sin convertir a number para conservar el valor exacto.
- [dry-run] El recompute de scoring se omite. En --write se recalcularán qualification de todos los subindicadores e instancias.

---

> **Riesgos para ejecución real:**
> 1. Hacer backup de las colecciones v2_* antes de --write.
> 2. IP del cliente debe estar en la whitelist de Atlas.
> 3. El recompute de scoring puede cambiar colores públicos (ver diff arriba). 
>    Validar con el GAD antes del freeze de v1.
> 4. responsibleUserIds queda vacío; el mapeo a usuarios es manual/futuro.
> 5. sourceId de evidencias queda null; la biblioteca POA es Tema 5 (futuro).