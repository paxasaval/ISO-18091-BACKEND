# Baseline de endpoints (contrato v1) — estado anterior a la refactorización

> Capturado el 2026-06-13 en la rama `refactor`, antes de cualquier cambio.
> Este documento es el **contrato de compatibilidad estricta**: la API `/api/...`
> (v1) debe conservar estas rutas y la forma de sus respuestas tras el refactor.
>
> Estado base de calidad:
> - **Tests**: 6 passed, 3 failed (`test/user_api.test.js` — requiere DB seed).
> - **Lint**: 392 problemas (391 auto-fixables, mayoría `linebreak-style` CRLF).

Montaje en [app.js](../../app.js):

| Prefijo | Controlador |
|---------|-------------|
| `/api/gad` | controllers/gad.js |
| `/api/period` | controllers/period.js |
| `/api/ods` | controllers/ods.js |
| `/api/indicators` | controllers/indicator.js |
| `/api/users` | controllers/user.js |
| `/api/rols` | controllers/rol.js |
| `/api/type` | controllers/type.js |
| `/api/characteristics` | controllers/characterstic.js |
| `/api/valuation` | controllers/valuation.js |
| `/api/subIndicators` | controllers/subindicator.js |
| `/api/indicatorsInstance` | controllers/indicatorInstance.js |
| `/api/evidences` | controllers/evidence.js |
| `/api/commits` | controllers/commit.js |
| `/api/login` | controllers/login.js |
| `/api/notifications` | controllers/notification.js |

## Rutas completas

### /api/gad
- GET `/api/gad/`
- GET `/api/gad/myWorkspace`
- GET `/api/gad/reportDefault`
- GET `/api/gad/reports`
- GET `/api/gad/:id`
- POST `/api/gad/`
- PUT `/api/gad/newReport`
- PUT `/api/gad/updateConfig`
- PUT `/api/gad/:id`

### /api/period
- GET `/api/period/`
- GET `/api/period/:id`
- POST `/api/period/`
- POST `/api/period/new`
- DELETE `/api/period/:id`

### /api/ods
- GET `/api/ods/`
- POST `/api/ods/`
- GET `/api/ods/:id`
- DELETE `/api/ods/:id`
- PUT `/api/ods/:id`

### /api/indicators
- GET `/api/indicators/`
- GET `/api/indicators/byQuadrantAndNumber`
- GET `/api/indicators/:id`
- DELETE `/api/indicators/:id`
- POST `/api/indicators/`
- PUT `/api/indicators/:id`

### /api/users
- GET `/api/users/`
- POST `/api/users/`
- POST `/api/users/signUp`
- POST `/api/users/password`
- GET `/api/users/:id`
- DELETE `/api/users/:id`
- PUT `/api/users/newPassword`
- PUT `/api/users/:id`

### /api/rols
- GET `/api/rols/`
- POST `/api/rols/`
- GET `/api/rols/:id`
- DELETE `/api/rols/:id`
- PUT `/api/rols/:id`

### /api/type
- GET `/api/type/`
- GET `/api/type/:id`
- DELETE `/api/type/:id`
- POST `/api/type/`
- POST `/api/type/addExtraInfo`
- PUT `/api/type/:id`

### /api/characteristics
- GET `/api/characteristics/`
- POST `/api/characteristics/`
- POST `/api/characteristics/addValuationArray`
- POST `/api/characteristics/changeType`
- POST `/api/characteristics/changeFormat`
- POST `/api/characteristics/addExtra`
- GET `/api/characteristics/valuation`
- GET `/api/characteristics/:id`
- DELETE `/api/characteristics/:id`
- PUT `/api/characteristics/:id`

### /api/valuation
- GET `/api/valuation/`
- POST `/api/valuation/`

### /api/subIndicators
- GET `/api/subIndicators/all`
- GET `/api/subIndicators/`
- GET `/api/subIndicators/indicator/:id/generalSubindicators`
- GET `/api/subIndicators/indicator/:id/all`
- GET `/api/subIndicators/indicator/:id`
- GET `/api/subIndicators/indicator/:id/subindicatorsSpecific`
- GET `/api/subIndicators/indicator/:indicatorID/type/:typeID`
- GET `/api/subIndicators/:id`
- DELETE `/api/subIndicators/:id`
- POST `/api/subIndicators/`
- POST `/api/subIndicators/newSubindicator`
- PUT `/api/subIndicators/addInfo`
- PUT `/api/subIndicators/:id`

### /api/indicatorsInstance
- GET `/api/indicatorsInstance/`
- GET `/api/indicatorsInstance/byIndicatorIDAndPeriod`
- GET `/api/indicatorsInstance/byQuadrantAndPeriod`
- GET `/api/indicatorsInstance/summarySubindicators`
- GET `/api/indicatorsInstance/summary`
- GET `/api/indicatorsInstance/:id`
- DELETE `/api/indicatorsInstance/:id`
- PUT `/api/indicatorsInstance/:id`

### /api/evidences
- GET `/api/evidences/`
- GET `/api/evidences/subindicatorID/:id`
- GET `/api/evidences/:id`
- DELETE `/api/evidences/:id`
- POST `/api/evidences/`
- PUT `/api/evidences/qualify/:id`
- PUT `/api/evidences/:id`

### /api/commits
- GET `/api/commits/`
- GET `/api/commits/:id`
- DELETE `/api/commits/:id`
- POST `/api/commits/`
- PUT `/api/commits/:id`

### /api/login
- POST `/api/login/`

### /api/notifications
- GET `/api/notifications/`
- GET `/api/notifications/allMyNotify`
- GET `/api/notifications/numOfUnreadNotify`
- GET `/api/notifications/unreadNotify`
- POST `/api/notifications/`
- GET `/api/notifications/:id`
- DELETE `/api/notifications/:id`
- PUT `/api/notifications/checkNotify`
- PUT `/api/notifications/uncheckNotify`
- (comentada) PUT `/api/notifications/:id`

## Controladores sin rutas (modelos existentes, a implementar en v2)
- controllers/news.js (modelo models/news.js)
- controllers/rubric.js (modelo models/rubric.js)
- controllers/sponsor.js (modelo models/sponsors.js)
- models/report.js (sin controlador propio; usado vía gad)
