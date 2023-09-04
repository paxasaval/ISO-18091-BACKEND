
---
# Documentación de la API - ISO 18091 Backend

Bienvenido a la documentación de la API para el Backend de ISO 18091, una API basada en Node.js para la herramienta tecnológica basada en ISO 18091. Esta documentación proporciona una descripción general de los endpoints disponibles, parámetros de solicitud, formatos de respuesta y ejemplos de uso.

- **Repositorio:** [ISO-18091-BACKEND](https://github.com/paxasaval/ISO-18091-BACKEND)
- **URL Base de la API:** `https://iso-18091-backend-test-production.up.railway.app/api/`

# Autenticación
Antes de utilizar la API, debes autenticarte. Incluye el encabezado `Authorization` en tus solicitudes con una clave de API válida.

```plaintext
Authorization: Bearer TOKEN_SESSION
```


---
# Endpoint de Características

Este endpoint permite recuperar características de acuerdo a diferentes criterios.

- **Ruta:** `/characteristics`
- **Método:** `GET`
- **Descripción:** Este endpoint permite recuperar características basadas en los parámetros proporcionados.

# Parámetros de Solicitud

Los siguientes parámetros pueden ser proporcionados en la URL de la solicitud para filtrar las características:

- `type` (opcional): El ID del tipo de característica para filtrar las características por tipo.

# Ejemplos

# Obtener todas las Características

**Solicitud:**
```http
GET /api/characteristics
```

**Respuesta:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a0",
    "name": "Característica 1",
    "typeID": "1",
    "description": "Descripción de la Característica 1"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a1",
    "name": "Característica 2",
    "typeID": "2",
    "description": "Descripción de la Característica 2"
  },
  // ...
]
```

# Obtener Características por Tipo

**Solicitud:**
```http
GET /api/characteristics?type=1
```

**Respuesta:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a0",
    "name": "Característica 1",
    "typeID": "1",
    "description": "Descripción de la Característica 1"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a3",
    "name": "Característica 4",
    "typeID": "1",
    "description": "Descripción de la Característica 4"
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devolvieron las características solicitadas.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar las características.


---
# Crear Nueva Característica

Este endpoint permite crear una nueva característica con la información proporcionada en el cuerpo de la solicitud.

- **Ruta:** `/characteristics`
- **Método:** `POST`
- **Descripción:** Este endpoint permite crear una nueva característica con los detalles especificados en el cuerpo de la solicitud.

# Parámetros de Solicitud

El cuerpo de la solicitud debe incluir los siguientes campos:

- `name` (obligatorio): El nombre de la característica.
- `group`: El grupo al que pertenece la característica.
- `groupName`: El nombre del grupo al que pertenece la característica.
- `score`: La puntuación de la característica (opcional, valor predeterminado: 0).
- `help`: Información de ayuda para la característica (opcional).
- `isRequired`: Indica si la característica es obligatoria (opcional, valor predeterminado: true).
- `required`: Indica si la característica es requerida (opcional, valor predeterminado: true).
- `tier`: El nivel de la característica.
- `unique`: Indica si la característica es única (opcional, valor predeterminado: false).
- `parts`: Lista de partes de la característica (opcional).
- `allowed_formats`: Formatos permitidos para la característica.

# Ejemplo

**Solicitud:**
```http
POST /api/characteristics
Authorization: Bearer TU_CLAVE_DE_API

{
  "name": "Característica Nueva",
  "group": "Grupo A",
  "groupName": "Grupo A Nombre",
  "score": 10,
  "help": "Información de ayuda para la característica nueva",
  "isRequired": true,
  "required": true,
  "tier": "Nivel 2",
  "unique": true,
  "parts": ["Parte 1", "Parte 2"],
  "allowed_formats": ["Formato A", "Formato B"]
}
```

**Respuesta:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "name": "Característica Nueva",
  "group": "Grupo A",
  "groupName": "Grupo A Nombre",
  "score": 10,
  "help": "Información de ayuda para la característica nueva",
  "isRequired": true,
  "required": true,
  "tier": "Nivel 2",
  "unique": true,
  "parts": ["Parte 1", "Parte 2"],
  "allowed_formats": ["Formato A", "Formato B"]
}
```

# Códigos de Respuesta

- `200 OK`: La característica se creó con éxito y se devuelve la característica creada.
- `400 Bad Request`: La solicitud es incorrecta o faltan parámetros requeridos.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear la característica.



---
# Obtener Característica por ID

Este endpoint permite obtener información detallada de una característica según su ID.

- **Ruta:** `/characteristics/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener información detallada de una característica en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la característica que se desea recuperar.

# Ejemplo

**Solicitud:**
```http
GET /api/characteristics/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "name": "Característica Nueva",
  "group": "Grupo A",
  "groupName": "Grupo A Nombre",
  "score": 10,
  "help": "Información de ayuda para la característica nueva",
  "isRequired": true,
  "required": true,
  "tier": "Nivel 2",
  "unique": true,
  "parts": ["Parte 1", "Parte 2"],
  "allowed_formats": ["Formato A", "Formato B"]
}
```

**Respuesta de Error (404 - No Encontrado):**
```json
{
  "error": "La característica no fue encontrada."
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve la característica solicitada.
- `404 Not Found`: La característica con el ID proporcionado no fue encontrada.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar la característica.



---
# Eliminar Característica por ID

Este endpoint permite eliminar una característica según su ID.

- **Ruta:** `/characteristics/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint permite eliminar una característica en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la característica que se desea eliminar.

# Ejemplo

**Solicitud:**
```http
DELETE /api/characteristics/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TOKEN_SESSION
```

**Respuesta Exitosa (204 - Sin Contenido):**  
No se devuelve contenido en la respuesta.

# Códigos de Respuesta

- `204 No Content`: La característica fue eliminada con éxito.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar eliminar la característica.


---
# Actualizar Característica por ID

Este endpoint permite actualizar la información de una característica existente según su ID.

- **Ruta:** `/characteristics/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar los detalles de una característica basados en su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la característica que se desea actualizar.
- Campos en el cuerpo de la solicitud (al menos uno de los siguientes):
  - `name`: El nombre actualizado de la característica.
  - `group`: El grupo actualizado de la característica.
  - `groupName`: El nombre del grupo actualizado de la característica.
  - `required`: Indica si la característica es requerida.
  - `score`: La puntuación actualizada de la característica (opcional, valor predeterminado: 0).
  - `tier`: El nivel actualizado de la característica.
  - `isRequired`: Indica si la característica es obligatoria.
  - `unique`: Indica si la característica es única.

# Ejemplo

**Solicitud:**
```http
PUT /api/characteristics/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API

{
  "name": "Característica Actualizada",
  "group": "Nuevo Grupo",
  "groupName": "Nuevo Nombre de Grupo",
  "required": false,
  "score": 8,
  "tier": "Nivel 3",
  "isRequired": false,
  "unique": true
}
```

**Respuesta:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "name": "Característica Actualizada",
  "group": "Nuevo Grupo",
  "groupName": "Nuevo Nombre de Grupo",
  "required": false,
  "score": 8,
  "tier": "Nivel 3",
  "isRequired": false,
  "unique": true
}
```

# Códigos de Respuesta

- `200 OK`: La característica se actualizó con éxito y se devuelve la característica actualizada.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar la característica.



---
# Obtener Todos los Commits

Este endpoint permite obtener una lista de todos los commits.

- **Ruta:** `/commits`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener una lista de todos los commits registrados.

# Ejemplo

**Solicitud:**
```http
GET /api/commits
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a5",
    "message": "Primer commit",
    "author": "John Doe",
    "timestamp": "2023-08-01T10:00:00Z"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "message": "Segundo commit",
    "author": "Jane Smith",
    "timestamp": "2023-08-02T15:30:00Z"
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelven los commits registrados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener los commits.



---
# Obtener Commit por ID

Este endpoint permite obtener información detallada de un commit según su ID.

