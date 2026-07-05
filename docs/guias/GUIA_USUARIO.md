# Guía de Usuario — BaldurWatch / ISO 18091

## Plataforma de Transparencia para Gobiernos Autónomos Descentralizados (GAD)

---

# 1. Introducción al Sistema

## 1.1 ¿Qué es BaldurWatch?

**BaldurWatch** es una plataforma web de transparencia y evaluación para **Gobiernos Autónomos Descentralizados (GAD)** basada en la **norma ISO 18091:2019** — "Sistemas de gestión de la calidad — Directrices para la aplicación de la ISO 9001 en el gobierno local".

El objetivo es permitir que los GAD:
- **Evalúen** su gestión institucional mediante **39 indicadores** organizados en **4 cuadrantes**
- **Carguen evidencias** que demuestren el cumplimiento de cada indicador
- **Califiquen** automáticamente el desempeño usando un sistema de **semáforo** (rojo, amarillo, verde, gris)
- **Publiquen** los resultados para que la ciudadanía pueda consultarlos de forma transparente

## 1.2 Arquitectura del Sistema

```
┌─────────────────────────────┐     ┌──────────────────────────────┐     ┌──────────────┐
│   FRONTEND (Angular 13)     │────▶│   BACKEND (Node.js/Express)  │────▶│   MongoDB    │
│   baldurwatch                │     │   ISO-18091-BACKEND          │     │   (Datos)    │
│                             │     │                              │     │              │
│   Hosting: Firebase         │     │   Hosting: Railway.app       │     │  Atlas       │
│   https://iso18091storage   │     │                               │     │              │
│       .web.app              │     │   Puerto: 3001                │     │              │
└─────────────────────────────┘     └──────────────────────────────┘     └──────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Firebase    │
                                    │   Storage     │
                                    │  (Archivos,   │
                                    │   PDFs, etc)  │
                                    └──────────────┘
```

**Tecnologías utilizadas:**
- **Frontend:** Angular 13, Angular Material, NG-ZORRO, amCharts 5, ng2-charts
- **Backend:** Node.js, Express, Mongoose, JWT (jsonwebtoken), bcrypt
- **Base de datos:** MongoDB Atlas (nube)
- **Almacenamiento de archivos:** Firebase Storage + Azure Blob Storage
- **Autenticación:** JWT (JSON Web Tokens)

## 1.3 ¿Qué es la ISO 18091?

La **ISO 18091** es una norma internacional que proporciona directrices para la aplicación de la **ISO 9001** (gestión de calidad) en gobiernos locales. Evalúa **4 cuadrantes** del desarrollo:

| Cuadrante | Nombre | Área de Evaluación |
|:---------:|--------|-------------------|
| **1** | **Gestión Institucional y Organización Gubernamental** | Calidad institucional, transparencia, participación ciudadana |
| **2** | **Desarrollo Económico** | Innovación, empleo, turismo, movilidad, sector primario |
| **3** | **Desarrollo Social** | Servicios públicos, salud, educación, vivienda, inclusión |
| **4** | **Desarrollo Ambiental** | Aire, residuos, agua, suelo, cambio climático |

Cada cuadrante contiene entre **8 y 12 indicadores** (39 en total), y cada indicador tiene **subindicadores** (generales y específicos) que se evalúan mediante **evidencias**.

---

# 2. Roles de Usuario

El sistema cuenta con **3 roles** definidos, cada uno con diferentes permisos y vistas:

## 2.1 Administrador

| Característica | Descripción |
|---------------|-------------|
| **Acceso** | `/admin` y `/user` |
| **Inicio de sesión** | Sí — mediante email y contraseña |
| **Gestión de usuarios** | Crear, editar y eliminar usuarios del GAD |
| **Configuración** | Activar/desactivar publicación automática, gestionar reportes |
| **Calificación** | Calificar evidencias (asignar puntuación con rúbrica) |
| **Evidencias** | Ver, crear y eliminar evidencias |
| **Subindicadores** | Crear y eliminar subindicadores específicos |
| **Dashboard** | Vista completa con resúmenes, gráficos y semáforos |
| **Notificaciones** | Recibir notificaciones de todas las actividades |

