# Diccionario de datos — BaldurWatch

Base de datos **MongoDB** (documental). La estructura la definen los schemas Mongoose del backend;
este documento se genera automáticamente desde ellos (`npx tsx entrega-bd/diccionario.ts`).
Los índices efectivos de la BD están en `colecciones.json`. Todas las colecciones tienen `_id` (ObjectId).

## Colecciones v2 (API /api/v2, usadas por el frontend actual)

### `v2_audit_log` — modelo AuditLogV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `actor` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |
| `action` | String | sí |  |  |  |  |
| `entityType` | String | sí |  |  |  |  |
| `entityId` | ObjectId | sí |  |  |  |  |
| `timestamp` | Date |  |  | Date.now |  |  |
| `meta` | Mixed |  |  |  |  |  |

### `v2_characteristic_assessments` — modelo CharacteristicAssessmentV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `subindicatorId` | ObjectId | sí |  |  |  | SubindicatorV2 (`v2_subindicators`) |
| `characteristicId` | ObjectId | sí |  |  |  | CharacteristicV2 (`v2_characteristics`) |
| `criteria` | Array<Subdocumento> |  |  |  |  |  |
| `criteria[].valuationId` | ObjectId | sí |  |  |  | ValuationV2 (`v2_valuations`) |
| `criteria[].met` | Boolean | sí |  |  |  |  |
| `criteria[].weight` | Number | sí |  |  |  |  |
| `score` | Number |  |  |  |  |  |
| `totalRubric` | Number |  |  |  |  |  |
| `verified` | Boolean |  |  | false |  |  |
| `qualifiedBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `qualifiedAt` | Date |  |  |  |  |  |
| `sourceOverrides` | Array<ObjectId> |  |  |  |  | SourceDocumentV2 (`v2_source_documents`) |

**Índices declarados:** `{"subindicatorId":1,"characteristicId":1}` (único)

### `v2_characteristics` — modelo CharacteristicV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `group` | String | sí |  |  |  |  |
| `groupName` | String | sí |  |  |  |  |
| `help` | String |  |  |  |  |  |
| `format` | String |  |  |  |  |  |
| `isRequired` | Boolean | sí |  |  |  |  |
| `required` | Boolean | sí |  |  |  |  |
| `score` | Number |  |  |  |  |  |
| `tier` | Number | sí |  |  |  |  |
| `unique` | Boolean | sí |  |  |  |  |
| `parts` | Array<String> |  |  |  |  |  |
| `valuations` | Array<ObjectId> |  |  |  |  | ValuationV2 (`v2_valuations`) |
| `extras` | Mixed |  |  | (función) |  |  |
| `allowedFormats` | Array<String> |  |  |  |  |  |
| `inputKind` | String |  |  |  | file, link |  |
| `isCover` | Boolean |  |  |  |  |  |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

### `v2_commits` — modelo CommitV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `author` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |
| `body` | String | sí |  |  |  |  |
| `created` | Date | sí |  |  |  |  |
| `lastUpdate` | Date |  |  |  |  |  |

### `v2_evidences` — modelo EvidenceV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `characteristicId` | ObjectId | sí |  |  |  | CharacteristicV2 (`v2_characteristics`) |
| `subindicatorId` | ObjectId | sí |  |  |  | SubindicatorV2 (`v2_subindicators`) |
| `name` | String | sí |  |  |  |  |
| `link` | String |  |  |  |  |  |
| `note` | String |  |  |  |  |  |
| `content` | Array<Subdocumento> |  |  |  |  |  |
| `content[].part` | String | sí |  |  |  |  |
| `content[].key` | Boolean | sí |  |  |  |  |
| `state` | Boolean |  |  |  |  |  |
| `verified` | Boolean |  |  | false |  |  |
| `qualification` | Number |  |  |  |  |  |
| `totalRubric` | Number |  |  |  |  |  |
| `qualificationBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `qualificationDate` | Date |  |  |  |  |  |
| `author` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |
| `commits` | Array<ObjectId> |  |  |  |  | CommitV2 (`v2_commits`) |
| `kind` | String |  |  | "principal" | principal, complementaria |  |
| `sourceId` | ObjectId |  |  |  |  | SourceDocumentV2 (`v2_source_documents`) |
| `pages` | String |  |  |  |  |  |
| `extras` | Mixed |  |  | (función) |  |  |

