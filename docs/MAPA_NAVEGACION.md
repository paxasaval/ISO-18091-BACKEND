# Mapa de Navegación — BaldurWatch por Roles

## Índice
1. [Vista General — Rutas Base](#1-vista-general--rutas-base)
2. [Navegación del Ciudadano](#2-navegacin-del-ciudadano-vista-pblica)
3. [Navegación del Responsable](#3-navegacin-del-responsable)
4. [Navegación del Administrador](#4-navegacin-del-administrador)
5. [Mapa Detallado de un Indicador](#5-mapa-detallado-de-un-indicador)
6. [Asistente de Evidencias (2 pasos)](#6-asistente-de-evidencias-2-pasos)
7. [Asistente de Subindicador Específico (3 pasos)](#7-asistente-de-subindicador-espacifico-3-pasos)
8. [Diagrama de Decisión por Rol](#8-diagrama-de-decisin-por-rol)

---

# 1. Vista General — Rutas Base

```
                         BALDURWATCH
                        ─────────────────
                              │
                    ┌─────────┴──────────┐
                    │                     │
                    ▼                     ▼
               ┌──────────┐        ┌──────────┐
               │  /login   │        │   /user   │
               │  (Publico)│        │ (Publico) │
               └─────┬────┘        └─────┬─────┘
                     │                   │
                     ▼                   │
            ┌────────────────┐           │
            │ Autenticacion  │           │
            │ Email + Pass?  │           │
            └───────┬────────┘           │
                    │                    │
          ┌─────────┴──────────┐         │
          │                    │         │
          ▼                    ▼         ▼
   ┌──────────────┐    ┌──────────────┐
   │  /admin       │    │    /user     │
   │  Responsable  │    │  Ciudadano   │
   │  + Admin      │    │  (Solo leer) │
   └──────────────┘    └──────────────┘

Rutas base:
  /             → Redirige a /user
  /user         → GeneralUserModule (sin guard — acceso publico)
  /admin        → AdminHomeModule (con AuthGuard — solo Responsable + Admin)
  /login        → LoginModule (publico)
```

---

# 2. Navegacion del Ciudadano (Vista Publica)

```
INICIO
  ├── Ingresa a https://iso18091storage.web.app
  │
  ▼
┌──────────────────────────────────────────────────┐
│  /user/home  —  LANDING PAGE                     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ Barra de navegacion (6 opciones):       │     │
│  │ [🏠 Inicio] [📊 C1] [📊 C2] [📊 C3]   │     │
│  │ [📊 C4] [🔑 Ingresar]                  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ 🖼️ CARRUSEL de imagenes institucionales │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ 📝 Seccion "Transparencia de la         │     │
│  │    Informacion / Gobiernos Abiertos"    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ 4 TARJETAS DE CUADRANTES               │     │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │     │
│  │ │  C1  │ │  C2  │ │  C3  │ │  C4  │   │     │
│  │ │Gesti│ │Econ.│ │Social│ │Ambien│   │     │
│  │ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘   │     │
│  └─────┼────────┼────────┼────────┼───────┘     │
│        │        │        │        │              │
│  ┌─────┴────────┴────────┴────────┴───────┐     │
│  │ 🏛️ PATROCINADORES (GAD Loja, UTPL)    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │ 📋 FOOTER (enlaces, contacto, creditos) │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │  Click en "Ingresar"      │
            │  o en un Cuadrante        │
            └─────────────┬─────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
          ▼                                ▼
┌─────────────────────┐        ┌───────────────────────────┐
│ /login/signIn       │        │ /user/quadrant/:id        │
│ FORMULARIO LOGIN    │        │ VISTA DEL CUADRANTE       │
│                     │        │                           │
│ ┌─────────────────┐ │        │ ┌───────────────────────┐ │
│ │ Email           │ │        │ │ 📊 Resumen del        │ │
│ │ Contrasena      │ │        │ │    cuadrante          │ │
│ │                 │ │        │ │ • Indicadores evaluados│ │
│ │ [🔑 Ingresar]   │ │        │ │ • Evidencias cargadas │ │
│ └─────────────────┘ │        │ │ • Subindicadores      │ │
│                     │        │ └───────────────────────┘ │
│ Al ingresar:        │        │                           │
│ Admin/Resp → /admin │        │ ┌───────────────────────┐ │
│ Ciudadano → /user   │        │ │ 🎯 SEMAFORO           │ │
└─────────────────────┘        │ │ (grafico pastel       │ │
                               │ │  amCharts)            │ │
                               │ │ • 🟢 Verde: N         │ │
                               │ │ • 🟡 Amarillo: N      │ │
                               │ │ • 🔴 Rojo: N          │ │
                               │ │ • ⚪ Gris: N          │ │
                               │ └───────────────────────┘ │
                               │                           │
                               │ Click en cada indicador   │
                               │ del semaforo              │
                               └──────────────┬────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────┐
                    │ /user/quadrant/:id/indicator/:n/:instId │
                    │ DETALLE DEL INDICADOR                  │
                    │                                         │
                    │ ┌─────────────────────────────────────┐ │
                    │ │ 📋 DATOS GENERALES                  │ │
                    │ │ • Nombre: Indicador X.Y             │ │
                    │ │ • Calificacion: 🟡/🔴/🟢/⚪        │ │
                    │ └─────────────────────────────────────┘ │
                    │                                         │
                    │ ┌─────────────────────────────────────┐ │
                    │ │ 🟢 SUb. GRAL: Instancia Responsable │ │
                    │ │ 🟡 SUb. GRAL: Diagnostico           │ │
                    │ │ 🟠 SUb. GRAL: Mecanismo/Normativa   │ │
                    │ │ 🔴 SUb. GRAL: Mecanismos de Operac. │ │
                    │ └─────────────────────────────────────┘ │
                    │                                         │
                    │ ┌─────────────────────────────────────┐ │
                    │ │ 🟣 SUBINDICADORES ESPECIFICOS      │ │
                    │ │ (lista con alerta de color)         │ │
                    │ └─────────────────────────────────────┘ │
                    │                                         │
                    │ Click en un subindicador                │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
        ┌──────────────────────────────────────────────────────┐
        │ /user/quadrant/:id/indicator/:n/:instId/:subId      │
        │ DETALLE DEL SUBINDICADOR                            │
        │                                                      │
        │ ┌──────────────────────────────────────────────────┐ │
        │ │ 🔵 CALIFICACION (circulo de color)               │ │
        │ │ 📅 Ultima actualizacion: ...                     │ │
        │ │ 📄 [Ver Portada] (si aplica)                     │ │
        │ └──────────────────────────────────────────────────┘ │
        │                                                      │
        │ ┌──────────────────────────────────────────────────┐ │
        │ │ 📄 VISOR PDF (si la portada es un PDF)           │ │
        │ └──────────────────────────────────────────────────┘ │
        │                                                      │
        │ ┌──────────────────────────────────────────────────┐ │
        │ │ 📎 BARRA LATERAL DE EVIDENCIAS                  │ │
        │ │                                                 │ │
        │ │ ● Caracteristica 1: [Nombre]                    │ │
        │ │   ├── Evidencia 1 (PDF) 📄                      │ │
        │ │   └── Evidencia 2 (Link) 🔗                     │ │
        │ │                                                 │ │
        │ │ ● Caracteristica 2: [Nombre]                    │ │
        │ │   └── Evidencia 3 (PDF) 📄                      │ │
        │ └──────────────────────────────────────────────────┘ │
        └──────────────────────────────────────────────────────┘
```

---

# 3. Navegacion del Responsable

Flujo tipico para **cargar evidencias** y **crear subindicadores especificos**.

```
INICIO
  │
  ├── Abre la aplicacion
  ├── Hace clic en "Ingresar"
  │
  ▼
┌─────────────────────────────────────────┐
│  /login/signIn                          │
│  FORMULARIO DE LOGIN                    │
│                                         │
│  Email:    [____________________]       │
│  Password: [____________________]       │
│                                         │
│  [🔑 Ingresar]                          │
│                                         │
│  → Backend valida credenciales          │
│  → Rol = "Responsable"                  │
│  → Redirige a /admin                    │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│  /admin/home  —  DASHBOARD                           │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🟦 ADMIN HEADER                                 ││
│  │ [Logo]  Transparencia de la Informacion          ││
│  │ Periodo: [2023 ▼]     🔔 (3)  👤 Nombre Apellido││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ SIDEBAR  │  │ CONTENIDO PRINCIPAL              │  │
│  │          │  │                                   │  │
│  │ 🏠 Inicio│  │ 🏛️ Informacion del GAD           │  │
│  │          │  │ • GAD: Loja                       │  │
│  │ 📊 C1    │  │ • Ciudad: Loja                    │  │
│  │ 📊 C2    │  │ • Codigo: ...                     │  │
│  │ 📊 C3    │  │                                   │  │
│  │ 📊 C4    │  │ 📊 Barras de resumen x cuadrante  │  │
│  │          │  │                                   │  │
│  │ 👤 Perfil │  │ 🍩 Graficos de dona              │  │
│  │  ├🔑Pass │  │                                   │  │
│  │  └🔔Notif│  │ 📋 Pestañas:                     │  │
│  │          │  │  [Lista Indicadores] [Documentos] │  │
│  │ ❓Ayuda  │  │                                   │  │
│  └──────────┘  └──────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │
  ┌───────────────────┴─────────────────────┐
  │                                         │
  ▼                                         ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ SIDEBAR: Click en        │   │ SIDEBAR: Click en            │
│ Cuadrante 1-4            │   │ Perfil → Notificaciones      │
└────────────┬─────────────┘   └──────────────┬───────────────┘
             │                                │
             ▼                                ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ /admin/quadrant/:id      │   │ /admin/notifications         │
│ SEMAFORO DEL CUADRANTE   │   │ LISTA DE NOTIFICACIONES      │
│                           │   │                              │
│ Grafico pastel con       │   │ 🔔 Notif 1 (no leida)        │
│ indicadores coloreados   │   │ 🔔 Notif 2 (no leida)        │
│                           │   │ ✅ Notif 3 (leida)           │
│ Click en un indicador    │   │                              │
└────────────┬─────────────┘   └──────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────────────────────┐
│ /admin/quadrant/:q/indicator/:n/:id                       │
│ DETALLE DEL INDICADOR — PESTAÑAS                          │
│                                                            │
│ ┌──────────┬──────────┬──────────┬──────────┬───────────┐ │
│ │ Resumen  │Instancia │Diagnost. │Mecanism. │ Especif.  │ │
│ │          │Responsab.│          │/Normativa│           │ │
│ └──────────┴──────────┴──────────┴──────────┴───────────┘ │
│                                                            │
│ ── Si elige "Resumen" ──────────────────────────────────  │
│                                                            │
│ 🔵 RESUMEN DEL INDICADOR                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│ │ 🟡 Calificac.│ │ 📎 Evidencias│ │ 📅 Ultima         │    │
│ │   Amarillo   │ │   12         │ │    actualizacion  │    │
│ └──────────────┘ └──────────────┘ └──────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ 📋 Subindicadores Generales                        │    │
│ │                                                   │    │
│ │ Tipo           │Calif│ Evids │                     │    │
│ │────────────────│─────│───────│                     │    │
│ │Inst. Responsab.│ 🟡  │   3   │                     │    │
│ │Diagnostico     │ 🟡  │   2   │                     │    │
│ │Mecanismo/Norm. │ 🔴  │   1   │                     │    │
│ │Mec. Operacion  │ 🟡  │   3   │                     │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ 🟣 Subindicadores Especificos                      │    │
│ │ (click para ir al detalle)                         │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ── Si elige una pestana de tipo (ej: "Instancia ──────  │
│    Responsable")                                          │
│                                                            │
│ /admin/quadrant/:q/indicator/:n/:id/[Tipo]                │
│                                                            │
│ 🟢 Instancia Responsable                                   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ ℹ️ Informacion del Subindicador                    │    │
│ │ • Nombre: Subindicador de Instancia Responsable    │    │
│ │ • Responsable: [Nombre]                            │    │
│ │ • Calificacion: 🟡 (2)                             │    │
│ │ • Estado: ⚪/🔴/🟡/🟢                              │    │
│ │ • Evidencias: N cargadas                           │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ 📜 Historial de Calificaciones                    │    │
│ │ • 01/06/2023 → 🟡 (2) [Admin: Juan]               │    │
│ │ • 15/05/2023 → 🔴 (1) [Admin: Juan]               │    │
│ │ • 01/04/2023 → ⚪ (0)                              │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [➕ Agregar Evidencias] ★★ BOTON PRINCIPAL ★★     │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ Click en "Agregar Evidencias"                              │
└──────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────────┐
              │  ASISTENTE DE EVIDENCIAS (2 pasos) │
              │  Ver seccion 6 de este documento   │
              └────────────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────────┐
              │  ✅ Evidencia guardada             │
              │  → Espera a que el Admin califique │
              └────────────────────────────────────┘

══════════════════════════════════════════════════════════════
  FLUJO ALTERNATIVO: SUBINDICADORES ESPECIFICOS
══════════════════════════════════════════════════════════════

Desde el detalle del indicador, pestana "Subindicadores Especificos":

┌──────────────────────────────────────────────────────────┐
│ /admin/.../Subindicadores-Especificos                    │
│                                                           │
│ 🟣 SUBINDICADORES ESPECIFICOS                             │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Buscar: [___________________________] [🔍]          │  │
│ │                                                     │  │
│ │ ┌────┬──────────────────┬──────────┬──────┬──────┐ │  │
│ │ │ #  │ Nombre            │ Responsable│Calif│ Acc.│ │  │
│ │ ├────┼──────────────────┼──────────┼──────┼──────┤ │  │
│ │ │ 1  │ Programa X       │ Pedro P. │ 🟡   │ 👁🗑️│ │  │
│ │ │ 2  │ Iniciativa Y     │ Maria G. │ 🔴   │ 👁🗑️│ │  │
│ │ │ 3  │ Proyecto Z       │ Juan L.  │ ⚪    │ 👁🗑️│ │  │
│ │ └────┴──────────────────┴──────────┴──────┴──────┘ │  │
│ │                                                     │  │
│ │ [➕ Agregar Subindicador]                            │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ Click en "Agregar Subindicador"  o  Click en uno exist. │
└────────────────────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
              ▼                              ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│ ASISTENTE SUBINDICADOR  │   │ /.../Subindicadores-Esp/:/:id│
│ (3 pasos)               │   │ DETALLE DEL SUBINDICADOR    │
│ Ver seccion 7           │   │ ESPECIFICO                  │
│                          │   │                             │
│                          │   │ (Misma vista que el         │
│                          │   │  subindicador general)      │
│                          │   │                             │
│                          │   │ [➕ Agregar Evidencias]      │
│                          │   │ → Asistente de 2 pasos     │
└──────────────────────────┘   └─────────────────────────────┘
```

---

# 4. Navegacion del Administrador

El Administrador tiene **todo** lo del Responsable, mas:

```
┌────────────────────────────────────────────────────────────┐
│ 🛠️ WORKSPACE — Solo visible para ADMIN                    │
│                                                             │
│ ── GESTION DE USUARIOS ──────────────────────────────────  │
│                                                             │
│ /admin/workspace/users                                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 👥 USUARIOS DEL GAD                                │    │
│ │                                                     │    │
│ │ ┌────┬──────────┬────────────┬──────────┬────────┐ │    │
│ │ │ #  │ Nombre   │ Email       │ Rol      │ Estado │ │    │
│ │ ├────┼──────────┼────────────┼──────────┼────────┤ │    │
│ │ │ 1  │ Juan P.  │ juan@...   │ Admin    │ 🟢     │ │    │
│ │ │ 2  │ Maria G. │ maria@...  │ Respons. │ 🟢     │ │    │
│ │ │ 3  │ Pedro L. │ pedro@...  │ Ciud.    │ 🟢     │ │    │
│ │ │ 4  │ Ana R.   │ ana@...    │ Respons. │ 🔴     │ │    │
│ │ └────┴──────────┴────────────┴──────────┴────────┘ │    │
│ │                                                     │    │
│ │ [➕ Agregar Usuario]                                 │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ Click en "Agregar" / Editar / Eliminar → Modal             │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ MODAL: DATOS DEL USUARIO                             │   │
│ │                                                      │   │
│ │ Nombre:     [________________________]               │   │
│ │ Email:      [________________________]               │   │
│ │ Contrasena: [________________________]               │   │
│ │ Rol:        [📌 Administrador ▼]                     │   │
│ │                                                      │   │
│ │ [❌ Cancelar]          [✅ Guardar]                  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ── CONFIGURACION ────────────────────────────────────────  │
│                                                             │
│ /admin/workspace/wkconfig                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ ⚙️ CONFIGURACION DEL GAD                           │    │
│ │                                                     │    │
│ │ Publicacion automatica:                             │    │
│ │ [🟢 Activado] ○ Automatico  ○ Manual               │    │
│ │                                                     │    │
│ │ Reporte predeterminado: [Seleccionar...]            │    │
│ │                                                     │    │
│ │ [➕ Nuevo Reporte]                                   │    │
│ │                                                     │    │
│ │ [💾 Guardar Configuracion]                          │    │
│ └─────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ⭐ ACCION EXCLUSIVA DEL ADMIN: CALIFICAR EVIDENCIAS        │
│                                                             │
│ Desde el detalle del subindicador → Evidencia existente:    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📎 EVIDENCIA: "Documento soporte.pdf"               │    │
│ │                                                     │    │
│ │ • Subido por: [Responsable]                         │    │
│ │ • Fecha: 01/06/2023                                 │    │
│ │ • Link: https://firebase.../documento.pdf           │    │
│ │ • Verificado: ✅                                    │    │
│ │ • Calificacion actual: ⚪ (sin calificar)            │    │
│ │                                                     │    │
│ │ ┌─────────────────────────────────────────────────┐ │    │
│ │ │ ⭐ CALIFICAR EVIDENCIA (SOLO ADMIN)             │ │    │
│ │ │                                                 │ │    │
│ │ │ RUBRICA — Seleccione valor para cada criterio:  │ │    │
│ │ │                                                 │ │    │
│ │ │ Requisitos:                                     │ │    │
│ │ │   □ Paginas resaltadas y especificadas (0-1)    │ │    │
│ │ │   □ Nombres de responsabilidad (0-1)           │ │    │
│ │ │   □ Firmas de responsabilidad (0-1)            │ │    │
│ │ │   □ Sellos de responsabilidad (0-1)            │ │    │
│ │ │   □ Logos institucionales (0-1)                │ │    │
│ │ │                                                 │ │    │
│ │ │ Calidad:                                        │ │    │
│ │ │   □ Competencias laborales (0-1)               │ │    │
│ │ │   □ Competencias blandas (0-1)                 │ │    │
│ │ │   □ Descripcion del contexto (0-1)             │ │    │
│ │ │   □ ... (hasta 14 criterios)                   │ │    │
│ │ │                                                 │ │    │
│ │ │ Commits/Observaciones:                          │ │    │
│ │ │   [_____________________________]               │ │    │
│ │ │                                                 │ │    │
│ │ │ [💾 Guardar Calificacion]                       │ │    │
│ │ └─────────────────────────────────────────────────┘ │    │
│ │                                                     │    │
│ │ → Al guardar, el sistema RECALCULA automaticamente: │    │
│ │   1. Calificacion del subindicador                 │    │
│ │   2. Calificacion del indicador                    │    │
│ │   3. Genera notificacion                          │    │
│ └─────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

# 5. Mapa Detallado de un Indicador

Esta es la vista mas importante del sistema. Cada indicador ISO 18091 se organiza internamente asi:

```
╔══════════════════════════════════════════════════════════════════╗
║            INDICADOR X.Y — "Nombre del Indicador"               ║
║            Cuadrante X | Calificacion: 🟡                       ║
╚══════════════════════════════════════════════════════════════════╝

                            │
          ┌─────────────────┴──────────────────┐
          │         BARRA DE PESTAÑAS           │
          │                                      │
          │ ┌────────┬────────┬────────┬────────┐│
          │ │ Resumen│Instancia│Diagnost│Mecanismo│
          │ │ 🔵     │ 🟢      │ 🟡     │ 🟠      │
          │ ├────────┼────────┼────────┼────────┤│
          │ │Mecanism│ Especif.│        │        │
          │ │ 🔴     │ 🟣      │        │        │
          │ └────────┴────────┴────────┴────────┘│
          └──────────────────┬───────────────────┘
                             │
          ┌──────────────────┴───────────────────┐
          │                                      │
          ▼                                      ▼

┌──────────────────────────────┐    ┌──────────────────────────────┐
│ PESTAÑA: RESUMEN             │    │ PESTAÑA: TIPO (Instancia     │
│                              │    │          Responsable, etc.)   │
│ 🔵 VISION GENERAL            │    │                              │
│                              │    │ 🟢 SUBINDICADOR GENERAL      │
│ ┌───────────────────────┐    │    │                              │
│ │ 📊 CALIFICACION       │    │    │ ┌────────────────────────┐   │
│ │                       │    │    │ │ ℹ️ Info del estado     │   │
│ │     🟡               │    │    │ │ • Responsable: ...    │   │
│ │    2.0               │    │    │ │ • Calificacion: 🟡    │   │
│ │   Amarillo           │    │    │ │ • Evidencias: N       │   │
│ └───────────────────────┘    │    │ └────────────────────────┘   │
│                              │    │                              │
│ ┌───────────────────────┐    │    │ ┌────────────────────────┐   │
│ │ 🗂️ EVIDENCIAS: 12    │    │    │ │ 📜 Historial           │   │
│ └───────────────────────┘    │    │ │ • Fecha → 🟡           │   │
│                              │    │ │ • Fecha → 🔴           │   │
│ ┌───────────────────────┐    │    │ └────────────────────────┘   │
│ │ 📅 Ultima actualiz.:  │    │    │                              │
│ │    01/06/2023         │    │    │ ┌────────────────────────┐   │
│ └───────────────────────┘    │    │ │ [➕ Agregar Evidencias] │   │
│                              │    │ └────────────────────────┘   │
│ ┌───────────────────────┐    │    │                              │
│ │ 📋 SUb. GENERALES     │    │    │ Click en "Agregar            │
│ │ ┌─────────┬─────┬───┐  │    │    │ Evidencias"                 │
│ │ │Tipo     │Calif│Evi│  │    │    │                              │
│ │ ├─────────┼─────┼───┤  │    │    ▼                              │
│ │ │Inst.Resp│ 🟡  │ 3 │  │    │ ┌────────────────────────────┐   │
│ │ │Diagnost │ 🟡  │ 2 │  │    │ │ ASISTENTE DE EVIDENCIAS    │   │
│ │ │Mecan.Nor│ 🔴  │ 1 │  │    │ │ (ver seccion 6)            │   │
│ │ │Mec.Op.  │ 🟡  │ 3 │  │    │ └────────────────────────────┘   │
│ │ └─────────┴─────┴───┘  │    │                              │
│ └───────────────────────┘    │    ── O PC: ────────────────────  │
│                              │    │
│ ┌───────────────────────┐    │    PESTAÑA: SUBIND. ESPECIFICOS  │
│ │ 🟣 SUB. ESPECIFICOS  │    │                              │
│ │ • Sub. 1 — 🟡        │    │    🟣 LISTA DE ESPECIFICOS      │
│ │ • Sub. 2 — 🔴        │    │                              │
│ │ • Sub. 3 — ⚪        │    │    ┌────────────────────────┐   │
│ └───────────────────────┘    │    │ Tabla de subindicadores│   │
│                              │    │ [➕ Agregar Sub.]      │   │
│                              │    │ Click en fila →       │   │
│                              │    │ → Detalle especifico  │   │
│                              │    └────────────────────────┘   │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

# 6. Asistente de Evidencias (2 pasos)

Se accede desde el boton **"Agregar Evidencias"** dentro de cualquier subindicador.

```
PASO 1: "REGISTRAR EVIDENCIAS"
────────────────────────────────────────────────────────────

Por cada caracteristica del tipo de subindicador, se muestra:

┌─────────────────────────────────────────────────────────┐
│ 📋 CARACTERISTICA 1: "Posee nombres de responsabilidad" │
│                                                          │
│    ○ Subir archivo    ● Pegar enlace                    │
│                                                          │
│    Link: [https://drive.google.com/...________________] │
│                                                          │
│    Observaciones: [________________________________]     │
│                                                          │
│    Formato permitido: PDF, JPG, PNG                     │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ 📋 CARACTERISTICA 2: "Posee firmas de responsabilidad"   │
│                                                          │
│    ● Subir archivo    ○ Pegar enlace                    │
│                                                          │
│    Archivo: [📎 Seleccionar archivo] (PDF, JPG, PNG)    │
│                                                          │
│    Observaciones: [________________________________]     │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ 📋 CARACTERISTICA 3: ...                                 │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           [◀ Volver]    [Continuar ▶]               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Click en "Continuar"
                           ▼

PASO 2: "CUADRO RESUMEN"
────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│ ✅ RESUMEN DE EVIDENCIAS A GUARDAR                      │
│                                                          │
│ Indicador: X.Y — Nombre del Indicador                   │
│ Subindicador: Instancia Responsable                     │
│                                                          │
│ ┌──────┬────────────────────────────────┬────────────┐  │
│ │ #    │ Caracteristica                  │ Evidencia  │  │
│ ├──────┼────────────────────────────────┼────────────┤  │
│ │ 1    │ Posesion de nombres de resp.   │ 🔗 Link    │  │
│ │ 2    │ Firmas de responsabilidad      │ 📄 archivo │  │
│ │ 3    │ Sellos de responsabilidad      │ 🔗 Link    │  │
│ │ 4    │ Logos institucionales          │ 📄 archivo │  │
│ │ ...  │ ...                            │ ...        │  │
│ └──────┴────────────────────────────────┴────────────┘  │
│                                                          │
│ Total de evidencias a guardar: 6                         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           [◀ Volver]    [✅ Guardar]                │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Click en "Guardar"
                           ▼
          ┌──────────────────────────────────────┐
          │ ✅ EVIDENCIAS GUARDADAS EXITOSAMENTE │
          │                                      │
          │ • Se actualizo el subindicador       │
          │ • Se genero notificacion al Admin    │
          │ • A la espera de calificacion        │
          │                                      │
          │           [Volver al Indicador]      │
          └──────────────────────────────────────┘
```

---

# 7. Asistente de Subindicador Especifico (3 pasos)

Se accede desde la pestana **"Subindicadores Especificos"** → boton **"Agregar Subindicador"**.

```
PASO 1: "DATOS DEL SUBINDICADOR"
────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│ 📝 NUEVO SUBINDICADOR ESPECIFICO                        │
│                                                          │
│    Indicador: X.Y — Nombre del Indicador                │
│                                                          │
│    Nombre del subindicador:                             │
│    [______________________________________________]     │
│                                                          │
│    Responsable:                                         │
│    [______________________________________________]     │
│                                                          │
│    ¿Requiere portada?                                    │
│    [📎 Seleccionar archivo] (PDF)                       │
│                                                          │
│    Observaciones de portada:                             │
│    [______________________________________________]     │
│                                                          │
│    ¿Esta planificado?   [✅ Si]  [○ No]                │
│    ¿Esta diagnosticado? [✅ Si]  [○ No]                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           [❌ Cancelar]    [Continuar ▶]            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼

PASO 2: "EVIDENCIAS"
────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│ 📎 EVIDENCIAS DEL SUBINDICADOR                          │
│                                                          │
│ (Mismo formulario que el asistente de evidencias        │
│  de 2 pasos — Seccion 6)                                │
│                                                          │
│ Por cada caracteristica del tipo seleccionado:           │
│   - Subir archivo o pegar enlace                        │
│   - Agregar observaciones                               │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           [◀ Volver]    [Continuar ▶]               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼

PASO 3: "CONFIRMAR"
────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│ ✅ CONFIRMAR CREACION DEL SUBINDICADOR                  │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📋 DATOS DEL SUBINDICADOR                           │ │
│ │                                                     │ │
│ │ Nombre: Programa de capacitacion municipal          │ │
│ │ Responsable: Direccion de Talento Humano            │ │
│ │ Portada: capacitacion.pdf                           │ │
│ │ Planificado: ✅ Si  |  Diagnosticado: ✅ Si        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📎 EVIDENCIAS ASOCIADAS                             │ │
│ │                                                     │ │
│ │ • Evidencia 1: documento.pdf                        │ │
│ │ • Evidencia 2: https://...                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │           [◀ Volver]    [✅ Crear Subindicador]     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌──────────────────────────────────────┐
          │ ✅ SUBINDICADOR CREADO EXITOSAMENTE  │
          │                                      │
          │ • Se agrego a la lista de especificos│
          │ • Se vincularon las evidencias       │
          │ • Se genero notificacion al Admin    │
          │                                      │
          │       [Volver a Subindicadores]      │
          └──────────────────────────────────────┘
```

---

# 8. Diagrama de Decision por Rol

```
                    ┌─────────────────────────┐
                    │   LLEGA A LA PAGINA     │
                    │   (https://...)         │
                    └───────────┬─────────────┘
                                │
                         ┌──────▼──────┐
                         │ Tiene una   │
                         │  cuenta?    │
                         └──┬──────┬───┘
                            │      │
                          NO│      │SI
                            │      │
              ┌─────────────┘      └──────────────┐
              │                                   │
     ┌────────▼────────┐                 ┌───────▼────────┐
     │ VISTA CIUDADANO │                 │  INICIA SESION │
     │    /user        │                 │  /login/signIn │
     │                 │                 └───────┬────────┘
     │ • Landing      │                         │
     │ • Cuadrantes   │                    ┌─────▼──────┐
     │ • Semaforos    │              ┌─────┤ Rol?       ├──────┐
     │ • Subindicadores│             │     └────┬───────┘      │
     │ • Evidencias   │             │          │              │
     └────────────────┘    ┌────────▼──┐ ┌────▼──────┐  ┌───┴───────┐
                           │CIUDADANO  │ │RESPONSABLE│  │ADMINISTR. │
                           │(No existe)│ └─────┬─────┘  └───┬───────┘
                           └───────────┘       │            │
                                      ┌────────▼────┐ ┌────▼─────────┐
                                      │  VISTA ADMIN │ │  VISTA ADMIN │
                                      │   /admin     │ │   /admin     │
                                      │              │ │              │
                                      │• Dashboard   │ │• Dashboard   │
                                      │• Cuadrantes  │ │• Cuadrantes  │
                                      │  y semaforos │ │  y semaforos │
                                      │• Indicadores │ │• Indicadores │
                                      │• Cargar evis │ │• Cargar evis │
                                      │• Crear subis │ │• Crear subis │
                                      │• Notificac.  │ │• Notificac.  │
                                      │              │ │• CALIFICAR   │
                                      │              │ │• USUARIOS    │
                                      │              │ │• CONFIGURAR  │
                                      └──────────────┘ └──────────────┘

══════════════════════════════════════════════════════════════════
          RESUMEN: QUE PUEDE HACER CADA ROL?
══════════════════════════════════════════════════════════════════

┌────────────────────────────────────┬──────────┬──────────┬──────────┐
│ ACCION                             │CIUDADANO │RESPONSAB.│ADMINIST. │
├────────────────────────────────────┼──────────┼──────────┼──────────┤
│ Ver landing y cuadrantes           │    ✅    │    ✅    │    ✅    │
│ Ver semaforo de indicadores        │    ✅    │    ✅    │    ✅    │
│ Ver detalle de subindicadores      │    ✅    │    ✅    │    ✅    │
│ Ver evidencias (PDF, links)        │    ✅    │    ✅    │    ✅    │
│ Iniciar sesion                     │    ❌    │    ✅    │    ✅    │
│ Ver dashboard con graficos         │    ❌    │    ✅    │    ✅    │
│ Agregar evidencias                 │    ❌    │    ✅    │    ✅    │
│ Crear subindicadores especificos   │    ❌    │    ✅    │    ✅    │
│ Eliminar subindicadores            │    ❌    │    ❌    │    ✅    │
│ Calificar evidencias (rubrica)     │    ❌    │    ❌    │    ✅    │
│ Gestionar usuarios (CRUD)          │    ❌    │    ❌    │    ✅    │
│ Configurar publicacion             │    ❌    │    ❌    │    ✅    │
│ Gestionar reportes                 │    ❌    │    ❌    │    ✅    │
│ Recibir notificaciones             │    ❌    │    ✅    │    ✅    │
└────────────────────────────────────┴──────────┴──────────┴──────────┘
```

---

## Tabla de Rutas Completa

| Ruta | Modulo | Guard | Roles | Descripcion |
|------|--------|:-----:|:-----:|-------------|
| `/` | — | — | Todos | Redirige a `/user` |
| `/login/signIn` | LoginModule | ❌ | Todos | Formulario de inicio de sesion |
| `/user/home` | GeneralUserModule | ❌ | Todos | Landing page publica |
| `/user/quadrant/:id` | GeneralUserModule | ❌ | Todos | Resumen de cuadrante + semaforo |
| `/user/quadrant/:id/indicator/:n/:instId` | GeneralUserModule | ❌ | Todos | Detalle de indicador (general + especificos) |
| `/user/quadrant/:id/indicator/:n/:instId/:subId` | GeneralUserModule | ❌ | Todos | Detalle de subindicador con evidencias |
| `/admin/home` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Dashboard con graficos |
| `/admin/quadrant/:id` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Semaforo del cuadrante |
| `/admin/quadrant/:q/indicator/:n/:id` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Detalle del indicador con pestanas |
| `/admin/quadrant/:q/indicator/:n/:id/Resumen` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Resumen del indicador |
| `/admin/.../[Tipo]/add-evidence` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Asistente de evidencias (2 pasos) |
| `/admin/.../Subindicadores-Especificos` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Lista de especificos |
| `/admin/.../add-subindicator` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Asistente de subindicador (3 pasos) |
| `/admin/workspace/users` | AdminHomeModule | ✅ AuthGuard | **Solo Admin** | CRUD de usuarios |
| `/admin/workspace/wkconfig` | AdminHomeModule | ✅ AuthGuard | **Solo Admin** | Configuracion del GAD |
| `/admin/notifications` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Lista de notificaciones |
| `/admin/config` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Cambio de contrasena |
| `/admin/help` | AdminHomeModule | ✅ AuthGuard | Resp + Admin | Enlaces de ayuda |

---

*Documento generado a partir del analisis del codigo fuente (Angular + Express). Junio 2026.*