**Ejemplo de uso:** El Administrador inicia sesión, revisa las evidencias cargadas por los Responsables, las califica usando la rúbrica, y decide si publica o no los resultados.

## 2.2 Responsable

| Característica | Descripción |
|---------------|-------------|
| **Acceso** | `/admin` y `/user` |
| **Inicio de sesión** | Sí — mediante email y contraseña |
| **Gestión de usuarios** | ❌ No disponible |
| **Configuración** | ❌ No disponible |
| **Calificación** | ❌ No disponible (solo el Administrador califica) |
| **Evidencias** | ✅ Crear y ver evidencias |
| **Subindicadores** | ✅ Crear subindicadores específicos (no eliminar) |
| **Dashboard** | Vista completa con resúmenes y semáforos |
| **Notificaciones** | Recibir notificaciones de actividades relevantes |

**Ejemplo de uso:** El Responsable inicia sesión, navega al indicador correspondiente, carga las evidencias (documentos PDF, imágenes, enlaces) que demuestran el cumplimiento, y luego el Administrador las califica.

## 2.3 Ciudadano

| Característica | Descripción |
|---------------|-------------|
| **Acceso** | Solo `/user` (vista pública) |
| **Inicio de sesión** | No requerido (puede navegar libremente) |
| **Visualización** | ✅ Ver cuadrantes, semáforos, indicadores y evidencias |
| **Edición** | ❌ No puede crear, editar ni eliminar nada |

**Ejemplo de uso:** Un ciudadano ingresa a la página principal, selecciona un cuadrante (ej. "Gestión Institucional"), ve el semáforo del GAD de Loja, y explora el detalle de cada indicador con sus evidencias.

## 2.4 Resumen de Permisos

| Acción | Ciudadano | Responsable | Administrador |
|--------|:---------:|:-----------:|:-------------:|
| Ver landing page | ✅ | ✅ | ✅ |
| Ver cuadrantes y semáforos | ✅ | ✅ | ✅ |
| Ver detalle de indicadores | ✅ | ✅ | ✅ |
| Ver evidencias | ✅ | ✅ | ✅ |
| Iniciar sesión | ❌ | ✅ | ✅ |
| Cargar evidencias | ❌ | ✅ | ✅ |
| Crear subindicadores | ❌ | ✅ | ✅ |
| Eliminar subindicadores | ❌ | ❌ | ✅ |
| Calificar evidencias | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Configurar publicación | ❌ | ❌ | ✅ |
| Recibir notificaciones | ❌ | ✅ | ✅ |

---

# 3. Estructura de la Aplicación (Frontend)

## 3.1 Mapa de Navegación General