- **Ruta:** `/commits/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener información detallada de un commit en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del commit que se desea recuperar.

# Ejemplo

**Solicitud:**
```http
GET /api/commits/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "message": "Primer commit",
  "author": "John Doe",
  "timestamp": "2023-08-01T10:00:00Z"
}
```

**Respuesta de Error (404 - No Encontrado):**
```json
{
  "error": "El commit no fue encontrado."
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve el commit solicitado.
- `404 Not Found`: El commit con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar el commit.



---
# Eliminar Commit por ID

Este endpoint permite eliminar un commit según su ID.

- **Ruta:** `/commits/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint permite eliminar un commit en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del commit que se desea eliminar.

# Ejemplo

**Solicitud:**
```http
DELETE /api/commits/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa (204 - Sin Contenido):**  
No se devuelve contenido en la respuesta.

# Códigos de Respuesta

- `204 No Content`: El commit fue eliminado con éxito.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar eliminar el commit.

---
# Crear Nuevo Commit

Este endpoint permite crear un nuevo commit con la información proporcionada en el cuerpo de la solicitud.

- **Ruta:** `/commits`
- **Método:** `POST`
- **Descripción:** Este endpoint permite crear un nuevo commit con los detalles especificados en el cuerpo de la solicitud.

# Parámetros de Solicitud

El cuerpo de la solicitud debe incluir los siguientes campos:

- `body` (obligatorio): El cuerpo del commit.
- `autor` (obligatorio): El autor del commit.

# Ejemplo

**Solicitud:**
```http
POST /api/commits
Authorization: Bearer TU_CLAVE_DE_API

{
  "body": "Agregada nueva funcionalidad de autenticación",
  "autor": "John Doe"
}
```

**Respuesta:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "body": "Agregada nueva funcionalidad de autenticación",
  "autor": "John Doe",
  "created": "2023-08-01T10:00:00Z",
  "lastUpdate": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El commit se creó con éxito y se devuelve el commit creado.
- `400 Bad Request`: La solicitud es incorrecta o faltan parámetros requeridos.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear el commit.

---
# Actualizar Commit por ID

# Ruta
- **Ruta:** `/commits/:id`
- **Método:** `PUT`

# Descripción
Este endpoint permite actualizar la información de un commit existente según su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del commit que se desea actualizar.

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir al menos uno de los siguientes campos:

- `body`: El nuevo cuerpo del commit.
- `lastUpdate`: Fecha y hora de la última actualización del commit.

# Ejemplo de Solicitud

```http
PUT /api/commits/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API

{
  "body": "Commit actualizado con nueva información"
}
```

# Respuesta Exitosa

```json
{
  "_id": "5fd45b1d1c544c001f3a79a5",
  "body": "Commit actualizado con nueva información",
  "autor": "John Doe",
  "created": "2023-08-01T10:00:00Z",
  "lastUpdate": "2023-08-02T14:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El commit se actualizó con éxito y se devuelve el commit actualizado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar el commit.

---

# Obtener Todas las Evidencias

Este endpoint permite obtener una lista de todas las evidencias.

- **Ruta:** `/evidences`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener una lista de todas las evidencias registradas.

# Ejemplo

**Solicitud:**
```http
GET /api/evidences
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a5",
    "title": "Evidencia 1",
    "description": "Descripción de la Evidencia 1",
    "date": "2023-08-01T10:00:00Z",
    "author": "John Doe"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "title": "Evidencia 2",
    "description": "Descripción de la Evidencia 2",
    "date": "2023-08-02T15:30:00Z",
    "author": "Jane Smith"
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelven las evidencias registradas.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener las evidencias.

---

# Obtener Evidencias por ID de Subindicador

Este endpoint permite obtener evidencias relacionadas con un ID de subindicador específico.

- **Ruta:** `/evidences/subindicatorID/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener evidencias relacionadas con un subindicador específico, identificado por su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del subindicador para el cual se desean recuperar las evidencias.

# Ejemplo

**Solicitud:**
```http
GET /api/evidences/subindicatorID/5fd45b1d1c544c001f3a79a5
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "title": "Evidencia 2",
    "description": "Descripción de la Evidencia 2",
    "date": "2023-08-02T15:30:00Z",
    "author": {
      "_id": "5fd45b1d1c544c001f3a79a7",
      "name": "John Doe"
    },
    "commits": [
      {
        "_id": "5fd45b1d1c544c001f3a79a8",
        "body": "Commit relacionado con la Evidencia 2",
        "author": {
          "_id": "5fd45b1d1c544c001f3a79a9",
          "name": "Jane Smith"
        },
        "created": "2023-08-02T15:45:00Z",
        "lastUpdate": "2023-08-02T15:45:00Z"
      }
    ]
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelven las evidencias relacionadas con el subindicador especificado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener las evidencias.

---

# Obtener Evidencia por ID

Este endpoint permite obtener información detallada de una evidencia según su ID.

- **Ruta:** `/evidences/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener información detallada de una evidencia en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la evidencia que se desea recuperar.

# Ejemplo

**Solicitud:**
```http
GET /api/evidences/5fd45b1d1c544c001f3a79a6
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "title": "Evidencia 2",
  "description": "Descripción de la Evidencia 2",
  "date": "2023-08-02T15:30:00Z",
  "author": {
    "_id": "5fd45b1d1c544c001f3a79a7",
    "name": "John Doe"
  },
  "characteristicID": {
    "_id": "5fd45b1d1c544c001f3a79aa",
    "name": "Característica 1"
  },
  "subIndicatorID": {
    "_id": "5fd45b1d1c544c001f3a79ab",
    "name": "Subindicador A"
  },
  "commits": [
    {
      "_id": "5fd45b1d1c544c001f3a79a8",
      "body": "Commit relacionado con la Evidencia 2",
      "author": {
        "_id": "5fd45b1d1c544c001f3a79a9",
        "name": "Jane Smith"
      },
      "created": "2023-08-02T15:45:00Z",
      "lastUpdate": "2023-08-02T15:45:00Z"
    }
  ]
}
```

**Respuesta de Error (404 - No Encontrado):**
```json
{
  "error": "La evidencia no fue encontrada."
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve la evidencia solicitada.
- `404 Not Found`: La evidencia con el ID proporcionado no fue encontrada.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar la evidencia.

Aquí está la documentación para el endpoint que elimina una evidencia según su ID y realiza algunas operaciones adicionales:

---

# Eliminar Evidencia por ID

Este endpoint permite eliminar una evidencia según su ID y realiza algunas operaciones adicionales en los subindicadores e indicadores relacionados.

- **Ruta:** `/evidences/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint permite eliminar una evidencia en función de su ID y realizar ajustes relacionados en subindicadores e indicadores.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la evidencia que se desea eliminar.

# Ejemplo

**Solicitud:**
```http
DELETE /api/evidences/5fd45b1d1c544c001f3a79a6
Authorization: Bearer TU_CLAVE_DE_API
```

**Respuesta Exitosa:**
```json
{
  "message": "Evidencia eliminada con éxito"
}
```

# Códigos de Respuesta

- `200 OK`: La evidencia se eliminó con éxito y se realizan ajustes relacionados en los subindicadores e indicadores.
- `401 Unauthorized`: La solicitud no está autorizada debido a un token inválido o un rol no autorizado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar eliminar la evidencia y realizar ajustes relacionados.


---

# Crear Nueva Evidencia

Este endpoint permite crear una nueva evidencia y realizar operaciones relacionadas en subindicadores.

- **Ruta:** `/evidences`
- **Método:** `POST`
- **Descripción:** Este endpoint permite crear una nueva evidencia y realizar operaciones relacionadas en subindicadores.

# Parámetros de Solicitud

El cuerpo de la solicitud debe incluir los siguientes campos:

- `characteristicID` (obligatorio): El ID de la característica asociada a la evidencia.
- `subIndicatorID` (obligatorio): El ID del subindicador asociado a la evidencia.
- `name` (obligatorio): El nombre de la evidencia.
- `link`: El enlace de la evidencia (opcional).
- `note`: Nota adicional sobre la evidencia (opcional).
- `content`: Contenido de la evidencia (opcional).
- `verified`: Indica si la evidencia está verificada (opcional, valor predeterminado: `false`).
- `qualification`: Calificación de la evidencia (opcional, valor predeterminado: `0`).

# Ejemplo

**Solicitud:**
```http
POST /api/evidences
Authorization: Bearer TU_CLAVE_DE_API

{
  "characteristicID": "5fd45b1d1c544c001f3a79aa",
  "subIndicatorID": "5fd45b1d1c544c001f3a79ab",
  "name": "Evidencia de Prueba",
  "link": "https://www.evidencia.com",
  "note": "Esta es una nota de prueba",
  "content": ["Archivo1.pdf", "Imagen.png"],
  "verified": true,
  "qualification": 4
}
```

**Respuesta:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "characteristicID": "5fd45b1d1c544c001f3a79aa",
  "subIndicatorID": "5fd45b1d1c544c001f3a79ab",
  "name": "Evidencia de Prueba",
  "link": "https://www.evidencia.com",
  "note": "Esta es una nota de prueba",
  "content": ["Archivo1.pdf", "Imagen.png"],
  "state": true,
  "verified": true,
  "qualification": 4,
  "author": "5fd45b1d1c544c001f3a79a7",
  "commits": [],
  "createdAt": "2023-08-01T10:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La evidencia se creó con éxito y se realizaron operaciones relacionadas en subindicadores.
- `400 Bad Request`: La solicitud es incorrecta o faltan parámetros requeridos.
- `401 Unauthorized`: La solicitud no está autorizada debido a un token inválido o un rol no autorizado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear la evidencia y realizar operaciones relacionadas.

**Nota:** 
Esta documentación refleja las operaciones relacionadas en subindicadores que se realizan al crear una nueva evidencia. 

---

# Calificar Evidencia por ID

Este endpoint permite calificar una evidencia según su ID y realiza operaciones relacionadas en subindicadores.

- **Ruta:** `/evidences/qualify/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite calificar una evidencia y realizar operaciones relacionadas en subindicadores.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la evidencia que se desea calificar.

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `qualification` (obligatorio): La nueva calificación para la evidencia.
- `commit`: El mensaje de commit relacionado con la calificación (opcional).

# Ejemplo

**Solicitud:**
```http
PUT /api/evidences/qualify/5fd45b1d1c544c001f3a79a6
Authorization: Bearer TU_CLAVE_DE_API

{
  "qualification": 4,
  "commit": "Evidencia calificada con 4 estrellas"
}
```

**Respuesta:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "characteristicID": "5fd45b1d1c544c001f3a79aa",
  "subIndicatorID": "5fd45b1d1c544c001f3a79ab",
  "name": "Evidencia de Prueba",
  "link": "https://www.evidencia.com",
  "note": "Esta es una nota de prueba",
  "content": ["Archivo1.pdf", "Imagen.png"],
  "state": true,
  "verified": true,
  "qualification": 4,
  "author": "5fd45b1d1c544c001f3a79a7",
  "commits": [
    "5fd45b1d1c544c001f3a79a8"
  ],
  "createdAt": "2023-08-01T10:00:00Z",
  "updatedAt": "2023-08-02T12:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La evidencia se calificó con éxito y se realizaron operaciones relacionadas en subindicadores.
- `400 Bad Request`: La solicitud es incorrecta o faltan parámetros requeridos.
- `401 Unauthorized`: La solicitud no está autorizada debido a un token inválido o un rol no autorizado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar calificar la evidencia y realizar operaciones relacionadas.

---

# Actualizar Evidencia por ID

Este endpoint permite actualizar la información de una evidencia existente según su ID.

- **Ruta:** `/evidences/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar la información de una evidencia en función de su ID.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único de la evidencia que se desea actualizar.

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `name`: El nuevo nombre de la evidencia.
- `characteristicID`: El nuevo ID de la característica asociada a la evidencia.
- `subIndicatorID`: El nuevo ID del subindicador asociado a la evidencia.
- `link`: El nuevo enlace de la evidencia.
- `verified`: Indica si la evidencia está verificada (opcional, valor predeterminado: `false`).
- `note`: La nueva nota adicional sobre la evidencia.
- `commits`: La nueva lista de commits relacionados con la evidencia.

# Ejemplo

**Solicitud:**
```http
PUT /api/evidences/5fd45b1d1c544c001f3a79a6
Authorization: Bearer TU_CLAVE_DE_API

{
  "name": "Nueva Evidencia",
  "characteristicID": "5fd45b1d1c544c001f3a79aa",
  "subIndicatorID": "5fd45b1d1c544c001f3a79ab",
  "link": "https://www.nueva-evidencia.com",
  "verified": true,
  "note": "Nueva nota sobre la evidencia",
  "commits": ["5fd45b1d1c544c001f3a79a8"]
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "characteristicID": "5fd45b1d1c544c001f3a79aa",
  "subIndicatorID": "5fd45b1d1c544c001f3a79ab",
  "name": "Nueva Evidencia",
  "link": "https://www.nueva-evidencia.com",
  "verified": true,
  "note": "Nueva nota sobre la evidencia",
  "commits": ["5fd45b1d1c544c001f3a79a8"],
  "createdAt": "2023-08-01T10:00:00Z",
  "updatedAt": "2023-08-02T14:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La evidencia se actualizó con éxito y se devuelve la evidencia actualizada.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar la evidencia.

---

# Obtener GADs

Este endpoint permite obtener la lista de Gobiernos Autónomos Descentralizados (GADs) disponibles.

- **Ruta:** `/gad`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener la lista de Gobiernos Autónomos Descentralizados (GADs) disponibles.

# Parámetros de Solicitud

Ninguno.

# Ejemplo

**Solicitud:**
```http
GET /api/gad
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "name": "GAD A",
    "location": "Lugar A",
    "description": "Descripción del GAD A"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a7",
    "name": "GAD B",
    "location": "Lugar B",
    "description": "Descripción del GAD B"
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelven los GADs disponibles.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener los GADs.

---

# Obtener Mi Espacio de Trabajo (GAD)

Este endpoint permite obtener el espacio de trabajo (GAD) asociado a un ID de Gobiernos Autónomos Descentralizados (GAD) específico.

- **Ruta:** `/gad/myWorkspace`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener el espacio de trabajo (GAD) asociado a un Gobiernos Autónomos Descentralizados (GAD) específico.

# Parámetros de Solicitud

- Encabezado `tenant` (obligatorio): El ID único del GAD del que se desea obtener el espacio de trabajo.

# Ejemplo

**Solicitud:**
```http
GET /api/gad/myWorkspace
tenant: 5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD A",
  "location": "Lugar A",
  "description": "Descripción del GAD A",
  "workspace": {
    "name": "Espacio de Trabajo A",
    "description": "Descripción del Espacio de Trabajo A"
  }
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve el espacio de trabajo asociado al GAD especificado.
- `400 Bad Request`: La solicitud es incorrecta o falta el encabezado `tenant`.
- `404 Not Found`: El GAD con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener el espacio de trabajo.

---

# Obtener Informe Predeterminado de GAD

Este endpoint permite obtener el informe predeterminado asociado a un Gobiernos Autónomos Descentralizados (GAD) específico.

- **Ruta:** `/gad/reportDefault`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener el informe predeterminado asociado a un Gobiernos Autónomos Descentralizados (GAD) específico.

# Parámetros de Solicitud

- Encabezado `tenant` (obligatorio): El ID único del GAD del que se desea obtener el informe predeterminado.

# Ejemplo

**Solicitud:**
```http
GET /api/gad/reportDefault
tenant: 5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b0",
  "title": "Informe Predeterminado",
  "content": "Contenido del informe predeterminado",
  "createdAt": "2023-08-01T10:00:00Z",
  "updatedAt": "2023-08-02T14:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve el informe predeterminado asociado al GAD especificado.
- `400 Bad Request`: La solicitud es incorrecta o falta el encabezado `tenant`.
- `404 Not Found`: El GAD con el ID proporcionado no fue encontrado o no tiene un informe predeterminado asociado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener el informe predeterminado.

---

# Obtener Informes de GAD

Este endpoint permite obtener la lista de informes asociados a un Gobiernos Autónomos Descentralizados (GAD) específico.

- **Ruta:** `/gad/reports`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener la lista de informes asociados a un Gobiernos Autónomos Descentralizados (GAD) específico.

# Parámetros de Solicitud

- Encabezado `tenant` (obligatorio): El ID único del GAD del que se desean obtener los informes.

# Ejemplo

**Solicitud:**
```http
GET /api/gad/reports
tenant: 5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79b1",
    "title": "Informe 1",
    "content": "Contenido del informe 1",
    "createdAt": "2023-08-01T10:00:00Z",
    "updatedAt": "2023-08-02T14:30:00Z"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79b2",
    "title": "Informe 2",
    "content": "Contenido del informe 2",
    "createdAt": "2023-08-02T09:00:00Z",
    "updatedAt": "2023-08-02T12:30:00Z"
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelven los informes asociados al GAD especificado.
- `400 Bad Request`: La solicitud es incorrecta o falta el encabezado `tenant`.
- `404 Not Found`: El GAD con el ID proporcionado no fue encontrado o no tiene informes asociados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener los informes.

---

# Obtener GAD por ID

Este endpoint permite obtener un Gobiernos Autónomos Descentralizados (GAD) por su ID único.

- **Ruta:** `/gad/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener un Gobiernos Autónomos Descentralizados (GAD) por su ID único.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del GAD que se desea obtener.

# Ejemplo

**Solicitud:**
```http
GET /api/gad/5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD A",
  "location": "Lugar A",
  "description": "Descripción del GAD A",
  "workspace": {
    "name": "Espacio de Trabajo A",
    "description": "Descripción del Espacio de Trabajo A"
  },
  "reportDefault": {
    "_id": "5fd45b1d1c544c001f3a79b0",
    "title": "Informe Predeterminado",
    "content": "Contenido del informe predeterminado",
    "createdAt": "2023-08-01T10:00:00Z",
    "updatedAt": "2023-08-02T14:30:00Z"
  },
  "reports": [
    {
      "_id": "5fd45b1d1c544c001f3a79b1",
      "title": "Informe 1",
      "content": "Contenido del informe 1",
      "createdAt": "2023-08-01T10:00:00Z",
      "updatedAt": "2023-08-02T14:30:00Z"
    },
    {
      "_id": "5fd45b1d1c544c001f3a79b2",
      "title": "Informe 2",
      "content": "Contenido del informe 2",
      "createdAt": "2023-08-02T09:00:00Z",
      "updatedAt": "2023-08-02T12:30:00Z"
    },
    // ...
  ],
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-02T16:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud fue exitosa y se devuelve el GAD especificado.
- `404 Not Found`: El GAD con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener el GAD.

---

# Crear Nuevo GAD

Este endpoint permite crear un nuevo Gobiernos Autónomos Descentralizados (GAD).

- **Ruta:** `/gad`
- **Método:** `POST`
- **Descripción:** Este endpoint permite crear un nuevo Gobiernos Autónomos Descentralizados (GAD).

# Parámetros de Solicitud

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `name` (obligatorio): El nombre del GAD.
- `code`: El código del GAD.
- `city`: La ciudad del GAD.
- `country`: El país del GAD.
- `size`: El tamaño del GAD (número).
- `staff`: Lista de miembros del personal del GAD.
- `users`: Lista de usuarios asociados al GAD.
- `state`: Indica si el GAD está activo (opcional, valor predeterminado: `true`).
- `publishAuto`: Indica si la publicación es automática (opcional, valor predeterminado: `true`).

# Ejemplo

**Solicitud:**
```http
POST /api/gad

{
  "name": "GAD Nuevo",
  "code": "GAD123",
  "city": "Ciudad Nueva",
  "country": "País Nuevo",
  "size": 500,
  "staff": ["Empleado 1", "Empleado 2"],
  "users": ["Usuario 1", "Usuario 2"],
  "state": true,
  "publishAuto": true
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD Nuevo",
  "code": "GAD123",
  "city": "Ciudad Nueva",
  "country": "País Nuevo",
  "size": 500,
  "staff": ["Empleado 1", "Empleado 2"],
  "users": ["Usuario 1", "Usuario 2"],
  "state": true,
  "publishAuto": true,
  "createdAt": "2023-08-01T10:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El GAD se creó con éxito y se devuelve el GAD creado.
- `400 Bad Request`: La solicitud es incorrecta o falta el campo obligatorio `name`.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear el GAD.

---

# Agregar Nuevo Informe a GAD

Este endpoint permite agregar un nuevo informe al conjunto de informes de un Gobiernos Autónomos Descentralizados (GAD).

- **Ruta:** `/gad/newReport`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite agregar un nuevo informe al conjunto de informes de un Gobiernos Autónomos Descentralizados (GAD).

# Parámetros de Solicitud

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `source` (obligatorio): La fuente del informe.
- `period`: El período al que corresponde el informe.
- `info`: Un array de información relacionada con el informe.

# Encabezado de Solicitud

- Encabezado `tenant` (obligatorio): El ID único del GAD al que se desea agregar el informe.

# Ejemplo

**Solicitud:**
```http
PUT /api/gad/newReport
tenant: 5fd45b1d1c544c001f3a79a6

{
  "source": "Fuente del Informe",
  "period": "2023 Q2",
  "info": [
    "Información 1",
    "Información 2"
  ]
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD A",
  "city": "Ciudad A",
  "country": "País A",
  "size": 1000,
  "staff": ["Empleado 1", "Empleado 2"],
  "users": ["Usuario 1", "Usuario 2"],
  "state": true,
  "report": [
    {
      "_id": "5fd45b1d1c544c001f3a79b1",
      "source": "Fuente del Informe",
      "period": "2023 Q2",
      "info": ["Información 1", "Información 2"],
      "createdAt": "2023-08-01T10:00:00Z",
      "updatedAt": "2023-08-01T10:00:00Z"
    }
  ],
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El informe se agregó con éxito al GAD y se devuelve el GAD actualizado.
- `400 Bad Request`: La solicitud es incorrecta o falta el campo obligatorio `source`.
- `401 Unauthorized`: El token es inválido o el rol del usuario no está autorizado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar agregar el informe al GAD.

---

# Actualizar Configuración de GAD

Este endpoint permite actualizar la configuración de un Gobiernos Autónomos Descentralizados (GAD), incluyendo el informe predeterminado y la opción de publicación automática.

- **Ruta:** `/gad/updateConfig`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar la configuración de un Gobiernos Autónomos Descentralizados (GAD), incluyendo el informe predeterminado y la opción de publicación automática.

# Parámetros de Solicitud

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `reportDefault` (obligatorio): El ID del informe predeterminado que se desea establecer para el GAD.
- `publishAuto`: Indica si la publicación automática está habilitada (opcional, valor predeterminado: `true`).

# Encabezado de Solicitud

- Encabezado `tenant` (obligatorio): El ID único del GAD cuya configuración se desea actualizar.

# Ejemplo

**Solicitud:**
```http
PUT /api/gad/updateConfig
tenant: 5fd45b1d1c544c001f3a79a6

{
  "reportDefault": "5fd45b1d1c544c001f3a79b1",
  "publishAuto": true
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD A",
  "city": "Ciudad A",
  "country": "País A",
  "size": 1000,
  "staff": ["Empleado 1", "Empleado 2"],
  "users": ["Usuario 1", "Usuario 2"],
  "state": true,
  "reportDefault": "5fd45b1d1c544c001f3a79b1",
  "publishAuto": true,
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-02T14:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: La configuración del GAD se actualizó con éxito y se devuelve el GAD actualizado.
- `400 Bad Request`: La solicitud es incorrecta o falta el campo obligatorio `reportDefault`.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar la configuración del GAD.

---

# Actualizar GAD por ID

Este endpoint permite actualizar los detalles de un Gobiernos Autónomos Descentralizados (GAD) por su ID único.

- **Ruta:** `/gad/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar los detalles de un Gobiernos Autónomos Descentralizados (GAD) por su ID único.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del GAD que se desea actualizar.

**Cuerpo de la Solicitud:**
El cuerpo de la solicitud debe incluir los siguientes campos:

- `name`: El nombre del GAD.
- `code`: El código del GAD.
- `city`: La ciudad del GAD.
- `country`: El país del GAD.
- `size`: El tamaño del GAD (número).
- `staff`: Lista actualizada de miembros del personal del GAD.
- `users`: Lista actualizada de usuarios asociados al GAD.
- `state`: Indica si el GAD está activo.

# Ejemplo

**Solicitud:**
```http
PUT /api/gad/5fd45b1d1c544c001f3a79a6

{
  "name": "GAD Actualizado",
  "city": "Ciudad Nueva",
  "size": 800,
  "staff": ["Nuevo Empleado"],
  "state": false
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "GAD Actualizado",
  "city": "Ciudad Nueva",
  "country": "País A",
  "size": 800,
  "staff": ["Nuevo Empleado"],
  "users": ["Usuario 1", "Usuario 2"],
  "state": false,
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-02T14:30:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El GAD se actualizó con éxito y se devuelve el GAD actualizado.
- `404 Not Found`: El GAD con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar el GAD.

---

# Obtener Indicadores

Este endpoint permite obtener una lista de indicadores.

- **Ruta:** `/indicators`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener una lista de indicadores.

# Parámetros de Solicitud

**Parámetros de Consulta:**

- `quadrant`: Cuadrante del indicador (opcional).
- No se requieren parámetros si se desea obtener todos los indicadores.

# Ejemplos

**Solicitud (Obtener todos los indicadores):**
```http
GET /api/indicators
```

**Respuesta Exitosa (Obtener todos los indicadores):**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "name": "Indicador 1",
    "quadrant": 1,
    "number": 101,
    "ods": {
      "_id": "5fd45b1d1c544c001f3a79b1",
      "name": "ODS 1",
      "description": "Descripción del ODS 1"
    },
    "createdAt": "2023-08-01T08:00:00Z",
    "updatedAt": "2023-08-01T10:00:00Z"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79a7",
    "name": "Indicador 2",
    "quadrant": 2,
    "number": 201,
    "ods": {
      "_id": "5fd45b1d1c544c001f3a79b2",
      "name": "ODS 2",
      "description": "Descripción del ODS 2"
    },
    "createdAt": "2023-08-01T08:00:00Z",
    "updatedAt": "2023-08-01T10:00:00Z"
  }
  // ... más indicadores ...
]
```

**Solicitud (Obtener indicadores por cuadrante):**
```http
GET /api/indicators?quadrant=1
```

**Respuesta Exitosa (Obtener indicadores por cuadrante):**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a6",
    "name": "Indicador 1",
    "quadrant": 1,
    "number": 101,
    "ods": {
      "_id": "5fd45b1d1c544c001f3a79b1",
      "name": "ODS 1",
      "description": "Descripción del ODS 1"
    },
    "createdAt": "2023-08-01T08:00:00Z",
    "updatedAt": "2023-08-01T10:00:00Z"
  }
  // ... más indicadores del cuadrante 1 ...
]
```

# Códigos de Respuesta

- `200 OK`: Los indicadores se obtuvieron con éxito y se devuelven en la respuesta.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener los indicadores.

---

# Obtener Indicador por Cuadrante y Número

Este endpoint permite obtener un indicador específico basado en su cuadrante y número.

- **Ruta:** `/indicators/byQuadrantAndNumber`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener un indicador específico basado en su cuadrante y número.

# Parámetros de Solicitud

**Parámetros de Consulta:**

- `quadrant` (obligatorio): Cuadrante del indicador.
- `number` (obligatorio): Número del indicador en el cuadrante.

# Ejemplo

**Solicitud:**
```http
GET /api/indicators/byQuadrantAndNumber?quadrant=1&number=101
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "Indicador 1",
  "quadrant": 1,
  "number": 101,
  "ods": {
    "_id": "5fd45b1d1c544c001f3a79b1",
    "name": "ODS 1",
    "description": "Descripción del ODS 1"
  },
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El indicador se obtuvo con éxito y se devuelve en la respuesta.
- `404 Not Found`: El indicador solicitado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener el indicador.

---

# Obtener Indicador por ID

Este endpoint permite obtener un indicador específico basado en su ID único.

- **Ruta:** `/indicators/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener un indicador específico basado en su ID único.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del indicador que se desea obtener.

# Ejemplo

**Solicitud:**
```http
GET /api/indicators/5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a6",
  "name": "Indicador 1",
  "quadrant": 1,
  "number": 101,
  "ods": {
    "_id": "5fd45b1d1c544c001f3a79b1",
    "name": "ODS 1",
    "description": "Descripción del ODS 1"
  },
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El indicador se obtuvo con éxito y se devuelve en la respuesta.
- `404 Not Found`: El indicador con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener el indicador.

---

# Eliminar Indicador por ID

Este endpoint permite eliminar un indicador específico basado en su ID único.

- **Ruta:** `/indicators/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint permite eliminar un indicador específico basado en su ID único.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del indicador que se desea eliminar.

# Ejemplo

**Solicitud:**
```http
DELETE /api/indicators/5fd45b1d1c544c001f3a79a6
```

**Respuesta Exitosa:**
```
204 No Content
```

# Códigos de Respuesta

- `204 No Content`: El indicador se eliminó con éxito y no hay contenido en la respuesta.
- `404 Not Found`: El indicador con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar eliminar el indicador.

---

# Crear Nuevo Indicador

Este endpoint permite crear un nuevo indicador.

- **Ruta:** `/indicators`
- **Método:** `POST`
- **Descripción:** Este endpoint permite crear un nuevo indicador con la información proporcionada.

# Parámetros de Solicitud

**Cuerpo de la Solicitud (JSON):**

- `name` (obligatorio): Nombre del indicador.
- `description`: Descripción del indicador.
- `number` (obligatorio): Número del indicador.
- `quadrant` (obligatorio): Cuadrante del indicador.
- `quadrantName` (opcional): Nombre del cuadrante.
- `red`: Valor para la zona roja del indicador.
- `yellow`: Valor para la zona amarilla del indicador.
- `green`: Valor para la zona verde del indicador.
- `ods` (obligatorio): Arreglo de IDs de los ODS relacionados con el indicador.

# Ejemplo

**Solicitud:**
```http
POST /api/indicators
Content-Type: application/json

{
  "name": "Indicador Nuevo",
  "description": "Descripción del indicador nuevo",
  "number": 301,
  "quadrant": 3,
  "quadrantName": "Tercer Cuadrante",
  "red": 30,
  "yellow": 60,
  "green": 90,
  "ods": ["5fd45b1d1c544c001f3a79b1", "5fd45b1d1c544c001f3a79b2"]
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a8",
  "name": "Indicador Nuevo",
  "description": "Descripción del indicador nuevo",
  "number": 301,
  "quadrant": 3,
  "quadrantName": "Tercer Cuadrante",
  "red": 30,
  "yellow": 60,
  "green": 90,
  "ods": [
    "5fd45b1d1c544c001f3a79b1",
    "5fd45b1d1c544c001f3a79b2"
  ],
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-01T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El indicador se creó con éxito y se devuelve en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o el cuerpo de la solicitud está mal formado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear el indicador.

---

# Actualizar Indicador por ID

Este endpoint permite actualizar un indicador existente basado en su ID único.

- **Ruta:** `/indicators/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar un indicador existente con la información proporcionada.

# Parámetros de Solicitud

- `id` (obligatorio): El ID único del indicador que se desea actualizar.

**Cuerpo de la Solicitud (JSON):**

- `name` (obligatorio): Nombre del indicador.
- `description`: Descripción del indicador.
- `number` (obligatorio): Número del indicador.
- `quadrant` (obligatorio): Cuadrante del indicador.
- `quadrantName` (opcional): Nombre del cuadrante.
- `red`: Valor para la zona roja del indicador.
- `yellow`: Valor para la zona amarilla del indicador.
- `green`: Valor para la zona verde del indicador.
- `ods` (obligatorio): Arreglo de IDs de los ODS relacionados con el indicador.

# Ejemplo

**Solicitud:**
```http
PUT /api/indicators/5fd45b1d1c544c001f3a79a8
Content-Type: application/json

{
  "name": "Indicador Actualizado",
  "description": "Descripción actualizada del indicador",
  "number": 301,
  "quadrant": 3,
  "quadrantName": "Tercer Cuadrante",
  "red": 25,
  "yellow": 55,
  "green": 85,
  "ods": ["5fd45b1d1c544c001f3a79b3", "5fd45b1d1c544c001f3a79b4"]
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a8",
  "name": "Indicador Actualizado",
  "description": "Descripción actualizada del indicador",
  "number": 301,
  "quadrant": 3,
  "quadrantName": "Tercer Cuadrante",
  "red": 25,
  "yellow": 55,
  "green": 85,
  "ods": [
    "5fd45b1d1c544c001f3a79b3",
    "5fd45b1d1c544c001f3a79b4"
  ],
  "createdAt": "2023-08-01T08:00:00Z",
  "updatedAt": "2023-08-02T10:00:00Z"
}
```

# Códigos de Respuesta

- `200 OK`: El indicador se actualizó con éxito y se devuelve en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o el cuerpo de la solicitud está mal formado.
- `404 Not Found`: El indicador con el ID proporcionado no fue encontrado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar el indicador.

---

# Obtener Instancias de Indicadores

Este endpoint permite obtener las instancias de indicadores según los parámetros proporcionados.

- **Ruta:** `/indicatorInstances`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener las instancias de indicadores con la información solicitada.

# Parámetros de Solicitud

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenecen las instancias de indicadores.

**Parámetros de Consulta:**

- `period`: Año para filtrar las instancias de indicadores por período.
- `quadrant`: Cuadrante para filtrar las instancias de indicadores por cuadrante.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances?period=2023&quadrant=3
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79a9",
    "year": 2023,
    "gadID": {
      "_id": "5fd45b1d1c544c001f3a79a8",
      "name": "Mi GAD",
      // ...
    },
    "indicatorID": {
      "_id": "5fd45b1d1c544c001f3a79b5",
      "name": "Indicador Ejemplo",
      // ...
    },
    "subindicators": [
      {
        "_id": "5fd45b1d1c544c001f3a79c1",
        "name": "Subindicador 1",
        // ...
      },
      // ...
    ],
    // ...
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: Las instancias de indicadores se recuperaron con éxito y se devuelven en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o los parámetros de consulta están mal formados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar las instancias de indicadores.

---

# Obtener Instancia de Indicador por ID de Indicador y Período

Este endpoint permite obtener una instancia de indicador específica según el ID del indicador y el período proporcionados.

- **Ruta:** `/indicatorInstances/byIndicatorIDAndPeriod`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener una instancia de indicador específica con la información solicitada.

# Parámetros de Solicitud

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenecen las instancias de indicadores.

**Parámetros de Consulta:**

- `indicatorID` (obligatorio): ID único del indicador para filtrar la instancia.
- `period` (obligatorio): ID único del período para filtrar la instancia.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances/byIndicatorIDAndPeriod?indicatorID=5fd45b1d1c544c001f3a79b5&period=2023
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79a9",
  "year": 2023,
  "gadID": {
    "_id": "5fd45b1d1c544c001f3a79a8",
    "name": "Mi GAD",
    // ...
  },
  "indicatorID": {
    "_id": "5fd45b1d1c544c001f3a79b5",
    "name": "Indicador Ejemplo",
    // ...
  },
  "subindicators": [
    {
      "_id": "5fd45b1d1c544c001f3a79c1",
      "name": "Subindicador 1",
      // ...
    },
    // ...
  ],
  // ...
}
```

# Códigos de Respuesta

- `200 OK`: La instancia de indicador se recuperó con éxito y se devuelve en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o los parámetros de consulta están mal formados.
- `404 Not Found`: La instancia de indicador con el ID del indicador y el período proporcionados no fue encontrada.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar la instancia de indicador.

---

# Obtener Instancias de Indicadores por Cuadrante y Período

Este endpoint permite obtener instancias de indicadores según el cuadrante y el período proporcionados.

- **Ruta:** `/indicatorInstances/byQuadrantAndPeriod`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener instancias de indicadores con la información solicitada, filtradas por cuadrante y período.

# Parámetros de Solicitud

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenecen las instancias de indicadores.

**Parámetros de Consulta:**

- `quadrant` (obligatorio): Cuadrante del indicador para filtrar las instancias.
- `period` (obligatorio): ID único del período para filtrar las instancias.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances/byQuadrantAndPeriod?quadrant=1&period=5fd45b1d1c544c001f3a79a9
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
[
  {
    "year": 2023,
    "gadID": {
      "_id": "5fd45b1d1c544c001f3a79a8",
      "name": "Mi GAD",
      // ...
    },
    "indicatorID": {
      "name": "Indicador Ejemplo",
      "description": "Descripción del Indicador",
      "number": 1,
      "quadrant": 1,
      "quadrantName": "Quadrant 1",
      "red": "Red",
      "yellow": "Yellow",
      "green": "Green",
      "ods": [
        {
          "_id": "5fd45b1d1c544c001f3a79a7",
          "name": "ODS 1",
          // ...
        },
        // ...
      ],
      // ...
    },
    "subindicators": [
      {
        "name": "Subindicador 1",
        // ...
      },
      // ...
    ],
    // ...
  },
  // ...
]
```

# Códigos de Respuesta

- `200 OK`: Las instancias de indicadores se recuperaron con éxito y se devuelven en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o los parámetros de consulta están mal formados.
- `404 Not Found`: No se encontraron instancias de indicadores para el cuadrante y período proporcionados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar recuperar las instancias de indicadores.

---

# Resumen de Subindicadores por Calificación

Este endpoint permite obtener un resumen de subindicadores según su calificación en un período específico.

- **Ruta:** `/indicatorInstances/summarySubindicators`
- **Método:** `GET`
- **Descripción:** Este endpoint proporciona un resumen de subindicadores basado en su calificación en el período indicado.

# Parámetros de Solicitud

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenecen las instancias de indicadores.

**Parámetros de Consulta:**

- `period` (obligatorio): ID único del período para filtrar las instancias.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances/summarySubindicators?period=5fd45b1d1c544c001f3a79a9
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
{
  "qualify_0": 10,
  "qualify_1": 25,
  "qualify_2": 50,
  "qualify_3": 15
}
```

# Códigos de Respuesta

- `200 OK`: El resumen de subindicadores se generó con éxito y se devuelve en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o los parámetros de consulta están mal formados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar generar el resumen de subindicadores.

---

# Resumen de Subindicadores por Cuadrante y Calificación

Este endpoint permite obtener un resumen de subindicadores según su cuadrante y calificación en un período específico.

- **Ruta:** `/indicatorInstances/summary`
- **Método:** `GET`
- **Descripción:** Este endpoint proporciona un resumen de subindicadores según su cuadrante y calificación en el período indicado.

# Parámetros de Solicitud

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenecen las instancias de indicadores.

**Parámetros de Consulta:**

- `period` (obligatorio): ID único del período para filtrar las instancias.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances/summary?period=5fd45b1d1c544c001f3a79a9
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
[
  {
    "quadrantName": "Quadrant 1",
    "qualify_0": 15,
    "qualify_1": 10,
    "qualify_2": 20,
    "qualify_3": 5
  },
  {
    "quadrantName": "Quadrant 2",
    "qualify_0": 8,
    "qualify_1": 12,
    "qualify_2": 18,
    "qualify_3": 7
  },
  {
    "quadrantName": "Quadrant 3",
    "qualify_0": 5,
    "qualify_1": 8,
    "qualify_2": 15,
    "qualify_3": 3
  },
  {
    "quadrantName": "Quadrant 4",
    "qualify_0": 10,
    "qualify_1": 5,
    "qualify_2": 12,
    "qualify_3": 2
  }
]
```

# Códigos de Respuesta

- `200 OK`: El resumen de subindicadores se generó con éxito y se devuelve en la respuesta.
- `400 Bad Request`: Faltan parámetros obligatorios o los parámetros de consulta están mal formados.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar generar el resumen de subindicadores.

---

# Obtener Indicador por ID

Este endpoint permite obtener una instancia de indicador por su ID único.

- **Ruta:** `/indicatorInstances/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint obtiene los detalles de una instancia de indicador según su ID único.

# Parámetros de Solicitud

**Parámetros de Ruta:**

- `id` (obligatorio): ID único de la instancia de indicador que se desea obtener.

**Cabeceras:**

- `tenant` (obligatorio): ID único del inquilino (tenant) al que pertenece la instancia de indicador.

# Ejemplo

**Solicitud:**
```http
GET /api/indicatorInstances/5fd45b1d1c544c001f3a79b0
tenant: 5fd45b1d1c544c001f3a79a8
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b0",
  "indicatorID": {
    "_id": "5fd45b1d1c544c001f3a79a0",
    "name": "Indicator A",
    "description": "Description of Indicator A",
    "number": 1,
    "quadrant": 1,
    "quadrantName": "Quadrant 1",
    "red": "Red threshold",
    "yellow": "Yellow threshold",
    "green": "Green threshold",
    "ods": [
      {
        "_id": "5fd45b1d1c544c001f3a79aa",
        "name": "ODS 1",
        "number": 1
      }
    ]
  },
  "subindicators": [
    {
      "_id": "5fd45b1d1c544c001f3a79b5",
      "name": "Subindicator A",
      "createdBy": {
        "_id": "5fd45b1d1c544c001f3a79a5",
        "name": "User A"
      },
      "evidences": []
    }
  ],
  "gadID": {
    "_id": "5fd45b1d1c544c001f3a79a9",
    "name": "GAD A",
    "code": "GAD001",
    "city": "City A",
    "country": "Country A",
    "size": 1000,
    "staff": [],
    "users": [],
    "state": true,
    "publishAuto": true
  },
  "year": "2022",
  "qualification": 2
}
```

# Códigos de Respuesta

- `200 OK`: La instancia de indicador se obtuvo con éxito y se devuelve en la respuesta.
- `404 Not Found`: No se encontró una instancia de indicador con el ID proporcionado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener la instancia de indicador.

---

# Eliminar Indicador por ID

Este endpoint permite eliminar una instancia de indicador por su ID único.

- **Ruta:** `/indicatorInstances/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina una instancia de indicador según su ID único.

# Parámetros de Solicitud

**Parámetros de Ruta:**

- `id` (obligatorio): ID único de la instancia de indicador que se desea eliminar.

# Ejemplo

**Solicitud:**
```http
DELETE /api/indicatorInstances/5fd45b1d1c544c001f3a79b0
```

**Respuesta Exitosa:**
```json
No Content
```

# Códigos de Respuesta

- `204 No Content`: La instancia de indicador se eliminó con éxito.
- `404 Not Found`: No se encontró una instancia de indicador con el ID proporcionado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar eliminar la instancia de indicador.

---

# Actualizar Indicador por ID

Este endpoint permite actualizar una instancia de indicador por su ID único.

- **Ruta:** `/indicatorInstances/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint actualiza una instancia de indicador según su ID único.

# Parámetros de Solicitud

**Parámetros de Ruta:**

- `id` (obligatorio): ID único de la instancia de indicador que se desea actualizar.

**Parámetros de Cuerpo:**

- `qualification` (opcional): Calificación actualizada para la instancia de indicador.
- `subindicators` (opcional): Array de IDs de subindicadores asociados a la instancia de indicador.

# Ejemplo

**Solicitud:**
```http
PUT /api/indicatorInstances/5fd45b1d1c544c001f3a79b0
```

**Cuerpo:**
```json
{
  "qualification": 2,
  "subindicators": ["5fd45b1d1c544c001f3a79b1", "5fd45b1d1c544c001f3a79b2"]
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b0",
  "indicatorID": {
    "_id": "5fd45b1d1c544c001f3a79af",
    "name": "Indicador Ejemplo",
    // ...otros campos
  },
  "gadID": {
    "_id": "5fd45b1d1c544c001f3a79ae",
    "name": "GAD Ejemplo",
    // ...otros campos
  },
  "year": "2022",
  "qualification": 2,
  "subindicators": [
    "5fd45b1d1c544c001f3a79b1",
    "5fd45b1d1c544c001f3a79b2"
  ],
  // ...otros campos
}
```

# Códigos de Respuesta

- `200 OK`: La instancia de indicador se actualizó con éxito.
- `400 Bad Request`: La solicitud contiene parámetros inválidos o faltantes.
- `401 Unauthorized`: El token es inválido o faltante, o el rol no es autorizado para realizar la actualización.
- `404 Not Found`: No se encontró una instancia de indicador con el ID proporcionado.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar actualizar la instancia de indicador.

---

# Iniciar Sesión

Este endpoint permite a un usuario autenticarse y obtener un token de acceso para futuras solicitudes.

- **Ruta:** `/api/login`
- **Método:** `POST`
- **Descripción:** Este endpoint permite a los usuarios iniciar sesión proporcionando sus credenciales de correo electrónico y contraseña. Si las credenciales son válidas, se devuelve un token de acceso que debe utilizarse para autenticar las futuras solicitudes.

# Parámetros de Cuerpo

- `mail` (obligatorio): Correo electrónico del usuario.
- `password` (obligatorio): Contraseña del usuario.

# Ejemplo

**Solicitud:**
```http
POST /api/login
```

**Cuerpo:**
```json
{
  "mail": "usuario@example.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mail": "usuario@example.com",
  "name": "Nombre Usuario",
  "rol": "admin",
  "id": "5fd45b1d1c544c001f3a79b0"
}
```

# Códigos de Respuesta

- `200 OK`: Inicio de sesión exitoso. Se devuelve un token de acceso y la información del usuario.
- `401 Unauthorized`: Las credenciales proporcionadas son inválidas.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar iniciar sesión.

---

# Obtener Objetivos de Desarrollo Sostenible (ODS)

Este endpoint permite obtener la lista de Objetivos de Desarrollo Sostenible (ODS) disponibles en el sistema.

- **Ruta:** `/api/ods`
- **Método:** `GET`
- **Descripción:** Este endpoint devuelve la lista de Objetivos de Desarrollo Sostenible (ODS) disponibles en el sistema.

# Parámetros de Consulta

Este endpoint no requiere ningún parámetro de consulta.

# Ejemplo

**Solicitud:**
```http
GET /api/ods
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79b0",
    "number": 1,
    "name": "Fin de la pobreza",
    "description": "Poner fin a la pobreza en todas sus formas en todo el mundo."
  },
  {
    "_id": "5fd45b1d1c544c001f3a79b1",
    "number": 2,
    "name": "Hambre cero",
    "description": "Poner fin al hambre, lograr la seguridad alimentaria y la mejora de la nutrición."
  },
  // ... más ODS ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente. Se devuelve la lista de Objetivos de Desarrollo Sostenible (ODS).
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar obtener la lista de ODS.

---

# Crear Objetivo de Desarrollo Sostenible (ODS)

Este endpoint permite crear un nuevo Objetivo de Desarrollo Sostenible (ODS) en el sistema.

- **Ruta:** `/api/ods`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo Objetivo de Desarrollo Sostenible (ODS) con la información proporcionada en el cuerpo de la solicitud.

# Cuerpo de la Solicitud

| Campo    | Tipo     | Descripción                                      |
|----------|----------|--------------------------------------------------|
| `name`   | `string` | Nombre del Objetivo de Desarrollo Sostenible.    |
| `number` | `number` | Número del Objetivo de Desarrollo Sostenible.    |
| `img`    | `string` | URL de la imagen asociada al Objetivo de Desarrollo Sostenible. (Opcional) |

# Ejemplo

**Solicitud:**
```http
POST /api/ods
Content-Type: application/json

{
  "name": "Igualdad de género",
  "number": 5,
  "img": "https://example.com/images/gender-equality.jpg"
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b2",
  "name": "Igualdad de género",
  "number": 5,
  "img": "https://example.com/images/gender-equality.jpg"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente. Se devuelve el Objetivo de Desarrollo Sostenible (ODS) creado.
- `400 Bad Request`: La solicitud contiene datos incorrectos o faltantes.
- `500 Internal Server Error`: Se produjo un error en el servidor al intentar crear el ODS.

---

# Obtener Objetivo de Desarrollo Sostenible (ODS) por ID

Este endpoint permite obtener la información de un Objetivo de Desarrollo Sostenible (ODS) específico utilizando su ID.

- **Ruta:** `/api/ods/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera la información del Objetivo de Desarrollo Sostenible (ODS) correspondiente al ID proporcionado en la ruta.

# Parámetros de la Ruta

| Parámetro | Descripción                                       |
|-----------|---------------------------------------------------|
| `id`      | ID del Objetivo de Desarrollo Sostenible (ODS).  |

# Ejemplo

**Solicitud:**
```http
GET /api/ods/5fd45b1d1c544c001f3a79b2
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b2",
  "name": "Igualdad de género",
  "number": 5,
  "img": "https://example.com/images/gender-equality.jpg"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente. Se devuelve el Objetivo de Desarrollo Sostenible (ODS) correspondiente al ID proporcionado.
- `404 Not Found`: No se encontró un ODS con el ID proporcionado.

---

# Eliminar Objetivo de Desarrollo Sostenible (ODS) por ID

Este endpoint permite eliminar un Objetivo de Desarrollo Sostenible (ODS) específico utilizando su ID.

- **Ruta:** `/api/ods/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina el Objetivo de Desarrollo Sostenible (ODS) correspondiente al ID proporcionado en la ruta.

# Parámetros de la Ruta

| Parámetro | Descripción                                       |
|-----------|---------------------------------------------------|
| `id`      | ID del Objetivo de Desarrollo Sostenible (ODS).  |

# Ejemplo

**Solicitud:**
```http
DELETE /api/ods/5fd45b1d1c544c001f3a79b2
```

**Respuesta Exitosa:**
```json
No hay contenido en la respuesta.
```

# Códigos de Respuesta

- `204 No Content`: La solicitud se completó exitosamente y no hay contenido para devolver.

---

# Actualizar Objetivo de Desarrollo Sostenible (ODS) por ID

Este endpoint permite actualizar un Objetivo de Desarrollo Sostenible (ODS) específico utilizando su ID.

- **Ruta:** `/api/ods/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint actualiza el Objetivo de Desarrollo Sostenible (ODS) correspondiente al ID proporcionado en la ruta con los datos proporcionados en el cuerpo de la solicitud.

# Parámetros de la Ruta

| Parámetro | Descripción                                       |
|-----------|---------------------------------------------------|
| `id`      | ID del Objetivo de Desarrollo Sostenible (ODS).  |

# Parámetros del Cuerpo

| Parámetro | Tipo   | Descripción                             |
|-----------|--------|-----------------------------------------|
| `name`    | String | Nombre del Objetivo de Desarrollo Sostenible (ODS). |
| `number`  | Number | Número del Objetivo de Desarrollo Sostenible (ODS). |
| `img`     | String | URL de la imagen del Objetivo de Desarrollo Sostenible (ODS). |

# Ejemplo

**Solicitud:**
```http
PUT /api/ods/5fd45b1d1c544c001f3a79b2
Content-Type: application/json

{
  "name": "Objetivo de Desarrollo Sostenible Actualizado",
  "number": 18,
  "img": "https://ejemplo.com/imagen-actualizada.jpg"
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b2",
  "name": "Objetivo de Desarrollo Sostenible Actualizado",
  "number": 18,
  "img": "https://ejemplo.com/imagen-actualizada.jpg"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve el Objetivo de Desarrollo Sostenible (ODS) actualizado.

---

# Obtener Períodos

Este endpoint permite obtener todos los períodos existentes.

- **Ruta:** `/api/period`
- **Método:** `GET`
- **Descripción:** Este endpoint devuelve una lista de todos los períodos almacenados en la base de datos.

# Parámetros de la Solicitud

| Parámetro | Tipo   | Descripción                                   |
|-----------|--------|-----------------------------------------------|
| `tenant`  | String | (Encabezado) ID del inquilino (tenant). Requerido. |

# Ejemplo

**Solicitud:**
```http
GET /api/period
Content-Type: application/json
tenant: 5fd45b1d1c544c001f3a79b2
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "5fd45b1d1c544c001f3a79b2",
    "name": "2023",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  },
  {
    "_id": "5fd45b1d1c544c001f3a79b3",
    "name": "2024",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  // Más períodos...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve la lista de períodos almacenados.

- `400 Bad Request`: La solicitud no incluye el encabezado 'tenant' o es inválido.

---

# Obtener un Período por ID

Este endpoint permite obtener información detallada de un período específico basado en su ID.

- **Ruta:** `/api/period/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint devuelve los detalles de un período específico identificado por su ID.

# Parámetros de la Solicitud

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `id`      | String | ID del período a ser consultado |

# Ejemplo

**Solicitud:**
```http
GET /api/period/5fd45b1d1c544c001f3a79b2
Content-Type: application/json
```

**Respuesta Exitosa:**
```json
{
  "_id": "5fd45b1d1c544c001f3a79b2",
  "name": "2023",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve los detalles del período solicitado.

- `404 Not Found`: El período con el ID especificado no fue encontrado en la base de datos.

---

# Crear un Nuevo Período

Este endpoint permite crear un nuevo período para un GAD específico.

- **Ruta:** `/api/period`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo período para el GAD actual.

# Parámetros de la Solicitud

| Parámetro | Tipo   | Descripción                          |
|-----------|--------|--------------------------------------|
| `period`  | String | Año del nuevo período (Ej: "2024")   |

# Cabeceras de la Solicitud

| Cabecera | Descripción                    |
|----------|--------------------------------|
| `Authorization` | Token de autenticación JWT |
| `tenant`       | ID del GAD actual           |

# Ejemplo

**Solicitud:**
```http
POST /api/period
Content-Type: application/json
Authorization: Bearer <JWT Token>
tenant: 5fd45b1d1c544c001f3a79b2

{
  "period": "2024"
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "614b55d44b0f7a001f548a7a",
  "year": "2024",
  "gad": "5fd45b1d1c544c001f3a79b2",
  "createdBy": "614b1b92d215710019cc04c7",
  "createdAt": "2021-09-22T12:34:44.123Z",
  "updatedAt": "2021-09-22T12:34:44.123Z"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve los detalles del período creado.

- `400 Bad Request`: Faltan parámetros requeridos en la solicitud.

- `401 Unauthorized`: El token de autenticación es inválido o faltante, o el usuario no tiene permisos suficientes.

---

# Crear un Nuevo Período y Sus Instancias

Este endpoint permite crear un nuevo período y sus instancias asociadas para un GAD específico. Cada instancia incluirá indicadores y subindicadores predeterminados.

- **Ruta:** `/api/period/new`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo período y sus instancias asociadas para el GAD actual. Se crean instancias para todos los indicadores existentes con subindicadores predeterminados.

# Parámetros de la Solicitud

| Parámetro | Tipo   | Descripción                          |
|-----------|--------|--------------------------------------|
| `period`  | String | Año del nuevo período (Ej: "2024")   |

# Cabeceras de la Solicitud

| Cabecera | Descripción                    |
|----------|--------------------------------|
| `Authorization` | Token de autenticación JWT |
| `tenant`       | ID del GAD actual           |

# Ejemplo

**Solicitud:**
```http
POST /api/period/new
Content-Type: application/json
Authorization: Bearer <JWT Token>
tenant: 5fd45b1d1c544c001f3a79b2

{
  "period": "2024"
}
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "614b56ee4b0f7a001f548a7b",
    "indicatorID": "614b55d44b0f7a001f548a79",
    "gadID": "5fd45b1d1c544c001f3a79b2",
    "qualification": 0,
    "create": "2021-09-22T12:38:54.123Z",
    "state": false,
    "period": "614b55d44b0f7a001f548a7a",
    "year": "2024",
    "createdBy": "614b1b92d215710019cc04c7",
    "lastUpdate": "2021-09-22T12:38:54.123Z",
    "subindicators": [
      "614b572a4b0f7a001f548a7c",
      "614b572a4b0f7a001f548a7d"
    ]
  },
  ...
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve las instancias de indicadores creadas para el nuevo período.

- `400 Bad Request`: Faltan parámetros requeridos en la solicitud.

- `401 Unauthorized`: El token de autenticación es inválido o faltante, o el usuario no tiene permisos suficientes.

---

# Eliminar un Período

Este endpoint permite eliminar un período específico.

- **Ruta:** `/api/period/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina un período y todas sus instancias asociadas. Solo los usuarios con el rol de administrador tienen permiso para realizar esta acción.

# Parámetros de la Solicitud

| Parámetro | Tipo   | Descripción                  |
|-----------|--------|------------------------------|
| `id`      | String | ID del período a eliminar    |

# Cabeceras de la Solicitud

| Cabecera | Descripción                    |
|----------|--------------------------------|
| `Authorization` | Token de autenticación JWT |

# Ejemplo

**Solicitud:**
```http
DELETE /api/period/614b55d44b0f7a001f548a7a
Authorization: Bearer <JWT Token>
```

**Respuesta Exitosa:**
```json
{
  "message": "period delete!"
}
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve un mensaje indicando que el período ha sido eliminado.

- `401 Unauthorized`: El token de autenticación es inválido o faltante, o el usuario no tiene permisos suficientes.

---

# Obtener Roles

Este endpoint permite obtener una lista de roles disponibles en el sistema.

- **Ruta:** `/api/rols`
- **Método:** `GET`
- **Descripción:** Este endpoint devuelve una lista de roles disponibles en el sistema.

# Parámetros de la Solicitud

Ninguno.

# Cabeceras de la Solicitud

Ninguna.

# Ejemplo

**Solicitud:**
```http
GET /api/rols
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "614b55d44b0f7a001f548a7a",
    "name": "Admin",
    "description": "Administrator role"
  },
  {
    "_id": "614b55d44b0f7a001f548a7b",
    "name": "User",
    "description": "User role"
  }
]
```

# Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve una lista de roles disponibles en el sistema.

---

# Crear Rol

Este endpoint permite crear un nuevo rol en el sistema.

- **Ruta:** `/api/rols`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo rol en el sistema.

## Parámetros de la Solicitud

Ninguno.

## Cuerpo de la Solicitud

| Campo        | Tipo     | Descripción                   |
|--------------|----------|-------------------------------|
| `name`       | String   | Nombre del rol (obligatorio)  |
| `description`| String   | Descripción del rol           |

## Ejemplo

**Solicitud:**
```http
POST /api/rols
Content-Type: application/json

{
  "name": "Moderator",
  "description": "Moderator role"
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "615ab3d5b9a875001f799ea1",
  "name": "Moderator",
  "description": "Moderator role"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve el nuevo rol creado.
- `400 Bad Request`: La solicitud no se pudo procesar debido a un error en los datos proporcionados.

---

# Obtener Rol por ID

Este endpoint permite obtener los detalles de un rol en el sistema por su ID.

- **Ruta:** `/api/rols/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint obtiene los detalles de un rol en el sistema por su ID.

## Parámetros de la Solicitud

| Parámetro | Tipo     | Descripción                       |
|-----------|----------|-----------------------------------|
| `id`      | String   | ID del rol a obtener (obligatorio)|

## Ejemplo

**Solicitud:**
```http
GET /api/rols/615ab3d5b9a875001f799ea1
```

**Respuesta Exitosa:**
```json
{
  "_id": "615ab3d5b9a875001f799ea1",
  "name": "Moderator",
  "description": "Moderator role"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y devuelve los detalles del rol.
- `404 Not Found`: El rol con el ID especificado no se encontró en el sistema.


---

# Eliminar Rol por ID

Este endpoint permite eliminar un rol en el sistema por su ID.

- **Ruta:** `/api/rols/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina un rol en el sistema por su ID.

## Parámetros de la Solicitud

| Parámetro | Tipo     | Descripción                       |
|-----------|----------|-----------------------------------|
| `id`      | String   | ID del rol a eliminar (obligatorio)|

## Ejemplo

**Solicitud:**
```http
DELETE /api/rols/615ab3d5b9a875001f799ea1
```

**Respuesta Exitosa:**
```
204 No Content
```

## Códigos de Respuesta

- `204 No Content`: La solicitud se completó exitosamente y el rol fue eliminado.
- `404 Not Found`: El rol con el ID especificado no se encontró en el sistema.

---

# Actualizar Rol por ID

Este endpoint permite actualizar un rol en el sistema por su ID.

- **Ruta:** `/api/rols/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint actualiza un rol en el sistema por su ID.

## Parámetros de la Solicitud

| Parámetro | Tipo     | Descripción                       |
|-----------|----------|-----------------------------------|
| `id`      | String   | ID del rol a actualizar (obligatorio)|

## Cuerpo de la Solicitud

El cuerpo de la solicitud debe contener los campos que deseas actualizar en el rol. Estos campos pueden incluir:

| Campo         | Tipo    | Descripción                           |
|---------------|---------|---------------------------------------|
| `name`        | String  | Nombre del rol (opcional)             |
| `description` | String  | Descripción del rol (opcional)        |

## Ejemplo

**Solicitud:**
```http
PUT /api/rols/615ab3d5b9a875001f799ea1
Content-Type: application/json

{
  "name": "Nuevo Nombre de Rol",
  "description": "Nueva Descripción de Rol"
}
```

**Respuesta Exitosa:**
```json
{
  "_id": "615ab3d5b9a875001f799ea1",
  "name": "Nuevo Nombre de Rol",
  "description": "Nueva Descripción de Rol"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y el rol fue actualizado.
- `404 Not Found`: El rol con el ID especificado no se encontró en el sistema.

---

# Obtener Todos los Subindicadores

Este endpoint permite obtener todos los subindicadores almacenados en el sistema.

- **Ruta:** `/api/subIndicators/all`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera todos los subindicadores del sistema, incluyendo información relacionada como compromisos, evidencias y tipo.

## Parámetros de la Solicitud

Este endpoint no requiere ningún parámetro adicional en la solicitud.

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicators/all
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "615ab3d5b9a875001f799ea1",
    "name": "Nombre del Subindicador",
    "typeID": {
      "_id": "615ab3d5b9a875001f799e9f",
      "name": "Tipo de Subindicador",
      "characteristics": [
        {
          "_id": "615ab3d5b9a875001f799e9e",
          "name": "Característica 1"
        },
        {
          "_id": "615ab3d5b9a875001f799e9d",
          "name": "Característica 2"
        }
      ]
    },
    "commits": [...],
    "evidences": [...],
    "createdBy": {...},
    ...
  },
  ...
]
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron todos los subindicadores.

---

# Obtener Subindicadores con Paginación

Este endpoint permite obtener subindicadores con paginación.

- **Ruta:** `/api/subIndicators`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera subindicadores con la opción de paginar los resultados.

## Parámetros de la Solicitud

- `page` (opcional): Número de página para la paginación (valor predeterminado: 1).
- `size` (opcional): Tamaño de página para la paginación (valor predeterminado: 10).

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicators?page=1&size=10
```

**Respuesta Exitosa:**
```json
{
  "totalItems": 100,
  "subIndicators": [
    {
      "_id": "615ab3d5b9a875001f799ea1",
      "name": "Nombre del Subindicador",
      "typeID": {...},
      "commits": [...],
      "evidences": [...],
      "createdBy": {...},
      ...
    },
    ...
  ]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron los subindicadores con paginación.

---

# Obtener Subindicadores Generales por ID de Indicador

Este endpoint permite obtener subindicadores generales por ID de indicador.

- **Ruta:** `/api/subIndicator/indicator/:id/generalSubindicators`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera subindicadores generales por el ID de indicador especificado.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del indicador para el cual se quieren obtener los subindicadores generales.

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/indicator/615ab3d5b9a875001f799ea1/generalSubindicators
```

**Respuesta Exitosa:**
```json
[
  {
    "indicadorID": "615ab3d5b9a875001f799ea1",
    "requireCover": false,
    "cover": null,
    "observationCover": null,
    "typeID": {...},
    "name": "Nombre del Subindicador",
    "responsible": "Responsable",
    "qualification": 0,
    "created": "2023-08-01T12:00:00.000Z",
    "lastUpdate": "2023-08-02T12:00:00.000Z",
    "state": false,
    "createdBy": {...},
    "commits": [...],
    "evidences": [...]
  },
  ...
]
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron los subindicadores generales por ID de indicador.

---

# Obtener Todos los Subindicadores por ID de Indicador

Este endpoint permite obtener todos los subindicadores por ID de indicador.

- **Ruta:** `/api/subIndicator/indicator/:id/all`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera todos los subindicadores por el ID de indicador especificado.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del indicador para el cual se quieren obtener todos los subindicadores.

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/indicator/615ab3d5b9a875001f799ea1/all
```

**Respuesta Exitosa:**
```json
[
  {
    "_id": "615ab3d5b9a875001f799ea1",
    "indicadorID": "615ab3d5b9a875001f799ea1",
    "requireCover": false,
    "cover": null,
    "observationCover": null,
    "typeID": {...},
    "name": "Nombre del Subindicador 1",
    "responsible": "Responsable 1",
    "qualification": 0,
    "created": "2023-08-01T12:00:00.000Z",
    "lastUpdate": "2023-08-02T12:00:00.000Z",
    "state": false,
    "createdBy": {...},
    "commits": [...],
    "evidences": [...]
  },
  {
    "_id": "615ab3d5b9a875001f799ea2",
    "indicadorID": "615ab3d5b9a875001f799ea1",
    "requireCover": true,
    "cover": "URL de la cubierta",
    "observationCover": "Observaciones de la cubierta",
    "typeID": {...},
    "name": "Nombre del Subindicador 2",
    "responsible": "Responsable 2",
    "qualification": 2,
    "created": "2023-08-03T12:00:00.000Z",
    "lastUpdate": "2023-08-04T12:00:00.000Z",
    "state": true,
    "createdBy": {...},
    "commits": [...],
    "evidences": [...]
  },
  ...
]
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron todos los subindicadores por ID de indicador.

---

# Obtener Subindicadores por ID de Indicador con Paginación

Este endpoint permite obtener subindicadores por el ID de indicador especificado, con soporte para paginación.

- **Ruta:** `/api/subIndicator/indicator/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera subindicadores por el ID de indicador especificado, con paginación opcional.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del indicador para el cual se quieren obtener los subindicadores.
- `page` (opcional): Número de página para la paginación (por defecto: 1).
- `size` (opcional): Tamaño de página para la paginación (por defecto: 10).

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/indicator/615ab3d5b9a875001f799ea1?page=1&size=10
```

**Respuesta Exitosa:**
```json
{
  "totalItems": 20,
  "totalPages": 2,
  "currentPage": 1,
  "subIndicators": [
    {
      "_id": "615ab3d5b9a875001f799ea1",
      "indicadorID": "615ab3d5b9a875001f799ea1",
      "requireCover": false,
      "cover": null,
      "observationCover": null,
      "typeID": {...},
      "name": "Nombre del Subindicador 1",
      "responsible": "Responsable 1",
      "qualification": 0,
      "created": "2023-08-01T12:00:00.000Z",
      "lastUpdate": "2023-08-02T12:00:00.000Z",
      "state": false,
      "createdBy": {...},
      "commits": [...],
      "evidences": [...]
    },
    {
      "_id": "615ab3d5b9a875001f799ea2",
      "indicadorID": "615ab3d5b9a875001f799ea1",
      "requireCover": true,
      "cover": "URL de la cubierta",
      "observationCover": "Observaciones de la cubierta",
      "typeID": {...},
      "name": "Nombre del Subindicador 2",
      "responsible": "Responsable 2",
      "qualification": 2,
      "created": "2023-08-03T12:00:00.000Z",
      "lastUpdate": "2023-08-04T12:00:00.000Z",
      "state": true,
      "createdBy": {...},
      "commits": [...],
      "evidences": [...]
    },
    ...
  ]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron los subindicadores por ID de indicador con paginación.

---

# Obtener Subindicadores Específicos por ID de Indicador con Paginación

Este endpoint permite obtener subindicadores específicos por el ID de indicador especificado, con soporte para paginación.

- **Ruta:** `/api/subIndicator/indicator/:id/subindicatorsSpecific`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera subindicadores específicos por el ID de indicador especificado, con paginación opcional.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del indicador para el cual se quieren obtener los subindicadores específicos.
- `page` (opcional): Número de página para la paginación (por defecto: 1).
- `size` (opcional): Tamaño de página para la paginación (por defecto: 10).

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/indicator/615ab3d5b9a875001f799ea1/subindicatorsSpecific?page=1&size=10
```

**Respuesta Exitosa:**
```json
{
  "pagination": {
    "pag": 1,
    "size": 10,
    "totalPages": 2,
    "nextPage": 2,
    "prevPage": null,
    "existNextPage": true,
    "existPrevPage": false,
    "totalDocs": 15
  },
  "docs": [
    {
      "id": "615ab3d5b9a875001f799eb1",
      "indicadorID": "615ab3d5b9a875001f799ea1",
      "requireCover": false,
      "cover": null,
      "observationCover": null,
      "typeID": {...},
      "name": "Nombre del Subindicador Específico 1",
      "responsible": "Responsable 1",
      "qualification": 0,
      "created": "2023-08-01T12:00:00.000Z",
      "lastUpdate": "2023-08-02T12:00:00.000Z",
      "state": false,
      "createdBy": {...},
      "commits": [...],
      "evidences": [...]
    },
    {
      "id": "615ab3d5b9a875001f799eb2",
      "indicadorID": "615ab3d5b9a875001f799ea1",
      "requireCover": true,
      "cover": "URL de la cubierta",
      "observationCover": "Observaciones de la cubierta",
      "typeID": {...},
      "name": "Nombre del Subindicador Específico 2",
      "responsible": "Responsable 2",
      "qualification": 2,
      "created": "2023-08-03T12:00:00.000Z",
      "lastUpdate": "2023-08-04T12:00:00.000Z",
      "state": true,
      "createdBy": {...},
      "commits": [...],
      "evidences": [...]
    },
    ...
  ]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvieron los subindicadores específicos por ID de indicador con paginación.

- `204 No Content`: La solicitud se completó exitosamente, pero no se encontraron subindicadores específicos para el indicador dado.

---

# Obtener Subindicador Específico por ID de Indicador y ID de Tipo

Este endpoint permite obtener un subindicador específico por el ID de indicador y el ID de tipo especificados.

- **Ruta:** `/api/subIndicator/indicator/:indicatorID/type/:typeID`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera un subindicador específico por el ID de indicador y el ID de tipo especificados.

## Parámetros de la Solicitud

- `indicatorID` (obligatorio): ID del indicador para el cual se quiere obtener el subindicador.
- `typeID` (obligatorio): ID del tipo para el cual se quiere obtener el subindicador.

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/indicator/615ab3d5b9a875001f799ea1/type/615ab3d5b9a875001f799eb1
```

**Respuesta Exitosa:**
```json
{
  "id": "615ab3d5b9a875001f799eb1",
  "indicadorID": "615ab3d5b9a875001f799ea1",
  "requireCover": false,
  "cover": null,
  "observationCover": null,
  "typeID": {
    "id": "615ab3d5b9a875001f799eb1",
    "name": "Nombre del Tipo",
    "characteristics": [...]
  },
  "name": "Nombre del Subindicador",
  "responsible": "Responsable del Subindicador",
  "qualification": 2,
  "created": "2023-08-01T12:00:00.000Z",
  "lastUpdate": "2023-08-04T12:00:00.000Z",
  "state": true,
  "createdBy": {
    "id": "615ab3d5b9a875001f799eaf1",
    "name": "Nombre del Creador",
    ...
  },
  "commits": [...],
  "evidences": [...]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvió el subindicador específico por ID de indicador y ID de tipo.

- `404 Not Found`: No se encontró un subindicador específico para los IDs de indicador y tipo dados.

---

# Obtener Subindicador por ID

Este endpoint permite obtener un subindicador específico por su ID.

- **Ruta:** `/api/subIndicator/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera un subindicador específico por su ID.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del subindicador que se quiere obtener.

## Ejemplo

**Solicitud:**
```http
GET /api/subIndicator/615ab3d5b9a875001f799eb1
```

**Respuesta Exitosa:**
```json
{
  "id": "615ab3d5b9a875001f799eb1",
  "indicadorID": {
    "id": "615ab3d5b9a875001f799ea1",
    "indicatorID": {
      "id": "615ab3d5b9a875001f799e91",
      "name": "Nombre del Indicador",
      ...
    },
    ...
  },
  "requireCover": false,
  "cover": null,
  "observationCover": null,
  "typeID": {
    "id": "615ab3d5b9a875001f799eb1",
    "name": "Nombre del Tipo",
    "characteristics": [...]
  },
  "name": "Nombre del Subindicador",
  "responsible": "Responsable del Subindicador",
  "qualification": 2,
  "created": "2023-08-01T12:00:00.000Z",
  "lastUpdate": "2023-08-04T12:00:00.000Z",
  "state": true,
  "createdBy": {
    "id": "615ab3d5b9a875001f799eaf1",
    "name": "Nombre del Creador",
    ...
  },
  "commits": [...],
  "evidences": [...]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvió el subindicador correspondiente al ID especificado.

- `404 Not Found`: No se encontró un subindicador para el ID dado.

---

# Eliminar Subindicador por ID

Este endpoint permite eliminar un subindicador específico por su ID.

- **Ruta:** `/api/subIndicator/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina un subindicador específico por su ID.

## Parámetros de la Solicitud

- `id` (obligatorio): ID del subindicador que se quiere eliminar.

## Ejemplo

**Solicitud:**
```http
DELETE /api/subIndicator/615ab3d5b9a875001f799eb1
```

**Respuesta Exitosa:**
```http
204 No Content
```

## Códigos de Respuesta

- `204 No Content`: La solicitud se completó exitosamente y el subindicador correspondiente al ID especificado fue eliminado.

- `404 Not Found`: No se encontró un subindicador para el ID dado.

---

# Crear un Nuevo Subindicador

Este endpoint permite crear un nuevo subindicador.

- **Ruta:** `/api/subIndicator`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo subindicador con la información proporcionada en el cuerpo de la solicitud.

## Cuerpo de la Solicitud

El cuerpo de la solicitud debe contener los siguientes datos:

- `indicadorID` (obligatorio): ID del indicador al que pertenece el subindicador.
- `typeID` (obligatorio): ID del tipo de subindicador.
- `name` (obligatorio): Nombre del subindicador.
- `responsible`: Responsable del subindicador.
- `qualification`: Calificación del subindicador.
- `commits` (opcional): Un array de IDs de commits relacionados con el subindicador.
- `evidences` (opcional): Un array de IDs de evidencias relacionadas con el subindicador.
- `createdBy` (obligatorio): ID del usuario que crea el subindicador.

## Ejemplo

**Solicitud:**
```http
POST /api/subIndicator
Content-Type: application/json

{
  "indicadorID": "615ab3d5b9a875001f799eb1",
  "typeID": "615ab3d5b9a875001f799eaf",
  "name": "Subindicador Ejemplo",
  "responsible": "Responsable Ejemplo",
  "qualification": 2,
  "commits": ["615ab3d5b9a875001f799eac", "615ab3d5b9a875001f799ead"],
  "evidences": ["615ab3d5b9a875001f799eae", "615ab3d5b9a875001f799eaf"],
  "createdBy": "615ab3d5b9a875001f799eab"
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "6161a3a0b9a875001f799e22",
  "indicadorID": "615ab3d5b9a875001f799eb1",
  "typeID": "615ab3d5b9a875001f799eaf",
  "name": "Subindicador Ejemplo",
  "responsible": "Responsable Ejemplo",
  "qualification": 2,
  "created": "2021-10-08T12:34:56.789Z",
  "lastUpdate": "2021-10-08T12:34:56.789Z",
  "state": true,
  "createdBy": "615ab3d5b9a875001f799eab",
  "commits": ["615ab3d5b9a875001f799eac", "615ab3d5b9a875001f799ead"],
  "evidences": ["615ab3d5b9a875001f799eae", "615ab3d5b9a875001f799eaf"]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y el subindicador fue creado.

- `400 Bad Request`: El cuerpo de la solicitud es incorrecto o incompleto.

---

# Crear un Nuevo Subindicador

Este endpoint permite a los usuarios autorizados crear un nuevo subindicador.

- **Ruta:** `/api/subIndicator/newSubindicator`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo subindicador con la información proporcionada en el cuerpo de la solicitud. Solo los usuarios con roles autorizados pueden acceder a este endpoint.

## Cuerpo de la Solicitud

El cuerpo de la solicitud debe contener los siguientes datos:

- `typeID` (obligatorio): ID del tipo de subindicador.
- `name` (obligatorio): Nombre del subindicador.
- `indicadorID` (obligatorio): ID del indicador al que pertenece el subindicador.
- `requireCover`: Indica si se requiere una portada (opcional, valor predeterminado: `true`).
- `cover`: Portada del subindicador (opcional).
- `observationCover`: Observaciones sobre la portada (opcional).
- `isPlanned`: Indica si está planificado (opcional).
- `isDiagnosed`: Indica si está diagnosticado (opcional).
- `responsible`: Responsable del subindicador.
- `qualification`: Calificación del subindicador.
- `commits` (opcional): Un array de IDs de commits relacionados con el subindicador.
- `evidences` (opcional): Un array de IDs de evidencias relacionadas con el subindicador.

## Autorización

Este endpoint requiere un token de autenticación válido con un rol autorizado. Los usuarios con el rol 'admin' o roles equivalentes pueden acceder a este endpoint.

## Ejemplo

**Solicitud:**
```http
POST /api/subIndicator/newSubindicator
Content-Type: application/json
Authorization: Bearer <token>

{
  "typeID": "615ab3d5b9a875001f799eaf",
  "name": "Nuevo Subindicador",
  "indicadorID": "615ab3d5b9a875001f799eb1",
  "responsible": "Responsable Ejemplo",
  "qualification": 3,
  "commits": ["615ab3d5b9a875001f799eac", "615ab3d5b9a875001f799ead"],
  "evidences": ["615ab3d5b9a875001f799eae", "615ab3d5b9a875001f799eaf"]
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "6161a3a0b9a875001f799e22",
  "typeID": "615ab3d5b9a875001f799eaf",
  "name": "Nuevo Subindicador",
  "indicadorID": "615ab3d5b9a875001f799eb1",
  "requireCover": true,
  "cover": null,
  "observationCover": null,
  "isPlanned": false,
  "isDiagnosed": false,
  "responsible": "Responsable Ejemplo",
  "qualification": 3,
  "created": "2021-10-08T12:34:56.789Z",
  "lastUpdate": "2021-10-08T12:34:56.789Z",
  "state": false,
  "createdBy": "615ab3d5b9a875001f799eab",
  "commits": ["615ab3d5b9a875001f799eac", "615ab3d5b9a875001f799ead"],
  "evidences": ["615ab3d5b9a875001f799eae", "615ab3d5b9a875001f799eaf"]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y el subindicador fue creado.

- `400 Bad Request`: El cuerpo de la solicitud es incorrecto o incompleto.

- `401 Unauthorized`: El usuario no está autorizado para acceder a este endpoint.

---

# Actualizar Subindicador

Este endpoint permite a los usuarios autorizados actualizar la información de un subindicador existente.

- **Ruta:** `/api/subIndicator/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint actualiza un subindicador existente con la información proporcionada en el cuerpo de la solicitud. Solo los usuarios con roles autorizados pueden acceder a este endpoint.

## Parámetros de la Ruta

- `id` (obligatorio): ID del subindicador que se va a actualizar.

## Cuerpo de la Solicitud

El cuerpo de la solicitud debe contener los datos actualizados del subindicador:

- `name` (opcional): Nuevo nombre del subindicador.
- `responsible` (opcional): Nuevo responsable del subindicador.
- `typeID` (opcional): Nuevo ID del tipo de subindicador.
- `qualification` (opcional): Nueva calificación del subindicador.
- `commits` (opcional): Un array de IDs de commits relacionados con el subindicador.
- `evidences` (opcional): Un array de IDs de evidencias relacionadas con el subindicador.

## Autorización

Este endpoint requiere un token de autenticación válido con un rol autorizado. Los usuarios con el rol 'admin' o roles equivalentes pueden acceder a este endpoint.

## Ejemplo

**Solicitud:**
```http
PUT /api/subIndicator/6161a3a0b9a875001f799e22
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Subindicador Actualizado",
  "responsible": "Nuevo Responsable",
  "qualification": 4,
  "commits": ["615ab3d5b9a875001f799eac"],
  "evidences": ["615ab3d5b9a875001f799eae"]
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "6161a3a0b9a875001f799e22",
  "typeID": "615ab3d5b9a875001f799eaf",
  "name": "Subindicador Actualizado",
  "indicadorID": "615ab3d5b9a875001f799eb1",
  "requireCover": true,
  "cover": null,
  "observationCover": null,
  "isPlanned": false,
  "isDiagnosed": false,
  "responsible": "Nuevo Responsable",
  "qualification": 4,
  "created": "2021-10-08T12:34:56.789Z",
  "lastUpdate": "2021-10-08T13:45:12.345Z",
  "state": false,
  "createdBy": "615ab3d5b9a875001f799eab",
  "commits": ["615ab3d5b9a875001f799eac"],
  "evidences": ["615ab3d5b9a875001f799eae"]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y el subindicador fue actualizado.

- `400 Bad Request`: El cuerpo de la solicitud es incorrecto o incompleto.

- `401 Unauthorized`: El usuario no está autorizado para acceder a este endpoint.

---

# Obtener Tipos de Subindicadores

Este endpoint permite a los usuarios obtener una lista de tipos de subindicadores. Pueden filtrar los tipos por su estado de obligatoriedad.

- **Ruta:** `/api/type`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera una lista de tipos de subindicadores de la base de datos. Los tipos pueden ser filtrados por su estado de obligatoriedad utilizando el parámetro de consulta `mandatory`.

## Parámetros de la Solicitud

- `mandatory` (opcional): Un valor booleano que indica si se deben recuperar solo los tipos obligatorios (`true`) o todos los tipos (`false`). Por defecto, se recuperan todos los tipos si no se proporciona este parámetro.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
GET /api/type?mandatory=true
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

[
  {
    "id": "615ab3d5b9a875001f799eaf",
    "name": "Tipo A",
    "description": "Descripción del Tipo A",
    "mandatory": true,
    "characteristics": [
      {
        "id": "615ab3d5b9a875001f799eac",
        "name": "Característica 1"
      },
      {
        "id": "615ab3d5b9a875001f799ead",
        "name": "Característica 2"
      }
    ]
  },
  {
    "id": "615ab3d5b9a875001f799eaf",
    "name": "Tipo B",
    "description": "Descripción del Tipo B",
    "mandatory": true,
    "characteristics": [
      {
        "id": "615ab3d5b9a875001f799eac",
        "name": "Característica 1"
      }
    ]
  }
]
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvió la lista de tipos de subindicadores.

---

# Obtener Tipo de Subindicador por ID

Este endpoint permite a los usuarios obtener información detallada sobre un tipo de subindicador específico mediante su identificador (ID).

- **Ruta:** `/api/type/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera información detallada sobre un tipo de subindicador utilizando su ID como parámetro de la ruta.

## Parámetros de la Solicitud

- `id`: El identificador único del tipo de subindicador que se desea recuperar.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
GET /api/type/615ab3d5b9a875001f799eaf
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "615ab3d5b9a875001f799eaf",
  "name": "Tipo A",
  "description": "Descripción del Tipo A",
  "mandatory": true,
  "characteristics": [
    {
      "id": "615ab3d5b9a875001f799eac",
      "name": "Característica 1"
    },
    {
      "id": "615ab3d5b9a875001f799ead",
      "name": "Característica 2"
    }
  ]
}
```

**Respuesta de Error (Tipo no encontrado):**
```http
404 Not Found
Content-Type: application/json

{
  "error": "Tipo de subindicador no encontrado"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvió la información del tipo de subindicador.
- `404 Not Found`: El tipo de subindicador con el ID proporcionado no fue encontrado.

---

# Eliminar Tipo de Subindicador por ID

Este endpoint permite a los usuarios eliminar un tipo de subindicador específico mediante su identificador (ID).

- **Ruta:** `/api/type/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint elimina un tipo de subindicador utilizando su ID como parámetro de la ruta.

## Parámetros de la Solicitud

- `id`: El identificador único del tipo de subindicador que se desea eliminar.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
DELETE /api/type/615ab3d5b9a875001f799eaf
```

**Respuesta Exitosa:**
```http
204 No Content
```

**Respuesta de Error (Tipo no encontrado):**
```http
404 Not Found
Content-Type: application/json

{
  "error": "Tipo de subindicador no encontrado"
}
```

## Códigos de Respuesta

- `204 No Content`: La solicitud se completó exitosamente y el tipo de subindicador fue eliminado.
- `404 Not Found`: El tipo de subindicador con el ID proporcionado no fue encontrado.

---

# Crear Nuevo Tipo de Subindicador

Este endpoint permite a los usuarios crear un nuevo tipo de subindicador.

- **Ruta:** `/api/type`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo tipo de subindicador utilizando los datos proporcionados en el cuerpo de la solicitud.

## Parámetros de la Solicitud

El cuerpo de la solicitud debe ser un objeto JSON con los siguientes campos:

- `name` (obligatorio): El nombre del tipo de subindicador.
- `green`: Valor de referencia para el color verde.
- `yellow`: Valor de referencia para el color amarillo.
- `red`: Valor de referencia para el color rojo.
- `mandatory` (obligatorio): Indica si el tipo de subindicador es obligatorio (`true`) o no (`false`).
- `characteristics` (obligatorio): Un array de IDs de características asociadas a este tipo de subindicador.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
POST /api/type
Content-Type: application/json

{
  "name": "Eficiencia Energética",
  "green": 80,
  "yellow": 60,
  "red": 40,
  "mandatory": true,
  "characteristics": ["615ab3d5b9a875001f799eaf", "615ab3d5b9a875001f799eb0"]
}
```

**Respuesta Exitosa:**
```http
201 Created
Content-Type: application/json

{
  "id": "615ab3d5b9a875001f799eb1",
  "name": "Eficiencia Energética",
  "green": 80,
  "yellow": 60,
  "red": 40,
  "mandatory": true,
  "characteristics": ["615ab3d5b9a875001f799eaf", "615ab3d5b9a875001f799eb0"]
}
```

**Respuesta de Error (Nombre faltante):**
```http
400 Bad Request
Content-Type: application/json

{
  "error": "name missing"
}
```

## Códigos de Respuesta

- `201 Created`: La solicitud se completó exitosamente y se creó un nuevo tipo de subindicador.
- `400 Bad Request`: La solicitud no pudo ser procesada debido a datos faltantes o incorrectos en el cuerpo de la solicitud.

---

# Actualizar Tipo de Subindicador

Este endpoint permite a los usuarios actualizar un tipo de subindicador existente.

- **Ruta:** `/api/type/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint actualiza un tipo de subindicador existente identificado por su ID utilizando los datos proporcionados en el cuerpo de la solicitud.

## Parámetros de la Solicitud

La URL debe incluir el ID del tipo de subindicador a actualizar.

El cuerpo de la solicitud debe ser un objeto JSON con los siguientes campos:

- `name` (obligatorio): El nuevo nombre del tipo de subindicador.
- `green`: El nuevo valor de referencia para el color verde.
- `yellow`: El nuevo valor de referencia para el color amarillo.
- `red`: El nuevo valor de referencia para el color rojo.
- `mandatory` (obligatorio): El nuevo valor que indica si el tipo de subindicador es obligatorio (`true`) o no (`false`).
- `characteristics` (obligatorio): Un array de nuevos IDs de características asociadas a este tipo de subindicador.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
PUT /api/type/615ab3d5b9a875001f799eb1
Content-Type: application/json

{
  "name": "Eficiencia Energética Actualizado",
  "green": 85,
  "yellow": 65,
  "red": 45,
  "mandatory": false,
  "characteristics": ["615ab3d5b9a875001f799eaf", "615ab3d5b9a875001f799eb2"]
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "615ab3d5b9a875001f799eb1",
  "name": "Eficiencia Energética Actualizado",
  "green": 85,
  "yellow": 65,
  "red": 45,
  "mandatory": false,
  "characteristics": ["615ab3d5b9a875001f799eaf", "615ab3d5b9a875001f799eb2"]
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y el tipo de subindicador fue actualizado.
- `404 Not Found`: El tipo de subindicador con el ID especificado no fue encontrado.
- `400 Bad Request`: La solicitud no pudo ser procesada debido a datos faltantes o incorrectos en el cuerpo de la solicitud.

---

# Obtener Usuarios en el Espacio de Trabajo

Este endpoint permite a los usuarios obtener una lista de usuarios en un espacio de trabajo específico.

- **Ruta:** `/api/users`
- **Método:** `GET`
- **Descripción:** Este endpoint recupera una lista de usuarios que pertenecen al espacio de trabajo identificado por el encabezado 'tenant'.

## Parámetros de la Solicitud

La solicitud debe incluir el encabezado 'tenant' con el ID del espacio de trabajo al que pertenecen los usuarios.

## Autorización

Este endpoint no requiere autenticación.

## Ejemplo

**Solicitud:**
```http
GET /api/users
tenant: 615ab3d5b9a875001f799eb1
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

[
  {
    "id": "615ab3d5b9a875001f799eac",
    "username": "usuario1",
    "email": "usuario1@example.com",
    "rol": {
      "id": "615ab3d5b9a875001f799eb0",
      "name": "Admin"
    },
    "gadID": "615ab3d5b9a875001f799eb1"
  },
  {
    "id": "615ab3d5b9a875001f799ead",
    "username": "usuario2",
    "email": "usuario2@example.com",
    "rol": {
      "id": "615ab3d5b9a875001f799eb3",
      "name": "User"
    },
    "gadID": "615ab3d5b9a875001f799eb1"
  }
]
```

**Respuesta en Caso de Espacio de Trabajo Vacío:**
```http
200 OK
Content-Type: application/json

{
  "message": "no users in workspace"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se devolvió la lista de usuarios en el espacio de trabajo especificado.
- `400 Bad Request`: La solicitud no pudo ser procesada debido a la falta del encabezado 'tenant'.

---

# Crear un Nuevo Usuario

Este endpoint permite a los administradores crear un nuevo usuario en el espacio de trabajo especificado.

- **Ruta:** `/api/users`
- **Método:** `POST`
- **Descripción:** Este endpoint crea un nuevo usuario en el espacio de trabajo identificado por el encabezado 'tenant'.

## Parámetros de la Solicitud

La solicitud debe incluir el encabezado 'tenant' con el ID del espacio de trabajo al que pertenecerá el nuevo usuario. Además, el cuerpo de la solicitud debe contener los siguientes campos:

- `name`: Nombre del usuario.
- `mail`: Correo electrónico del usuario.
- `password`: Contraseña del usuario.
- `rol`: ID del rol asignado al usuario.

## Autorización

Este endpoint está diseñado para ser utilizado solo por administradores. Se requiere autenticación y autorización adecuadas.

## Ejemplo

**Solicitud:**
```http
POST /api/users
tenant: 615ab3d5b9a875001f799eb1
Content-Type: application/json

{
  "name": "Nuevo Usuario",
  "mail": "nuevo_usuario@example.com",
  "password": "contraseña123",
  "rol": "615ab3d5b9a875001f799eb3"
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "615ab3d5b9a875001f799eac",
  "name": "Nuevo Usuario",
  "mail": "nuevo_usuario@example.com",
  "rol": {
    "id": "615ab3d5b9a875001f799eb3",
    "name": "User"
  },
  "gadID": "615ab3d5b9a875001f799eb1",
  "created": "2023-08-06T12:34:56.789Z",
  "lastUpdate": "2023-08-06T12:34:56.789Z",
  "state": true
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se creó un nuevo usuario en el espacio de trabajo especificado.
- `400 Bad Request`: La solicitud no pudo ser procesada debido a datos faltantes o incorrectos en el cuerpo de la solicitud.
- `401 Unauthorized`: El usuario no está autorizado para realizar esta acción.
- `403 Forbidden`: El usuario no tiene los permisos necesarios para realizar esta acción.

---

# Registro de Nuevo Usuario

Este endpoint permite a los usuarios registrarse en el espacio de trabajo especificado.

- **Ruta:** `/api/users/signUp`
- **Método:** `POST`
- **Descripción:** Este endpoint permite a los usuarios registrarse en el espacio de trabajo identificado por el encabezado 'tenant'.

## Parámetros de la Solicitud

La solicitud debe incluir el encabezado 'tenant' con el ID del espacio de trabajo al que pertenecerá el nuevo usuario. Además, el cuerpo de la solicitud debe contener los siguientes campos:

- `name`: Nombre del usuario.
- `mail`: Correo electrónico del usuario.
- `password`: Contraseña del usuario.
- `rol`: ID del rol asignado al usuario.

## Ejemplo

**Solicitud:**
```http
POST /api/users/signUp
tenant: 615ab3d5b9a875001f799eb1
Content-Type: application/json

{
  "name": "Nuevo Usuario",
  "mail": "nuevo_usuario@example.com",
  "password": "contraseña123",
  "rol": "615ab3d5b9a875001f799eb3"
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "id": "615ab3d5b9a875001f799eac",
  "name": "Nuevo Usuario",
  "mail": "nuevo_usuario@example.com",
  "rol": "615ab3d5b9a875001f799eb3",
  "gadID": "615ab3d5b9a875001f799eb1",
  "created": "2023-08-06T12:34:56.789Z",
  "lastUpdate": "2023-08-06T12:34:56.789Z",
  "state": true
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se completó exitosamente y se registró un nuevo usuario en el espacio de trabajo especificado.
- `400 Bad Request`: La solicitud no pudo ser procesada debido a datos faltantes o incorrectos en el cuerpo de la solicitud.
- `401 Unauthorized`: El usuario no está autorizado para realizar esta acción.

---

# Verificación de Contraseña de Usuario

Este endpoint permite verificar si la contraseña proporcionada por el usuario coincide con la contraseña almacenada en la base de datos para ese usuario.

- **Ruta:** `/api/users/password`
- **Método:** `POST`
- **Descripción:** Este endpoint permite verificar si la contraseña proporcionada por el usuario coincide con la contraseña almacenada en la base de datos para ese usuario.

## Parámetros de la Solicitud

El cuerpo de la solicitud debe contener los siguientes campos:

- `mail`: Correo electrónico del usuario.
- `password`: Contraseña proporcionada por el usuario.

## Ejemplo

**Solicitud:**
```http
POST /api/users/password
Content-Type: application/json

{
  "mail": "usuario@example.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "key": true
}
```

**Respuesta Fallida:**
```http
401 Unauthorized
Content-Type: application/json

{
  "key": false
}
```

## Códigos de Respuesta

- `200 OK`: La contraseña proporcionada por el usuario coincide con la contraseña almacenada en la base de datos para el usuario especificado.
- `401 Unauthorized`: La contraseña proporcionada por el usuario no coincide con la contraseña almacenada en la base de datos.

---

# Obtener Información de Usuario por ID

Este endpoint permite obtener información detallada de un usuario según su ID.

- **Ruta:** `/api/users/:id`
- **Método:** `GET`
- **Descripción:** Este endpoint permite obtener información detallada de un usuario según su ID.

## Parámetros de la Solicitud

No se requieren parámetros adicionales en la URL.

## Ejemplo

**Solicitud:**
```http
GET /api/users/5f7b08a9c28c7a001cf0b18a
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "_id": "5f7b08a9c28c7a001cf0b18a",
  "name": "Usuario Ejemplo",
  "mail": "usuario@example.com",
  "rol": {
    "_id": "5f7b08a9c28c7a001cf0b18b",
    "name": "Rol de Ejemplo",
    "description": "Descripción del Rol de Ejemplo"
  },
  "created": "2023-08-06T12:00:00.000Z",
  "lastUpdate": "2023-08-06T12:30:00.000Z",
  "state": true,
  "gadID": "5f7b08a9c28c7a001cf0b18c"
}
```

**Respuesta Fallida:**
```http
404 Not Found
Content-Type: application/json

{
  "error": "User not found"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se ha completado exitosamente y se devuelve la información detallada del usuario.
- `404 Not Found`: No se encontró un usuario con el ID especificado.

---

# Eliminar Usuario por ID

Este endpoint permite eliminar un usuario según su ID.

- **Ruta:** `/api/users/:id`
- **Método:** `DELETE`
- **Descripción:** Este endpoint permite eliminar un usuario según su ID.

## Parámetros de la Solicitud

No se requieren parámetros adicionales en la URL.

## Ejemplo

**Solicitud:**
```http
DELETE /api/users/5f7b08a9c28c7a001cf0b18a
```

**Respuesta Exitosa:**
```http
204 No Content
```

## Códigos de Respuesta

- `204 No Content`: La solicitud se ha completado exitosamente y el usuario ha sido eliminado.

---

# Actualizar Usuario por ID

Este endpoint permite actualizar un usuario según su ID.

- **Ruta:** `/api/users/:id`
- **Método:** `PUT`
- **Descripción:** Este endpoint permite actualizar un usuario según su ID.

## Parámetros de la Solicitud

No se requieren parámetros adicionales en la URL.

## Cuerpo de la Solicitud

El cuerpo de la solicitud debe contener los siguientes campos:

- `name` (string, requerido): El nuevo nombre del usuario.
- `mail` (string, requerido): El nuevo correo electrónico del usuario.
- `password` (string, requerido): La nueva contraseña del usuario (debe estar en texto sin formato).
- `rol` (string, requerido): El ID del rol del usuario.

## Ejemplo

**Solicitud:**
```http
PUT /api/users/5f7b08a9c28c7a001cf0b18a
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "mail": "nuevo@example.com",
  "password": "nuevacontraseña123",
  "rol": "5f7b08a9c28c7a001cf0b18b"
}
```

**Respuesta Exitosa:**
```http
200 OK
Content-Type: application/json

{
  "_id": "5f7b08a9c28c7a001cf0b18a",
  "name": "Nuevo Nombre",
  "mail": "nuevo@example.com",
  "rol": {
    "_id": "5f7b08a9c28c7a001cf0b18b",
    "name": "Nuevo Rol",
    "description": "Descripción del nuevo rol"
  },
  "created": "2023-08-06T12:34:56.789Z",
  "lastUpdate": "2023-08-06T12:34:56.789Z",
  "state": true,
  "gadID": "5f7b08a9c28c7a001cf0b18c"
}
```

## Códigos de Respuesta

- `200 OK`: La solicitud se ha completado exitosamente y el usuario ha sido actualizado.