### `v2_gads` — modelo GadV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `code` | String |  |  |  |  |  |
| `city` | String |  |  |  |  |  |
| `country` | String | sí |  |  |  |  |
| `size` | Number | sí |  |  |  |  |
| `admin` | Array<ObjectId> |  |  |  |  | UserV2 (`v2_users`) |
| `staff` | Array<ObjectId> |  |  |  |  | UserV2 (`v2_users`) |
| `users` | Array<ObjectId> |  |  |  |  | UserV2 (`v2_users`) |
| `state` | Boolean | sí |  |  |  |  |
| `publishAuto` | Boolean | sí |  |  |  |  |
| `report` | Array<ObjectId> |  |  |  |  | ReportV2 (`v2_reports`) |
| `reportDefault` | ObjectId |  |  |  |  | ReportV2 (`v2_reports`) |

### `v2_improvement_plans` — modelo ImprovementPlanV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `subindicatorId` | ObjectId |  |  |  |  | SubindicatorV2 (`v2_subindicators`) |
| `indicatorInstanceId` | ObjectId |  |  |  |  | IndicatorInstanceV2 (`v2_indicator_instances`) |
| `responsibleUserId` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `targetDate` | Date |  |  |  |  |  |
| `status` | String |  |  |  |  |  |
| `closureEvidenceId` | ObjectId |  |  |  |  | EvidenceV2 (`v2_evidences`) |
| `createdAt` | Date |  |  | Date.now |  |  |

### `v2_indicator_instances` — modelo IndicatorInstanceV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `gadId` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |
| `indicatorInstanceId` | ObjectId | sí |  |  |  | IndicatorV2 (`v2_indicators`) |
| `period` | ObjectId | sí |  |  |  | PeriodV2 (`v2_periods`) |
| `year` | String | sí |  |  |  |  |
| `qualification` | Number | sí |  |  |  |  |
| `maturityLevel` | Number |  |  |  |  |  |
| `create` | Date | sí |  |  |  |  |
| `state` | Boolean | sí |  |  |  |  |
| `lastUpdate` | Date |  |  |  |  |  |
| `lastUpdateBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `createdBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `subindicators` | Array<ObjectId> |  |  |  |  | SubindicatorV2 (`v2_subindicators`) |

### `v2_indicators` — modelo IndicatorV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |
| `number` | Number | sí |  |  |  |  |
| `quadrant` | Number | sí |  |  |  |  |
| `quadrantName` | String | sí |  |  |  |  |
| `red` | String | sí |  |  |  |  |
| `yellow` | String | sí |  |  |  |  |
| `green` | String | sí |  |  |  |  |
| `ods` | Array<ObjectId> |  |  |  |  | OdsV2 (`v2_ods`) |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

### `v2_news` — modelo NewsV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `image` | String |  |  |  |  |  |
| `title` | String |  |  |  |  |  |
| `description` | String |  |  |  |  |  |
| `tag` | Array<String> |  |  |  |  |  |
| `author` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |
| `gad` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |

### `v2_notifications` — modelo NotificationV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `type` | Number |  |  |  |  |  |
| `from` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `sendTo` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `content` | String |  |  |  |  |  |
| `itemType` | Number |  |  |  |  |  |
| `itemID` | String |  |  |  |  |  |
| `entityType` | String |  |  |  |  |  |
| `action` | String |  |  |  |  |  |
| `date` | Date |  |  |  |  |  |
| `state` | Number | sí |  |  |  |  |

### `v2_ods` — modelo OdsV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `number` | Number |  |  |  |  |  |
| `name` | String |  |  |  |  |  |
| `img` | String |  |  |  |  |  |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

### `v2_periods` — modelo PeriodV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `year` | String | sí |  |  |  |  |
| `gad` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |
| `createdBy` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |

### `v2_reports` — modelo ReportV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `info` | Array<Subdocumento> |  |  |  |  |  |
| `info[].label` | String | sí |  |  |  |  |
| `info[].data` | String | sí |  |  |  |  |
| `source` | String | sí |  |  |  |  |
| `period` | String | sí |  |  |  |  |

### `v2_rols` — modelo RolV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |
| `code` | String |  |  |  |  |  |
| `permissions` | Array<String> |  |  |  |  |  |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

### `v2_rubric_overrides` — modelo RubricOverrideV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `gadId` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |
| `characteristicId` | ObjectId | sí |  |  |  | CharacteristicV2 (`v2_characteristics`) |
| `criteria` | Array<Subdocumento> |  |  |  |  |  |
| `criteria[].valuationId` | ObjectId | sí |  |  |  | ValuationV2 (`v2_valuations`) |
| `criteria[].weight` | Number | sí |  |  |  |  |