```
BALDURWATCH
│
├── /user (Vista Pública — Todos los roles)
│   ├── /user/home (Landing)
│   │   ├── Carrusel de imágenes
│   │   ├── Sección "Transparencia de la Información"
│   │   ├── Cuadrantes 1-4 (tarjetas de acceso rápido)
│   │   └── Patrocinadores (GAD Loja, UTPL)
│   │
│   └── /user/quadrant/:id
│       ├── Resumen del cuadrante (tarjetas con conteos)
│       ├── Semáforo (gráfico pastel amCharts)
│       │
│       └── /user/quadrant/:id/indicator/:n/:instId
│           ├── Datos generales del indicador
│           ├── Subindicadores generales (Instancia Responsable,
│           │   Diagnóstico, Mecanismos, Normativa)
│           └── Subindicadores específicos (lista con colores)
│               │
│               └── /.../:subId (Detalle del subindicador)
│                   ├── Calificación (círculo de color)
│                   ├── Última actualización
│                   ├── Botón "Ver Portada"
│                   ├── Visor de PDF (si aplica)
│                   └── Barra lateral con evidencias agrupadas
│                       por característica
│
├── /admin (Vista Administrativa — Admin y Responsable)
│   ├── /admin/home (Dashboard)
│   │   ├── Información del GAD
│   │   ├── Barras resumen por cuadrante
│   │   ├── Gráficos de dona de subindicadores
│   │   ├── Pestañas: Lista de Indicadores / Cantidad de Documentos
│   │   └── Botón exportar reporte PDF
│   │
│   ├── /admin/quadrant/:id
│   │   └── Semáforo del cuadrante (click para ir al indicador)
│   │
│   ├── /admin/quadrant/:q/indicator/:n/:id (Detalle de Indicador)
│   │   ├── Pestañas de navegación:
│   │   │   ├── Resumen (vista general del indicador)
│   │   │   ├── Instancia Responsable (subindicador tipo 1)
│   │   │   ├── Diagnóstico (subindicador tipo 2)
│   │   │   ├── Mecanismo, Normativa (subindicador tipo 3)
│   │   │   ├── Mecanismos (subindicador tipo 4)
│   │   │   └── Subindicadores Específicos
│   │   │
│   │   ├── Cada Subindicador General:
│   │   │   ├── Información del estado
│   │   │   ├── Historial de calificaciones
│   │   │   └── Botón "Agregar Evidencias"
│   │   │
│   │   └── Subindicadores Específicos:
│   │       ├── Tabla de subindicadores (CRUD)
│   │       ├── Botón "Agregar Subindicador" (3 pasos: datos → evidencias → confirmar)
│   │       └── Revisión de subindicador específico
│   │
│   ├── /admin/workspace/ (Solo Admin)
│   │   ├── /workspace/users (Gestión de Usuarios)
│   │   │   └── Tabla + modales de creación/edición/eliminación
│   │   └── /workspace/wkconfig (Configuración)
│   │       ├── Switch publicación automática/manual
│   │       └── Gestión de reportes
│   │
│   ├── /admin/notifications
│   │   └── Lista de notificaciones (leídas/no leídas)
│   │
│   ├── /admin/config
│   │   └── Cambio de contraseña
│   │
│   └── /admin/help
│       └── Enlaces a documentación ISO 18091
│
└── /login
    └── Formulario de inicio de sesión
        └── (Redirige a /admin o /user según el rol)
```

## 3.2 Pantallas Principales

### Pantalla de Inicio (Vista Pública)

La pantalla de inicio (`/user/home`) muestra:
- **Barra superior:** Información de contacto, selector de período y widget de inicio de sesión
- **Encabezado:** Logotipo y título "Transparencia de la Información / Gobiernos Abiertos"
- **Barra de navegación:** Inicio, Cuadrante 1-4, Ingresar (link al login)
- **Carrusel:** Imágenes institucionales rotativas
- **Sección descriptiva:** Explicación del sistema ISO 18091
- **Tarjetas de cuadrantes:** Acceso directo a cada uno de los 4 cuadrantes
- **Patrocinadores:** GAD Loja, UTPL
- **Pie de página:** Enlaces, contacto, créditos

### Dashboard (Vista Administrativa)

El panel principal (`/admin/home`) contiene:
- **Información del GAD:** Nombre, ciudad, código
- **Barras de resumen:** Porcentaje de cumplimiento por cada cuadrante
- **Gráficos de dona:** Distribución de subindicadores por estado
- **Pestañas:**
  - *Lista de Indicadores:* Tabla con todos los indicadores y su color
  - *Cantidad de Documentos:* Distribución de evidencias cargadas
- **Notificaciones:** Campana con contador de no leídas en el encabezado

### Detalle de Indicador

Al seleccionar un indicador se muestra:
- **Barra de pestañas** con las categorías de subindicadores
- **Resumen:** Tarjetas con calificación general, conteo de evidencias, última actualización
- **Subindicadores Generales:** Por cada tipo (Instancia Responsable, Diagnóstico, etc.) se muestra el estado actual y botón para agregar evidencias
- **Subindicadores Específicos:** Tabla con nombre, responsable, calificación, acciones (editar/eliminar/agregar evidencias)

### Formulario de Evidencias

Al hacer clic en "Agregar Evidencias" se abre un asistente de **2 pasos**:
1. **Registrar evidencias:** Por cada característica del tipo de subindicador, se puede cargar un archivo (PDF, imagen) o pegar un enlace, con observaciones
2. **Cuadro Resumen:** Vista previa de todo lo que se va a guardar

### Gestión de Usuarios (Solo Admin)

Pantalla con tabla de usuarios del GAD, donde el Administrador puede:
- **Agregar:** Modal con nombre, email, contraseña y rol
- **Editar:** Modificar datos del usuario
- **Eliminar:** Eliminar usuario del sistema

## 3.3 Barra Lateral de Administración (Admin Sidebar)

