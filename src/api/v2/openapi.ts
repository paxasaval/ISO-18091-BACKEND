// Especificacion OpenAPI 3 de /api/v2 (hand-authored desde los *.routes.ts).
//
// Cobertura:
//   - Todos los paths y metodos reales montados en index.ts.
//   - Schemas de envelope exito/error, PaginationMeta y codigos de error.
//   - Parametros de path, query y requestBody resumidos desde los zod schemas.
//   - Seguridad BearerAuth por endpoint (authenticate / requirePermission).
//   - Descripcion del permiso requerido en cada operacion protegida.

import type { OpenAPIV3 } from 'openapi-types'

const spec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'ISO 18091 API v2',
    version: '2.0.0',
    description:
      'API REST de la plataforma ISO 18091 (evaluacion de gobiernos abiertos). ' +
      'Todos los endpoints devuelven el envelope `{data, meta?}` en exito y ' +
      '`{error:{code,message,details?}}` en error. ' +
      'v1 (`/api/...`) es legacy congelado y no se documenta aqui.'
  },
  servers: [
    {
      url: '/api/v2',
      description: 'API v2'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Token JWT obtenido en POST /api/login. ' +
          'Incluir en cabecera: Authorization: Bearer <token>'
      }
    },
    schemas: {
      // --- Envelope de exito ---
      SuccessEnvelope: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            description: 'Recurso o array de recursos',
            oneOf: [
              { type: 'object' },
              { type: 'array', items: { type: 'object' } }
            ]
          },
          meta: {
            $ref: '#/components/schemas/Meta'
          }
        }
      },
      Meta: {
        type: 'object',
        properties: {
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
          }
        },
        additionalProperties: true
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'size', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 1 },
          size: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 }
        }
      },
      // --- Envelope de error ---
      ErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'UNAUTHORIZED',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'INVALID_ID',
                  'INTERNAL'
                ],
                description:
                  'Codigo de error canonico: ' +
                  'VALIDATION_ERROR (400) — body/params invalidos; ' +
                  'UNAUTHORIZED (401) — token ausente o invalido; ' +
                  'FORBIDDEN (403) — rol sin el permiso requerido; ' +
                  'NOT_FOUND (404) — recurso no encontrado; ' +
                  'INVALID_ID (400) — ObjectId mal formado; ' +
                  'INTERNAL (500) — error interno.'
              },
              message: { type: 'string', example: 'not found' },
              details: {
                description: 'Informacion adicional (issues de validacion, etc.)',
                nullable: true
              }
            }
          }
        }
      },
      // --- Schemas de recursos (resumen) ---
      ObjectId: {
        type: 'string',
        pattern: '^[a-f\\d]{24}$',
        example: '6474f1e2b9c3e1a2b3c4d5e6'
      }
    },
    responses: {
      Unauthorized: {
        description: '401 — Token ausente o invalido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' }
          }
        }
      },
      Forbidden: {
        description: '403 — Sin el permiso requerido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' }
          }
        }
      },
      NotFound: {
        description: '404 — Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' }
          }
        }
      },
      ValidationError: {
        description: '400 — Error de validacion (body, params o query invalidos)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' }
          }
        }
      }
    },
    parameters: {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/ObjectId' }
      },
      PageQuery: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      SizeQuery: {
        name: 'size',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 20 }
      }
    }
  },
  paths: {
    // -----------------------------------------------------------------------
    // /types (catalogo de tipos; alias /type)
    // -----------------------------------------------------------------------
    '/types': {
      get: {
        tags: ['types'],
        summary: 'Lista tipos. Filtro opcional ?mandatory=true|false.',
        parameters: [
          {
            name: 'mandatory',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtra por tipos obligatorios (true) o no obligatorios (false)'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de tipos (con characteristics pobladas)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      },
      post: {
        tags: ['types'],
        summary: 'Crea un tipo. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'red', 'yellow', 'green', 'mandatory'],
                properties: {
                  name: { type: 'string' },
                  red: { type: 'string' },
                  yellow: { type: 'string' },
                  green: { type: 'string' },
                  mandatory: { type: 'boolean' },
                  extraInfo: { type: 'object' },
                  characteristics: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Tipo creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/types/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['types'],
        summary: 'Obtiene un tipo por id.',
        responses: {
          200: {
            description: 'Tipo encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['types'],
        summary: 'Reemplaza un tipo. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1types/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Tipo actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['types'],
        summary: 'Elimina un tipo. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Tipo eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /ods
    // -----------------------------------------------------------------------
    '/ods': {
      get: {
        tags: ['ods'],
        summary: 'Lista ODS ordenados por order asc.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de ODS',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['ods'],
        summary: 'Crea un ODS.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['number', 'name', 'img'],
                properties: {
                  number: { type: 'integer' },
                  name: { type: 'string' },
                  img: { type: 'string' },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'ODS creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/ods/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['ods'],
        summary: 'Obtiene un ODS por id.',
        responses: {
          200: {
            description: 'ODS encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['ods'],
        summary: 'Reemplaza un ODS.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1ods/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'ODS actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['ods'],
        summary: 'Elimina un ODS.',
        responses: {
          204: { description: 'ODS eliminado' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /rol
    // -----------------------------------------------------------------------
    '/rol': {
      get: {
        tags: ['rol'],
        summary: 'Lista roles.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de roles',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['rol'],
        summary: 'Crea un rol.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  code: { type: 'string' },
                  slug: { type: 'string' },
                  order: { type: 'integer' },
                  permissions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Rol creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/rol/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['rol'],
        summary: 'Obtiene un rol por id.',
        responses: {
          200: {
            description: 'Rol encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['rol'],
        summary: 'Reemplaza un rol.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1rol/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Rol actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['rol'],
        summary: 'Elimina un rol.',
        responses: {
          204: { description: 'Rol eliminado' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /me
    // -----------------------------------------------------------------------
    '/me': {
      get: {
        tags: ['me'],
        summary: 'Devuelve el usuario autenticado (sin password, con rol y gad poblados).',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Usuario autenticado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /users
    // -----------------------------------------------------------------------
    '/users': {
      get: {
        tags: ['users'],
        summary:
          'Lista usuarios por tenant (header `tenant` o ?tenant=). Requiere autenticacion.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'tenant',
            in: 'query',
            schema: { type: 'string' },
            description: 'GAD id (alternativa al header `tenant`)'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de usuarios del tenant',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        tags: ['users'],
        summary: 'Crea un usuario. Requiere permiso `user:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'rol', 'gadId'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  rol: { type: 'string' },
                  gadId: { type: 'string' },
                  image: { type: 'string' },
                  state: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuario creado (sin campo password en la respuesta)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/users/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['users'],
        summary: 'Obtiene un usuario por id. Requiere autenticacion.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Usuario encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['users'],
        summary: 'Reemplaza un usuario. Requiere permiso `user:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  rol: { type: 'string' },
                  gadId: { type: 'string' },
                  image: { type: 'string' },
                  state: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Usuario actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['users'],
        summary: 'Elimina un usuario. Requiere permiso `user:manage`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Usuario eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /commit
    // -----------------------------------------------------------------------
    '/commit': {
      get: {
        tags: ['commit'],
        summary: 'Lista commits.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de commits',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['commit'],
        summary: 'Crea un commit.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['body', 'author'],
                properties: {
                  body: { type: 'string' },
                  author: { $ref: '#/components/schemas/ObjectId' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Commit creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/commit/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['commit'],
        summary: 'Obtiene un commit por id.',
        responses: {
          200: {
            description: 'Commit encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['commit'],
        summary: 'Reemplaza un commit.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1commit/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Commit actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['commit'],
        summary: 'Elimina un commit.',
        responses: {
          204: { description: 'Commit eliminado' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /valuation
    // -----------------------------------------------------------------------
    '/valuation': {
      get: {
        tags: ['valuation'],
        summary: 'Lista valuaciones ordenadas por order asc.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de valuaciones',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['valuation'],
        summary: 'Crea una valuacion.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category', 'maxValue'],
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  maxValue: { type: 'number' },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Valuacion creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/valuation/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['valuation'],
        summary: 'Obtiene una valuacion por id.',
        responses: {
          200: {
            description: 'Valuacion encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['valuation'],
        summary: 'Reemplaza una valuacion.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1valuation/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Valuacion actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['valuation'],
        summary: 'Elimina una valuacion.',
        responses: {
          204: { description: 'Valuacion eliminada' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /notifications
    // -----------------------------------------------------------------------
    '/notifications': {
      get: {
        tags: ['notifications'],
        summary: 'Lista notificaciones. Filtros: ?sendTo=, ?state=.',
        parameters: [
          {
            name: 'sendTo',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra notificaciones por destinatario (userId)'
          },
          {
            name: 'state',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filtra por estado numerico (0 = no leida, 1 = leida)'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de notificaciones',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['notifications'],
        summary: 'Crea una notificacion. Acepta etiquetas (action/entityType) o numericos (type/itemType).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content', 'state'],
                properties: {
                  content: { type: 'string' },
                  state: { type: 'integer' },
                  type: { type: 'integer' },
                  action: {
                    type: 'string',
                    enum: ['added', 'modified', 'deleted'],
                    description: 'Alternativa etiquetada a `type` numerico'
                  },
                  from: { $ref: '#/components/schemas/ObjectId' },
                  sendTo: { $ref: '#/components/schemas/ObjectId' },
                  itemType: { type: 'integer' },
                  entityType: {
                    type: 'string',
                    enum: ['indicator', 'subindicator', 'evidence'],
                    description: 'Alternativa etiquetada a `itemType` numerico'
                  },
                  itemID: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Notificacion creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/notifications/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['notifications'],
        summary: 'Obtiene una notificacion por id.',
        responses: {
          200: {
            description: 'Notificacion encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['notifications'],
        summary: 'Reemplaza una notificacion.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1notifications/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Notificacion actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['notifications'],
        summary: 'Elimina una notificacion.',
        responses: {
          204: { description: 'Notificacion eliminada' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /news
    // -----------------------------------------------------------------------
    '/news': {
      get: {
        tags: ['news'],
        summary: 'Lista noticias. Filtro opcional ?gad=.',
        parameters: [
          {
            name: 'gad',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra por GAD'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de noticias',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['news'],
        summary: 'Crea una noticia.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['image', 'title', 'description', 'author', 'gad'],
                properties: {
                  image: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  tag: { type: 'array', items: { type: 'string' } },
                  author: { $ref: '#/components/schemas/ObjectId' },
                  gad: { $ref: '#/components/schemas/ObjectId' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Noticia creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/news/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['news'],
        summary: 'Obtiene una noticia por id.',
        responses: {
          200: {
            description: 'Noticia encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['news'],
        summary: 'Reemplaza una noticia.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1news/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Noticia actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['news'],
        summary: 'Elimina una noticia.',
        responses: {
          204: { description: 'Noticia eliminada' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /rubric
    // -----------------------------------------------------------------------
    '/rubric': {
      get: {
        tags: ['rubric'],
        summary: 'Lista rubrics.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de rubrics',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['rubric'],
        summary: 'Crea una rubric.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['valuation', 'qualification', 'evidence'],
                properties: {
                  valuation: { $ref: '#/components/schemas/ObjectId' },
                  qualification: { type: 'number' },
                  evidence: { $ref: '#/components/schemas/ObjectId' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Rubric creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/rubric/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['rubric'],
        summary: 'Obtiene una rubric por id.',
        responses: {
          200: {
            description: 'Rubric encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['rubric'],
        summary: 'Reemplaza una rubric.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1rubric/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Rubric actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['rubric'],
        summary: 'Elimina una rubric.',
        responses: {
          204: { description: 'Rubric eliminada' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /sponsors
    // -----------------------------------------------------------------------
    '/sponsors': {
      get: {
        tags: ['sponsors'],
        summary: 'Lista sponsors. Filtro opcional ?gad=.',
        parameters: [
          {
            name: 'gad',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra por GAD'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de sponsors',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['sponsors'],
        summary: 'Crea un sponsor.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'gad', 'image', 'state'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  gad: { $ref: '#/components/schemas/ObjectId' },
                  image: { type: 'string' },
                  state: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Sponsor creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/sponsors/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['sponsors'],
        summary: 'Obtiene un sponsor por id.',
        responses: {
          200: {
            description: 'Sponsor encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['sponsors'],
        summary: 'Reemplaza un sponsor.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1sponsors/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Sponsor actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['sponsors'],
        summary: 'Elimina un sponsor.',
        responses: {
          204: { description: 'Sponsor eliminado' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /gad
    // -----------------------------------------------------------------------
    '/gad': {
      get: {
        tags: ['gad'],
        summary: 'Lista GADs.',
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de GADs',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['gad'],
        summary: 'Crea un GAD. Requiere permiso `gad:config`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'city', 'country', 'size'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  city: { type: 'string' },
                  country: { type: 'string' },
                  size: { type: 'number' },
                  publishAuto: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'GAD creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/gad/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['gad'],
        summary: 'Obtiene un GAD por id.',
        responses: {
          200: {
            description: 'GAD encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['gad'],
        summary: 'Reemplaza un GAD. Requiere permiso `gad:config`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'city', 'country', 'size'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  city: { type: 'string' },
                  country: { type: 'string' },
                  size: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'GAD actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['gad'],
        summary: 'Elimina un GAD. Requiere permiso `gad:config`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'GAD eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/gad/{id}/reports': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['gad'],
        summary: 'Lista los reportes de un GAD.',
        responses: {
          200: {
            description: 'Reports del GAD',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      post: {
        tags: ['gad'],
        summary: 'Agrega un reporte al GAD. Requiere permiso `gad:config`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source', 'period', 'info'],
                properties: {
                  source: { type: 'string' },
                  period: { type: 'string' },
                  info: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        data: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Reporte agregado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/gad/{id}/config': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      put: {
        tags: ['gad'],
        summary: 'Actualiza la configuracion del GAD. Requiere permiso `gad:config`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reportDefault', 'publishAuto'],
                properties: {
                  reportDefault: { $ref: '#/components/schemas/ObjectId' },
                  publishAuto: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Config actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /periods
    // -----------------------------------------------------------------------
    '/periods': {
      get: {
        tags: ['periods'],
        summary: 'Lista periodos del tenant. Requiere autenticacion. ?tenant= o header `tenant`.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'tenant',
            in: 'query',
            schema: { type: 'string' },
            description: 'GAD id (alternativa al header `tenant`)'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de periodos',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        tags: ['periods'],
        summary:
          'Crea un periodo. Requiere rol elevado (no ROL_USER). ' +
          'Con ?clone=true clona instancias de indicadores/subindicadores del periodo anterior.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'tenant',
            in: 'query',
            schema: { type: 'string' },
            description: 'GAD id (alternativa al header `tenant`)'
          },
          {
            name: 'clone',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Si true, clona el grafo de indicadores del periodo anterior'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['year'],
                properties: {
                  year: { type: 'string', example: '2024' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Periodo creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/periods/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['periods'],
        summary: 'Obtiene un periodo por id. Requiere autenticacion.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Periodo encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['periods'],
        summary: 'Elimina un periodo. Requiere rol elevado.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Periodo eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /characteristics
    // -----------------------------------------------------------------------
    '/characteristics': {
      get: {
        tags: ['characteristics'],
        summary: 'Lista caracteristicas. Filtro opcional ?type=<typeId>.',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra por tipo (typeId)'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de caracteristicas',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['characteristics'],
        summary: 'Crea una caracteristica. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'group', 'groupName', 'tier', 'valuations', 'allowedFormats'],
                properties: {
                  name: { type: 'string' },
                  group: { type: 'string' },
                  groupName: { type: 'string' },
                  score: { type: 'number' },
                  help: { type: 'string' },
                  isRequired: { type: 'boolean' },
                  required: { type: 'boolean' },
                  tier: { type: 'number' },
                  unique: { type: 'boolean' },
                  parts: { type: 'array', items: { type: 'string' } },
                  valuations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  allowedFormats: { type: 'array', items: { type: 'string' } },
                  inputKind: { type: 'string', enum: ['file', 'link'] },
                  isCover: { type: 'boolean' },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Caracteristica creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/characteristics/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['characteristics'],
        summary: 'Obtiene una caracteristica por id (con valuaciones pobladas).',
        responses: {
          200: {
            description: 'Caracteristica encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['characteristics'],
        summary: 'Reemplaza una caracteristica. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'group', 'groupName', 'required', 'tier', 'isRequired', 'unique'],
                properties: {
                  name: { type: 'string' },
                  group: { type: 'string' },
                  groupName: { type: 'string' },
                  required: { type: 'boolean' },
                  score: { type: 'number' },
                  tier: { type: 'number' },
                  isRequired: { type: 'boolean' },
                  unique: { type: 'boolean' },
                  inputKind: { type: 'string', enum: ['file', 'link'] },
                  isCover: { type: 'boolean' },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Caracteristica actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['characteristics'],
        summary: 'Elimina una caracteristica. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Caracteristica eliminada' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/characteristics/{id}/valuation': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['characteristics'],
        summary: 'Actualiza valuaciones de la caracteristica. Requiere permiso `rubric:configure`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['valuations'],
                properties: {
                  valuations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Valuaciones actualizadas',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/characteristics/{id}/inputKind': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['characteristics'],
        summary: 'Actualiza el tipo de entrada. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['inputKind'],
                properties: {
                  inputKind: { type: 'string', enum: ['file', 'link'] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'inputKind actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/characteristics/{id}/format': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['characteristics'],
        summary: 'Agrega un formato permitido. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['format'],
                properties: { format: { type: 'string', example: 'pdf' } }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Formato actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/characteristics/{id}/extras': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['characteristics'],
        summary: 'Actualiza extras de la caracteristica. Requiere permiso `catalog:manage`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['extras'],
                properties: { extras: { type: 'object' } }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Extras actualizados',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /subindicators
    // -----------------------------------------------------------------------
    '/subindicators': {
      get: {
        tags: ['subindicators'],
        summary:
          'Lista subindicadores. Filtros: ?indicator=<instanceId>, ' +
          '?type=general (mandatory=true) | specific (mandatory=false).',
        parameters: [
          {
            name: 'indicator',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra por indicator instance id'
          },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['general', 'specific'] },
            description:
              'Filtra por tipo de subindicador (mandatory). ' +
              'Requiere ?indicator= cuando se usa con agregados.'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de subindicadores',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      },
      post: {
        tags: ['subindicators'],
        summary: 'Crea un subindicador. Requiere permiso `subindicator:create`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['indicatorInstanceId', 'typeId', 'name'],
                properties: {
                  indicatorInstanceId: { $ref: '#/components/schemas/ObjectId' },
                  typeId: { $ref: '#/components/schemas/ObjectId' },
                  name: { type: 'string' },
                  responsibleText: { type: 'string' },
                  responsibleUserIds: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  qualification: { type: 'number' },
                  requireCover: { type: 'boolean' },
                  cover: { type: 'string' },
                  observationCover: { type: 'string' },
                  isPlanned: { type: 'boolean' },
                  isDiagnosed: { type: 'boolean' },
                  commits: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  evidences: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Subindicador creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/subindicators/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['subindicators'],
        summary: 'Obtiene un subindicador por id (populate profundo).',
        responses: {
          200: {
            description: 'Subindicador encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['subindicators'],
        summary: 'Actualiza un subindicador. Requiere permiso `subindicator:create`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  responsibleText: { type: 'string' },
                  responsibleUserIds: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  typeId: { $ref: '#/components/schemas/ObjectId' },
                  commits: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  },
                  evidences: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Subindicador actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['subindicators'],
        summary: 'Elimina un subindicador. Requiere permiso `subindicator:create`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Subindicador eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /subindicators/:subindicatorId/assessments (assessments anidados)
    // -----------------------------------------------------------------------
    '/subindicators/{subindicatorId}/assessments': {
      parameters: [
        {
          name: 'subindicatorId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/ObjectId' }
        }
      ],
      get: {
        tags: ['assessments'],
        summary:
          'Lista los assessments (CharacteristicAssessmentV2) de un subindicador. ' +
          'La rubrica es por caracteristica; el assessment se crea/actualiza via ' +
          'PUT /evidences/:id/qualify.',
        responses: {
          200: {
            description: 'Lista de assessments del subindicador',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/subindicators/{subindicatorId}/assessments/{characteristicId}': {
      parameters: [
        {
          name: 'subindicatorId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/ObjectId' }
        },
        {
          name: 'characteristicId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/ObjectId' }
        }
      ],
      get: {
        tags: ['assessments'],
        summary: 'Obtiene el assessment de un par (subindicadorId, caracteristicaId).',
        responses: {
          200: {
            description: 'Assessment encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /evidences
    // -----------------------------------------------------------------------
    '/evidences': {
      get: {
        tags: ['evidences'],
        summary:
          'Lista evidencias. Filtros: ?subindicator=<id>, ?characteristic=<id>.',
        parameters: [
          {
            name: 'subindicator',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' }
          },
          {
            name: 'characteristic',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' }
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de evidencias',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['evidences'],
        summary:
          'Sube una evidencia. Requiere permiso `evidence:upload`. ' +
          'El campo `author` se toma del token (no del body).',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['characteristicId', 'subindicatorId', 'name'],
                properties: {
                  characteristicId: { $ref: '#/components/schemas/ObjectId' },
                  subindicatorId: { $ref: '#/components/schemas/ObjectId' },
                  name: { type: 'string' },
                  link: {
                    type: 'string',
                    description: 'Requerido si sourceId no se provee'
                  },
                  note: { type: 'string' },
                  kind: {
                    type: 'string',
                    enum: ['principal', 'complementaria'],
                    default: 'principal'
                  },
                  sourceId: {
                    $ref: '#/components/schemas/ObjectId',
                    description: 'Fuente POA del catalogo. Alternativa a link.'
                  },
                  pages: { type: 'string' },
                  extras: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Evidencia creada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/evidences/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['evidences'],
        summary: 'Obtiene una evidencia por id (con autor y fuente poblados).',
        responses: {
          200: {
            description: 'Evidencia encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['evidences'],
        summary: 'Actualiza metadatos de una evidencia. Requiere permiso `evidence:upload`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  link: { type: 'string' },
                  note: { type: 'string' },
                  kind: { type: 'string', enum: ['principal', 'complementaria'] },
                  pages: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Evidencia actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['evidences'],
        summary:
          'Elimina una evidencia. Requiere permiso `evidence:qualify`. ' +
          'Recomputa el semaforo del subindicador asociado.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Evidencia eliminada' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/evidences/{id}/qualify': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      put: {
        tags: ['evidences'],
        summary:
          'Califica una evidencia (crea/actualiza el CharacteristicAssessmentV2 del par). ' +
          'Requiere permiso `evidence:qualify`. ' +
          'Segregacion: el autor de la evidencia no puede calificarla (403). ' +
          'Los pesos se cargan desde ValuationV2.maxValue; el campo `weight` del body se ignora.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['criteria'],
                properties: {
                  criteria: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['valuationId', 'met'],
                      properties: {
                        valuationId: { $ref: '#/components/schemas/ObjectId' },
                        met: { type: 'boolean' },
                        weight: {
                          type: 'number',
                          description: 'Ignorado; el peso se toma de ValuationV2.maxValue'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Assessment actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/evidences/{id}/publish': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['evidences'],
        summary:
          'Publica/despublica una evidencia (set verified). ' +
          'Requiere permiso `evidence:publish`. ' +
          'Actualiza el semaforo del subindicador asociado.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['verified'],
                properties: {
                  verified: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Evidencia publicada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /indicator-instances
    // -----------------------------------------------------------------------
    '/indicator-instances': {
      get: {
        tags: ['indicator-instances'],
        summary:
          'Lista instancias de indicadores. Filtros: ?tenant=, ?period=<year>, ?quadrant=. ' +
          'Sin tenant devuelve todo (poblado). Con tenant+period filtra por GAD/ano.',
        parameters: [
          {
            name: 'tenant',
            in: 'query',
            schema: { type: 'string' },
            description: 'GAD id (alternativa al header `tenant`)'
          },
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string' },
            description: 'Ano del periodo (ej. "2024")'
          },
          {
            name: 'quadrant',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 4 },
            description: 'Filtra por cuadrante (1-4)'
          }
        ],
        responses: {
          200: {
            description: 'Lista de instancias de indicadores',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/indicator-instances/summary': {
      get: {
        tags: ['indicator-instances'],
        summary:
          'Resumen por cuadrante (1..4) con conteos qualify_0..qualify_3. ' +
          'Requiere ?period= y tenant.',
        parameters: [
          {
            name: 'tenant',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'GAD id (alternativa al header `tenant`)'
          },
          {
            name: 'period',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Resumen por cuadrante',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/indicator-instances/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['indicator-instances'],
        summary: 'Obtiene una instancia de indicador por id (populate profundo).',
        responses: {
          200: {
            description: 'Instancia encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['indicator-instances'],
        summary: 'Actualiza la lista de subindicadores de una instancia. Requiere permiso `indicator:create`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subindicators'],
                properties: {
                  subindicators: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ObjectId' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Instancia actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['indicator-instances'],
        summary: 'Elimina una instancia de indicador. Requiere permiso `indicator:create`.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Instancia eliminada' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /indicators (catalogo de indicadores)
    // -----------------------------------------------------------------------
    '/indicators': {
      get: {
        tags: ['indicators'],
        summary: 'Lista indicadores del catalogo. Filtro ?quadrant=. Ordenado por order asc.',
        parameters: [
          {
            name: 'quadrant',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Filtra por cuadrante'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de indicadores',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['indicators'],
        summary: 'Crea un indicador.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'name', 'description', 'number', 'quadrant',
                  'quadrantName', 'red', 'yellow', 'green'
                ],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  number: { type: 'integer' },
                  quadrant: { type: 'integer' },
                  quadrantName: { type: 'string' },
                  red: { type: 'string' },
                  yellow: { type: 'string' },
                  green: { type: 'string' },
                  ods: { type: 'array', items: { type: 'string' } },
                  slug: { type: 'string' },
                  order: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Indicador creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' }
        }
      }
    },
    '/indicators/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['indicators'],
        summary: 'Obtiene un indicador por id.',
        responses: {
          200: {
            description: 'Indicador encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['indicators'],
        summary: 'Reemplaza un indicador.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/paths/~1indicators/post/requestBody/content/application~1json/schema' }
            }
          }
        },
        responses: {
          200: {
            description: 'Indicador actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['indicators'],
        summary: 'Elimina un indicador.',
        responses: {
          204: { description: 'Indicador eliminado' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /config
    // -----------------------------------------------------------------------
    '/config/semaphore': {
      get: {
        tags: ['config'],
        summary:
          'Devuelve la escala de semaforo unica (0-3). Publico, sin auth. ' +
          'Respuesta: { data: { scale: [{value, key, label, color}], note } }',
        responses: {
          200: {
            description: 'Escala de semaforo',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /audit-log
    // -----------------------------------------------------------------------
    '/audit-log': {
      get: {
        tags: ['audit-log'],
        summary:
          'Lista el registro de auditoria (solo lectura, append-only). ' +
          'Requiere permiso `user:manage`. ' +
          'Filtros: ?entityType=, ?action=.',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'entityType',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra por tipo de entidad (p.ej. "evidence", "user")'
          },
          {
            name: 'action',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra por accion (p.ej. "user.create", "evidence.qualify")'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Entradas del log de auditoria',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    // -----------------------------------------------------------------------
    // /source-documents
    // -----------------------------------------------------------------------
    '/source-documents': {
      get: {
        tags: ['source-documents'],
        summary: 'Lista documentos fuente POA. Filtros: ?gad=, ?period=, ?year=.',
        parameters: [
          {
            name: 'gad',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra por GAD'
          },
          {
            name: 'period',
            in: 'query',
            schema: { $ref: '#/components/schemas/ObjectId' },
            description: 'Filtra por periodo'
          },
          {
            name: 'year',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra por ano'
          },
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/SizeQuery' }
        ],
        responses: {
          200: {
            description: 'Lista de documentos fuente',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          }
        }
      },
      post: {
        tags: ['source-documents'],
        summary: 'Crea un documento fuente. Requiere permiso `evidence:upload`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gadId', 'name', 'link'],
                properties: {
                  gadId: { $ref: '#/components/schemas/ObjectId' },
                  periodId: { $ref: '#/components/schemas/ObjectId' },
                  year: { type: 'string' },
                  name: { type: 'string' },
                  link: { type: 'string' },
                  kind: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Documento fuente creado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/source-documents/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['source-documents'],
        summary: 'Obtiene un documento fuente por id.',
        responses: {
          200: {
            description: 'Documento fuente encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['source-documents'],
        summary: 'Actualiza metadatos del documento. Requiere permiso `evidence:upload`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  link: { type: 'string' },
                  kind: { type: 'string' },
                  year: { type: 'string' },
                  periodId: { $ref: '#/components/schemas/ObjectId' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Documento actualizado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['source-documents'],
        summary:
          'Elimina un documento fuente. Requiere permiso `evidence:upload`. ' +
          'Desverifica las evidencias que referencian el documento antes de borrar.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'Documento eliminado' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/source-documents/{id}/verify': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      patch: {
        tags: ['source-documents'],
        summary:
          'Publica/despublica un documento fuente y propaga el estado verified ' +
          'a las evidencias asociadas (salvo las con override de caracteristica). ' +
          'Requiere permiso `evidence:publish`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['verified'],
                properties: { verified: { type: 'boolean' } }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Documento fuente verificado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } }
            }
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    }
  },
  tags: [
    { name: 'types', description: 'Catalogo de tipos (general/specific, mandatory)' },
    { name: 'ods', description: 'Catalogo de ODS (Objetivos de Desarrollo Sostenible)' },
    { name: 'rol', description: 'Roles con permisos atomicos' },
    { name: 'me', description: 'Perfil del usuario autenticado' },
    { name: 'users', description: 'Gestion de usuarios por GAD' },
    { name: 'commit', description: 'Compromisos' },
    { name: 'valuation', description: 'Criterios de valuacion (rubrica)' },
    { name: 'notifications', description: 'Notificaciones con soporte de etiquetas semanticas' },
    { name: 'news', description: 'Noticias por GAD' },
    { name: 'rubric', description: 'Rubric (asociacion valuacion-evidencia)' },
    { name: 'sponsors', description: 'Patrocinadores por GAD' },
    { name: 'gad', description: 'Gobiernos Autónomos Descentralizados' },
    { name: 'periods', description: 'Periodos anuales del GAD' },
    { name: 'characteristics', description: 'Caracteristicas del catalogo ISO 18091' },
    { name: 'subindicators', description: 'Subindicadores de una instancia de indicador' },
    { name: 'assessments', description: 'Assessments de caracteristica por subindicador (solo lectura directa)' },
    { name: 'evidences', description: 'Evidencias con calificacion y publicacion' },
    { name: 'indicator-instances', description: 'Instancias de indicadores por GAD/periodo' },
    { name: 'indicators', description: 'Catalogo de indicadores ISO 18091' },
    { name: 'config', description: 'Configuracion de presentacion (semaforo)' },
    { name: 'audit-log', description: 'Registro de auditoria immutable (ISO trazabilidad)' },
    {
      name: 'source-documents',
      description: 'Biblioteca de documentos POA reutilizables como fuentes de evidencia'
    }
  ]
}

export default spec