### `v2_source_documents` — modelo SourceDocumentV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `gadId` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |
| `periodId` | ObjectId |  |  |  |  | PeriodV2 (`v2_periods`) |
| `year` | String |  |  |  |  |  |
| `name` | String | sí |  |  |  |  |
| `nameNormalized` | String |  |  |  |  |  |
| `link` | String | sí |  |  |  |  |
| `kind` | String |  |  |  |  |  |
| `uploadedBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `verified` | Boolean |  |  | false |  |  |
| `createdAt` | Date |  |  | Date.now |  |  |

**Índices declarados:** `{"gadId":1,"nameNormalized":1}`

### `v2_sponsors` — modelo SponsorV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |
| `gad` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |
| `image` | String | sí |  |  |  |  |
| `state` | Boolean | sí |  |  |  |  |

### `v2_subindicators` — modelo SubindicatorV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `typeId` | ObjectId | sí |  |  |  | TypeV2 (`v2_types`) |
| `indicatorInstanceId` | ObjectId | sí |  |  |  | IndicatorInstanceV2 (`v2_indicator_instances`) |
| `name` | String | sí |  |  |  |  |
| `requireCover` | Boolean | sí |  |  |  |  |
| `cover` | String |  |  |  |  |  |
| `observationCover` | String |  |  |  |  |  |
| `isPlanned` | Boolean |  |  |  |  |  |
| `isDiagnosed` | Boolean |  |  |  |  |  |
| `responsibleText` | String |  |  |  |  |  |
| `responsibleUserIds` | Array<ObjectId> |  |  |  |  | UserV2 (`v2_users`) |
| `qualification` | Number |  |  | 0 |  |  |
| `score` | Number |  |  | 0 |  |  |
| `totalScore` | Number |  |  | 0 |  |  |
| `autoQualification` | Number |  |  | 0 |  |  |
| `maturityLevel` | Number |  |  |  |  |  |
| `lastUpdate` | Date |  |  |  |  |  |
| `lastUpdateBy` | ObjectId |  |  |  |  | UserV2 (`v2_users`) |
| `state` | Boolean | sí |  |  |  |  |
| `created` | Date | sí |  |  |  |  |
| `createdBy` | ObjectId | sí |  |  |  | UserV2 (`v2_users`) |
| `commits` | Array<ObjectId> |  |  |  |  | CommitV2 (`v2_commits`) |
| `evidences` | Array<ObjectId> |  |  |  |  | EvidenceV2 (`v2_evidences`) |
| `extraInfo` | Mixed |  |  | (función) |  |  |

### `v2_types` — modelo TypeV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `red` | String | sí |  |  |  |  |
| `yellow` | String | sí |  |  |  |  |
| `green` | String | sí |  |  |  |  |
| `mandatory` | Boolean | sí |  |  |  |  |
| `extraInfo` | Mixed |  |  | (función) |  |  |
| `characteristics` | Array<ObjectId> |  |  |  |  | CharacteristicV2 (`v2_characteristics`) |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

### `v2_users` — modelo UserV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `email` | String | sí | sí |  |  |  |
| `image` | String |  |  |  |  |  |
| `password` | String | sí |  |  |  |  |
| `rol` | ObjectId | sí |  |  |  | RolV2 (`v2_rols`) |
| `created` | Date | sí |  |  |  |  |
| `lastUpdate` | Date | sí |  |  |  |  |
| `state` | Boolean |  |  | true |  |  |
| `gadId` | ObjectId | sí |  |  |  | GadV2 (`v2_gads`) |

**Índices declarados:** `{"email":1}` (único)

### `v2_valuations` — modelo ValuationV2

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `category` | String | sí |  |  |  |  |
| `maxValue` | Number | sí |  |  |  |  |
| `slug` | String |  |  |  |  |  |
| `order` | Number |  |  |  |  |  |

## Colecciones v1 (legacy, fuente de la migración v1 → v2)

### `characteristics` — modelo Characteristic

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `type` | Number |  |  | 1 |  |  |
| `group` | String | sí |  |  |  |  |
| `groupName` | String | sí |  |  |  |  |
| `help` | String |  |  |  |  |  |
| `format` | String |  |  |  |  |  |
| `isRequired` | Boolean | sí |  |  |  |  |
| `required` | Boolean | sí |  |  |  |  |
| `score` | Number |  |  |  |  |  |
| `tier` | Number | sí |  |  |  |  |
| `unique` | Boolean | sí |  |  |  |  |
| `parts` | Array<String> |  |  |  |  |  |
| `valuation` | Array<ObjectId> |  |  |  |  | Valuation (`valuations`) |
| `extras` | Mixed |  |  | (función) |  |  |
| `allowed_formats` | Array<String> |  |  |  |  |  |

### `commits` — modelo Commit

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `autor` | ObjectId | sí |  |  |  | User (`users`) |
| `body` | String | sí |  |  |  |  |
| `created` | Date | sí |  |  |  |  |
| `lastUpdate` | Date |  |  |  |  |  |

### `evidences` — modelo Evidence

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `characteristicID` | ObjectId | sí |  |  |  | Characteristic (`characteristics`) |
| `subIndicatorID` | ObjectId | sí |  |  |  | SubIndicator (`subindicators`) |
| `name` | String | sí |  |  |  |  |
| `link` | String | sí |  |  |  |  |
| `note` | String |  |  |  |  |  |
| `content` | Array<Subdocumento> |  |  |  |  |  |
| `content[].part` | String | sí |  |  |  |  |
| `content[].key` | Boolean | sí |  |  |  |  |
| `state` | Boolean |  |  |  |  |  |
| `verified` | Boolean |  |  | false |  |  |
| `qualification` | Number |  |  |  |  |  |
| `rubric` | Array<ObjectId> |  |  |  |  | Rubric (`rubrics`) |
| `totalRubric` | Number |  |  |  |  |  |
| `qualificationBy` | ObjectId |  |  |  |  | User (`users`) |
| `qualificationDate` | Date |  |  |  |  |  |
| `author` | ObjectId | sí |  |  |  | User (`users`) |
| `commits` | Array<ObjectId> |  |  |  |  | Commit (`commits`) |
| `extras` | Mixed |  |  | (función) |  |  |

### `gads` — modelo Gad

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `code` | String |  |  |  |  |  |
| `city` | String |  |  |  |  |  |
| `country` | String | sí |  |  |  |  |
| `size` | Number | sí |  |  |  |  |
| `admin` | Array<ObjectId> |  |  |  |  | User (`users`) |
| `staff` | Array<ObjectId> |  |  |  |  | User (`users`) |
| `users` | Array<ObjectId> |  |  |  |  | User (`users`) |
| `state` | Boolean | sí |  |  |  |  |
| `publishAuto` | Boolean | sí |  |  |  |  |
| `report` | Array<ObjectId> |  |  |  |  | Report (`reports`) |
| `reportDefault` | ObjectId |  |  |  |  | Report (`reports`) |

### `indicatorinstances` — modelo IndicatorInstance

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `gadID` | ObjectId | sí |  |  |  | Gad (`gads`) |
| `indicatorID` | ObjectId | sí |  |  |  | Indicator (`indicators`) |
| `period` | ObjectId | sí |  |  |  | Indicator (`indicators`) |
| `year` | String | sí |  |  |  |  |
| `qualification` | Number | sí |  |  |  |  |
| `create` | Date | sí |  |  |  |  |
| `state` | Boolean | sí |  |  |  |  |
| `lastUpdate` | Date |  |  |  |  |  |
| `lastUpdateBy` | ObjectId |  |  |  |  | User (`users`) |
| `createdBy` | ObjectId |  |  |  |  | User (`users`) |
| `subindicators` | Array<ObjectId> |  |  |  |  | SubIndicator (`subindicators`) |

### `indicators` — modelo Indicator

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |
| `number` | Number | sí |  |  |  |  |
| `quadrant` | Number | sí |  |  |  |  |
| `quadrantName` | String | sí |  |  |  |  |
| `red` | String | sí |  |  |  |  |
| `yellow` | String | sí |  |  |  |  |
| `green` | String | sí |  |  |  |  |
| `ods` | Array<ObjectId> |  |  |  |  | Ods (`ods`) |

### `news` — modelo New

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `image` | String |  |  |  |  |  |
| `title` | String |  |  |  |  |  |
| `description` | String |  |  |  |  |  |
| `tag` | Array<String> |  |  |  |  |  |
| `author` | ObjectId | sí |  |  |  | User (`users`) |
| `gad` | ObjectId | sí |  |  |  | Gad (`gads`) |

### `notifications` — modelo Notification

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `type` | Number |  |  |  |  |  |
| `from` | ObjectId |  |  |  |  | User (`users`) |
| `sendTo` | ObjectId |  |  |  |  | User (`users`) |
| `content` | String |  |  |  |  |  |
| `itemType` | Number |  |  |  |  |  |
| `itemID` | String |  |  |  |  |  |
| `date` | Date |  |  |  |  |  |
| `state` | Number | sí |  |  |  |  |

### `ods` — modelo Ods

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `number` | Number |  |  |  |  |  |
| `name` | String |  |  |  |  |  |
| `img` | String |  |  |  |  |  |

### `periods` — modelo Period

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `year` | String | sí |  |  |  |  |
| `gad` | ObjectId | sí |  |  |  | gad (`gads`) |
| `createdBy` | ObjectId | sí |  |  |  | user (`users`) |

### `reports` — modelo Report

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `info` | Array<Subdocumento> |  |  |  |  |  |
| `info[].label` | String | sí |  |  |  |  |
| `info[].data` | String | sí |  |  |  |  |
| `source` | String | sí |  |  |  |  |
| `period` | String | sí |  |  |  |  |

### `rols` — modelo Rol

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |

### `rubrics` — modelo Rubric

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `valuation` | ObjectId | sí |  |  |  | Valuation (`valuations`) |
| `qualification` | Number | sí |  |  |  |  |
| `evidence` | ObjectId | sí |  |  |  | Evidence (`evidences`) |

### `sponsors` — modelo Sponsor

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `description` | String | sí |  |  |  |  |
| `gad` | ObjectId | sí |  |  |  | Gad (`gads`) |
| `image` | String | sí |  |  |  |  |
| `state` | Boolean | sí |  |  |  |  |

### `subindicators` — modelo SubIndicator

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `typeID` | ObjectId | sí |  |  |  | Type (`types`) |
| `indicadorID` | ObjectId | sí |  |  |  | IndicatorInstance (`indicatorinstances`) |
| `name` | String | sí |  |  |  |  |
| `requireCover` | Boolean | sí |  |  |  |  |
| `cover` | String |  |  |  |  |  |
| `observationCover` | String |  |  |  |  |  |
| `isPlanned` | Boolean |  |  |  |  |  |
| `isDiagnosed` | Boolean |  |  |  |  |  |
| `responsible` | String | sí |  |  |  |  |
| `qualification` | Number |  |  | 0 |  |  |
| `score` | Number |  |  | 0 |  |  |
| `totalScore` | Number |  |  | 0 |  |  |
| `autoQualification` | Number |  |  | 0 |  |  |
| `lastUpdate` | Date |  |  |  |  |  |
| `lastUpdateBy` | ObjectId |  |  |  |  | User (`users`) |
| `state` | Boolean | sí |  |  |  |  |
| `created` | Date | sí |  |  |  |  |
| `createdBy` | ObjectId | sí |  |  |  | User (`users`) |
| `commits` | Array<ObjectId> |  |  |  |  | Commit (`commits`) |
| `evidences` | Array<ObjectId> |  |  |  |  | Evidence (`evidences`) |
| `extraInfo` | Mixed |  |  | (función) |  |  |

### `types` — modelo Type

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `red` | String | sí |  |  |  |  |
| `yellow` | String | sí |  |  |  |  |
| `green` | String | sí |  |  |  |  |
| `mandatory` | Boolean | sí |  |  |  |  |
| `extraInfo` | Mixed |  |  | (función) |  |  |
| `characteristics` | Array<ObjectId> |  |  |  |  | Characteristic (`characteristics`) |

### `users` — modelo User

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `mail` | String | sí | sí |  |  |  |
| `image` | String |  |  |  |  |  |
| `password` | String | sí |  |  |  |  |
| `rol` | ObjectId | sí |  |  |  | Rol (`rols`) |
| `created` | Date | sí |  |  |  |  |
| `lastUpdate` | Date | sí |  |  |  |  |
| `state` | Boolean |  |  | true |  |  |
| `gadID` | ObjectId | sí |  |  |  | Gad (`gads`) |

**Índices declarados:** `{"mail":1}` (único)

### `valuations` — modelo Valuation

| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |
|---|---|---|---|---|---|---|
| `name` | String | sí |  |  |  |  |
| `category` | String | sí |  |  |  |  |
| `maxValue` | Number | sí |  |  |  |  |