```
┌──────────────────────┐
│ 🏠 Inicio            │
│                      │
│ 📊 Cuadrante 1       │
│   ├── Indicador 1.1  │
│   ├── Indicador 1.2  │
│   └── ...            │
│ 📊 Cuadrante 2       │
│ 📊 Cuadrante 3       │
│ 📊 Cuadrante 4       │
│                      │
│ 👤 Perfil            │
│   ├── 🔑 Cambiar     │
│   │   Contraseña     │
│   └── 🔔 Notificacio-│
│       nes            │
│                      │
│ ⚙️ [GAD Name]         │  ← Solo Administrador
│   ├── 👥 Usuarios    │
│   └── ⚙️ Configura-  │
│       ción           │
│                      │
│ ❓ Ayuda             │
└──────────────────────┘
```

---

# 4. Flujo de Trabajo (Backend)

## 4.1 Estructura de Datos

```
GAD (Municipio)
│
├── Período (ej: 2023)
│   │
│   └── Indicadores (x39, organizados en 4 cuadrantes)
│       │
│       ├── Subindicadores Generales (x4 tipos fijos)
│       │   ├── Instancia Responsable
│       │   ├── Diagnóstico
│       │   ├── Mecanismo, Normativa y Reglamentación
│       │   └── Mecanismos de Operación
│       │       │
│       │       └── Evidencias (documentos, enlaces)
│       │           └── Rúbricas (calificación detallada)
│       │
│       └── Subindicadores Específicos (variables, creados por el usuario)
│           │
│           └── Evidencias + Rúbricas
```

## 4.2 Ciclo de Evaluación

```
1. CONFIGURACIÓN
   └── El Administrador configura el GAD, crea usuarios y el período
   
2. CARGA DE EVIDENCIAS (Responsable)
   └── El Responsable navega al indicador → subindicador
       → completa las evidencias requeridas (archivos/enlaces)
       
3. CALIFICACIÓN (Administrador)
   └── El Administrador revisa las evidencias
       → asigna puntuación mediante rúbrica
       → el sistema recalcula automáticamente la calificación
       
4. PUBLICACIÓN
   └── Automática (si está configurada): los resultados se publican
       inmediatamente después de calificar
   └── Manual: el Administrador decide cuándo publicar

5. CONSULTA (Ciudadano)
   └── Los ciudadanos ven los resultados publicados con el semáforo
```

## 4.3 Sistema de Calificación (Semáforo)

### Niveles de Calificación

| Valor | Color | Significado | Descripción |
|:-----:|:-----:|-------------|-------------|
| **3** | 🟢 Verde | Aceptable | Todos los subindicadores evaluados y en verde |
| **2** | 🟡 Amarillo | Por debajo de lo aceptable | Sin rojos, pero no todos en verde |
| **1** | 🔴 Rojo | Inaceptable | Uno o más subindicadores en rojo |
| **0** | ⚪ Gris | Sin evaluar | No se han cargado evidencias |

### Lógica de Calificación

**1. Calificación del Subindicador:**
Se calcula según el porcentaje de cumplimiento de las características del tipo de subindicador:

| Porcentaje | Calificación |
|:----------:|:------------:|
| ≥ 90% | 🟢 **3** (Verde) |
| > 50% y < 90% | 🟡 **2** (Amarillo) |
| > 20% y ≤ 50% | 🔴 **1** (Rojo) |
| ≤ 20% | ⚪ **0** (Gris) |

**2. Calificación del Indicador:**
Se propaga desde los subindicadores hacia arriba:

| Condición | Resultado |
|-----------|:---------:|
| Al menos 1 subindicador en **rojo (1)** | 🔴 **Rojo** |
| Sin rojos, y +50% de subindicadores evaluados en amarillo | 🟡 **Amarillo** |
| Todos en verde (3) y más de 4 evaluados | 🟢 **Verde** |
| Más de la mitad en verde | 🟡 **Amarillo** |
| Al menos 1 evaluado pero sin verde | 🔴 **Rojo** |
| Ninguno evaluado | ⚪ **Gris** |

## 4.4 API REST — Endpoints Principales

### Autenticación

```bash
# Iniciar sesión
POST /api/login
Body: { "mail": "usuario@ejemplo.com", "password": "********" }
Response: { "token": "eyJ...", "id": "..." }
```

Todas las solicitudes posteriores deben incluir:
```
Authorization: Bearer eyJ...
tenant: 64616f718e118fb22d4059e3
```

### Recursos Principales

| Recurso | Métodos | Descripción |
|---------|---------|-------------|
| `/api/gad` | GET, POST, PUT | Gestión de GADs |
| `/api/period` | GET, POST, DELETE | Períodos de evaluación |
| `/api/indicators` | GET, POST, PUT, DELETE | Catálogo de indicadores ISO 18091 |
| `/api/indicatorsInstance` | GET, PUT, DELETE | Instancias de indicadores por GAD/período |
| `/api/subIndicators` | GET, POST, PUT, DELETE | Subindicadores (generales y específicos) |
| `/api/evidences` | GET, POST, PUT, DELETE | Evidencias cargadas |
| `/api/evidences/qualify/:id` | PUT | Calificar una evidencia (solo Admin) |
| `/api/characteristics` | GET, POST | Características/requisitos de evidencia |
| `/api/type` | GET, POST | Tipos de subindicadores |
| `/api/valuation` | GET, POST | Criterios de rúbrica |
| `/api/users` | GET, POST, PUT, DELETE | Usuarios del sistema |
| `/api/rols` | GET | Roles disponibles |
| `/api/notifications` | GET, POST, PUT, DELETE | Notificaciones del sistema |
| `/api/commits` | GET, POST, PUT, DELETE | Historial de cambios |

---

# 5. Estado del GAD de Loja — Período 2023

## 5.1 Resumen General

| Métrica | Valor |
|---------|:-----:|
| **GAD** | Gobierno Autónomo Descentralizado de Loja |
| **Ciudad** | Loja |
| **Período evaluado** | 2023 |
| **Total indicadores** | 39 |
| **Indicadores evaluados** | 39 (100%) |
| **Subindicadores** | 343 |
| **Evidencias cargadas** | 378 |
| **Calificaciones (rúbricas)** | 3,515 |
| **Notificaciones generadas** | 2,052 |
| **Usuarios registrados** | 9 |

### Distribución por Color

```
🟢 VERDE:    0 indicadores ( 0%)
🟡 AMARILLO: 20 indicadores (51%)
🔴 ROJO:     19 indicadores (49%)
⚪ GRIS:     0 indicadores ( 0%)
```

## 5.2 Cuadrante 1 — Gestión Institucional

**Estado:** 5 🟡 Amarillo | 5 🔴 Rojo | 0 🟢 Verde

| # | Indicador | Estado | Subindicadores | Por qué está en ese color |
|:-:|-----------|:------:|:--------------:|---------------------------|
| 1.1 | Gestión integral de la calidad | 🔴 ROJO | 1 gris, 2 rojo, 0 amarillo, 0 verde | Hay subindicadores en rojo → todo el indicador se pone rojo |
| 1.2 | Asociación y colaboración comprometida | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 1.3 | Profesionalización de los servidores públicos | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 1.4 | Finanzas públicas y responsabilidad fiscal | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 1.5 | TIC y gestión de datos | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 1.6 | Estado de derecho y derechos humanos | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 1.7 | Transparencia y comunicación | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 1.8 | Participación ciudadana | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 1.9 | Protección civil y resiliencia | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 1.10 | Seguridad pública | 🔴 ROJO | 2 gris, 0 rojo, 2 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |

**Total Cuadrante 1:** 5 🔴 Rojo, 5 🟡 Amarillo

## 5.3 Cuadrante 2 — Desarrollo Económico

**Estado:** 1 🟡 Amarillo | 7 🔴 Rojo | 0 🟢 Verde

| # | Indicador | Estado | Subindicadores | Por qué está en ese color |
|:-:|-----------|:------:|:--------------:|---------------------------|
| 2.1 | Innovación y competitividad | 🔴 ROJO | 2 gris, 0 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 2.2 | Trabajo decente y crecimiento económico | 🔴 ROJO | 0 gris, 1 rojo, 2 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 2.3 | Seguridad alimentaria y hambre cero | 🔴 ROJO | 0 gris, 2 rojo, 1 amarillo, 0 verde | Hay subindicadores en rojo → todo rojo |
| 2.4 | Formación profesional | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 2.5 | Turismo | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 2.6 | Movilidad | 🔴 ROJO | 0 gris, 2 rojo, 1 amarillo, 0 verde | Hay subindicadores en rojo → todo rojo |
| 2.7 | Sector primario | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 2.8 | Industria, comercio y consumo | 🔴 ROJO | 2 gris, 0 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |

**Total Cuadrante 2:** 7 🔴 Rojo, 1 🟡 Amarillo

## 5.4 Cuadrante 3 — Desarrollo Social

**Estado:** 8 🟡 Amarillo | 4 🔴 Rojo | 0 🟢 Verde

| # | Indicador | Estado | Subindicadores | Por qué está en ese color |
|:-:|-----------|:------:|:--------------:|---------------------------|
| 3.1 | Servicios públicos | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.2 | Deporte, recreación y ocio | 🔴 ROJO | 0 subindicadores | Sin subindicadores (calificación manual asignada) |
| 3.3 | Migración e inclusión étnica y social | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 3.4 | Igualdad de género | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 3.5 | Población vulnerable y personas con discapacidad | 🔴 ROJO | 1 gris, 1 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 3.6 | Buena salud y bienestar | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.7 | Educación de calidad | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.8 | Vivienda digna | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.9 | Convivencia pacífica y cultura cívica | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.10 | Patrimonio cultural | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.11 | Fin de la pobreza | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 3.12 | Niños, jóvenes y adultos mayores | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |

**Total Cuadrante 3:** 4 🔴 Rojo, 8 🟡 Amarillo

## 5.5 Cuadrante 4 — Desarrollo Ambiental

**Estado:** 6 🟡 Amarillo | 3 🔴 Rojo | 0 🟢 Verde

| # | Indicador | Estado | Subindicadores | Por qué está en ese color |
|:-:|-----------|:------:|:--------------:|---------------------------|
| 4.1 | Calidad del aire | 🔴 ROJO | 2 gris, 0 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 4.2 | Residuos sólidos | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 4.3 | Imagen del entorno y atractividad | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 4.4 | Recursos naturales, biodiversidad y ecosistema | 🔴 ROJO | 0 gris, 1 rojo, 2 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 4.5 | Planificación urbana y desarrollo | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 4.6 | Agua limpia, saneamiento y aguas residuales | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 4.7 | Protección del suelo | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |
| 4.8 | Energía asequible y limpia | 🔴 ROJO | 2 gris, 0 rojo, 1 amarillo, 0 verde | Hay subindicador en rojo → todo rojo |
| 4.9 | Acciones para el cambio climático y educación ambiental | 🟡 AMARILLO | 1 gris, 0 rojo, 2 amarillo, 0 verde | Sin rojos, +50% evaluados en amarillo |

**Total Cuadrante 4:** 3 🔴 Rojo, 6 🟡 Amarillo

## 5.6 Resumen por Cuadrante

| Cuadrante | Total | 🟢 Verde | 🟡 Amarillo | 🔴 Rojo |
|-----------|:-----:|:--------:|:-----------:|:-------:|
| **1. Gestión Institucional** | 10 | 0 | 5 | 5 |
| **2. Desarrollo Económico** | 8 | 0 | 1 | 7 |
| **3. Desarrollo Social** | 12 | 0 | 8 | 4 |
| **4. Desarrollo Ambiental** | 9 | 0 | 6 | 3 |
| **GAD Loja 2023** | **39** | **0** | **20** | **19** |

### Observaciones Importantes

1. **Ningún indicador alcanzó el nivel VERDE** — Esto se debe a que ningún indicador tiene todos sus subindicadores evaluados al 90% o más. La mayoría tiene 1 subindicador en gris (sin evaluar) y 2 en amarillo.

2. **El Cuadrante 2 (Desarrollo Económico) es el más crítico** — 7 de 8 indicadores están en rojo, lo que indica que hay subindicadores con calificación 1 que arrastran a todo el indicador.

3. **El indicador 3.2 (Deporte, recreación y ocio)** aparece con 0 subindicadores pero calificación 1 (rojo) — esto sugiere que se le asignó una calificación manual o hay un caso especial.

4. **El Cuadrante 3 (Desarrollo Social) es el mejor posicionado** — 8 de 12 indicadores están en amarillo, lo que muestra avances significativos en educación, salud, vivienda y servicios sociales.

5. **Patrón recurrente:** La mayoría de los indicadores amarillos tienen exactamente 1 subindicador en gris y 2 en amarillo, lo que significa que se cargaron evidencias pero aún no se completan todos los requisitos del tipo de subindicador.

---

# 6. Configuración y Despliegue

## 6.1 Requisitos del Sistema

- **Node.js** v16 o superior
- **npm** v8 o superior
- **MongoDB Atlas** cuenta (o instancia local)
- **Firebase** proyecto (para hosting y storage)
- **Angular CLI** 13 (para desarrollo frontend)

## 6.2 Variables de Entorno (Backend)

Archivo `.env`:
```
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ISO18091
SECRET=<jwt_secret_key>
ROL_ADMIN=Administrador
ROL_ADMIN_KEY=<object_id_del_rol_admin>
ROL_REPONSIBLE=Responsable
ROL_USER=Ciudadano
TEST_MONGODB_URI=<uri_de_base_de_datos_de_prueba>
```

## 6.3 Variables de Entorno (Frontend)

Archivo `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  API_URL: 'http://localhost:3001',
  // En producción: 'https://iso-18091-backend-test-production.up.railway.app'
  ROL_ADMIN: 'Administrador',
  ROL_RESPONSIBLE: 'Responsable',
  TENATID: '<id_del_gad>',
  firebase: {
    projectId: 'iso18091storage',
    // ...credenciales de Firebase
  }
};
```

## 6.4 Comandos para Desarrollo

```bash
# Backend
cd backend
npm install           # Instalar dependencias
npm run dev           # Iniciar en modo desarrollo (con nodemon)
npm run start         # Iniciar en modo producción
npm test              # Ejecutar pruebas con Jest
npm run lint          # Ejecutar linter ESLint

# Frontend
cd baldurwatch
npm install           # Instalar dependencias
ng serve              # Servidor de desarrollo en http://localhost:4200
ng build              # Construir para producción
ng test               # Ejecutar pruebas unitarias
```

---

# 7. Preguntas Frecuentes

## 7.1 ¿Cómo inicio sesión?

1. Vaya a la página principal (`/user`)
2. Haga clic en **"Ingresar"** en la barra de navegación
3. Ingrese su **correo electrónico** y **contraseña**
4. Si es Administrador o Responsable, será redirigido al panel de administración (`/admin`)
5. Si es Ciudadano, será redirigido a la vista pública (`/user`)

## 7.2 ¿Olvidé mi contraseña?

Contacte al **Administrador del GAD** para que le restablezca la contraseña. Desde el panel de administración, en `Workspace > Usuarios`, puede editar su usuario y asignar una nueva contraseña.

## 7.3 ¿Cómo cargo una evidencia?

1. Inicie sesión como **Responsable** o **Administrador**
2. Navegue al indicador deseado (sidebar > cuadrante > indicador)
3. Seleccione la pestaña del tipo de subindicador (ej: "Instancia Responsable")
4. Haga clic en **"Agregar Evidencias"**
5. En el formulario, por cada característica requerida:
   - Puede **subir un archivo** (PDF, imagen) o **pegar un enlace**
   - Agregue **observaciones** si es necesario
6. Revise el resumen y confirme

## 7.4 ¿Qué significa cada color del semáforo?

| Color | Significado |
|:-----:|-------------|
| 🟢 **Verde** | El indicador cumple satisfactoriamente (≥90% de los requisitos) |
| 🟡 **Amarillo** | El indicador está por debajo de lo aceptable pero avanzando |
| 🔴 **Rojo** | El indicador tiene deficiencias críticas que requieren atención |
| ⚪ **Gris** | El indicador no ha sido evaluado aún (sin evidencias) |

## 7.5 ¿Cómo sé si mi GAD ya publicó los resultados?

En la configuración del GAD (solo Admin), hay un switch de **"Publicación automática"**. Si está activado, los resultados se publican automáticamente cuando el Administrador califica las evidencias. Si está desactivado, el Administrador debe publicar manualmente.

Los resultados publicados son visibles en la vista pública (`/user`) para todos los ciudadanos.

## 7.6 ¿Puedo editar una evidencia ya cargada?

Sí, pero solo el **Administrador** puede modificar o eliminar evidencias. Los Responsables pueden crear nuevas evidencias pero no modificar las existentes una vez creadas.

## 7.7 ¿Cuántos tipos de subindicadores existen?

Existen **2 categorías principales**:

1. **Subindicadores Generales (4 tipos fijos):**
   - Instancia Responsable
   - Diagnóstico
   - Mecanismo, Normativa y Reglamentación
   - Mecanismos de Operación

2. **Subindicadores Específicos:** Son creados por el usuario (Responsable o Admin) según las necesidades específicas del GAD para cada indicador.

## 7.8 ¿Qué es una rúbrica?

Una **rúbrica** es un criterio de calificación detallado que el Administrador utiliza para evaluar cada evidencia. Existen 38 criterios de valoración organizados en 2 categorías:
- **Requisitos:** Firma, sello, logos, páginas resaltadas (5 criterios)
- **Calidad:** Competencias, diagnóstico, recursos, relación con el indicador (9 criterios)

---

# 8. Solución de Problemas Comunes

## 8.1 Error de conexión al servidor

**Problema:** La aplicación muestra "Error de conexión" o no carga los datos.

**Posibles causas y soluciones:**
- **Backend caído:** Verifique que el servidor backend esté corriendo (Railway.app)
- **Base de datos caída:** Verifique el estado del clúster MongoDB Atlas
- **CORS:** Asegúrese de que el dominio del frontend esté en la lista de orígenes permitidos en `app.js`
- **Red:** Verifique su conexión a internet

## 8.2 No veo el botón para agregar evidencias

**Problema:** El botón "Agregar Evidencias" no aparece.

**Causa probable:** Su rol no tiene permisos para agregar evidencias. Solo **Responsable** y **Administrador** pueden hacerlo. Si ha iniciado sesión como Ciudadano o no ha iniciado sesión, no verá este botón.

**Solución:** Inicie sesión con una cuenta que tenga rol de Responsable o Administrador.

## 8.3 La calificación no se actualiza

**Problema:** Después de cargar una evidencia, la calificación del subindicador no cambia.

**Causa probable:** La calificación solo se actualiza cuando el **Administrador** califica la evidencia (asigna puntuación mediante la rúbrica). El simple hecho de cargar una evidencia no cambia la calificación automáticamente.

**Solución:** Espere a que el Administrador revise y califique la evidencia.

## 8.4 El PDF no se visualiza

**Problema:** Al hacer clic en "Ver Portada" o en una evidencia PDF, no se muestra el documento.

**Posibles causas y soluciones:**
- **Archivo corrupto:** Verifique que el archivo se haya subido correctamente
- **Formato no soportado:** Solo PDF, imágenes (JPG, PNG) son soportados
- **Firebase Storage:** Verifique que el archivo exista en Firebase Storage
- **Permisos:** Verifique que la URL de descarga no haya expirado

## 8.5 Error "Token expirado"

**Problema:** Aparece el mensaje "token expired" y la aplicación cierra la sesión.

**Solución:** Vuelva a iniciar sesión. Los tokens JWT tienen una duración limitada por seguridad.

## 8.6 No aparecen los indicadores del período

**Problema:** Al seleccionar un período, no se muestran indicadores.

**Posibles causas:**
- El período no tiene instancias de indicadores creadas
- Debe crear el período desde el panel de administración usando la opción "Crear nuevo período" que genera automáticamente todas las instancias de indicadores y subindicadores por defecto

---

# 9. Referencias

- **Repositorio Backend:** https://github.com/paxasaval/ISO-18091-BACKEND
- **Norma ISO 18091:** https://www.iso.org/standard/72808.html
- **Portal del GAD Loja:** https://www.loja.gob.ec
- **Firebase Console:** https://console.firebase.google.com
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## Tabla de Versiones

| Componente | Versión |
|------------|:-------:|
| Backend (ISO-18091-BACKEND) | 0.1.2 |
| Frontend (BaldurWatch) | 0.0.0 |
| Angular | 13.4 |
| Node.js | 16+ |
| MongoDB | 7.0 |

---

*Documentación generada a partir del análisis del código fuente y la base de datos. Junio 2026.*
