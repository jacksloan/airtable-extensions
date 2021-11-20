import type { Express } from 'express';
import { createApi } from 'jbs-airtable-api-extensions';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import * as swaggerUi from 'swagger-ui-express';

interface GenericAirtableSpec {
  // tableName
  [k: string]: {
    // fieldName
    [k: string]: 'string' | 'boolean' | 'number';
  };
}

export function addAirtableRoutes(
  app: Express,
  config: {
    globalRoutePrefix?: `/${string}`;
    airtableSpec: GenericAirtableSpec;
    airtableApiKey: string;
    airtableBaseId: string;
  },
  openapiInfo: OpenAPIV3.InfoObject = {
    title: 'Airtable Proxy',
    version: '0.0.1',
  }
): OpenAPIV3.Document {
  const airtable = createApi({
    apiKey: config.airtableApiKey,
    baseId: config.airtableBaseId,
    spec: config.airtableSpec,
  });

  const openapi: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: openapiInfo,
    paths: {},
    components: {
      schemas: {},
    },
  };

  const prefix = config.globalRoutePrefix || '';

  Object.keys(config.airtableSpec).forEach((tableName) => {
    // TODO - SECURITY! return 403 forbidden by default
    // TODO - make required auth/login middleware as part of config
    // TODO - create endpoints
    // TODO - update endpoints
    // TODO - swagger and swagger-ui endpoints

    addOpenApiComponentSchemas(openapi, config.airtableSpec, tableName);

    const findAllPath = `${prefix}/${tableName}`;
    addOpenApiFindAllPath(openapi, findAllPath, tableName);
    app.get(findAllPath, (req, res) => {
      airtable[tableName].findAll().then((it) => res.send(it));
    });

    const findByIdPathPrefix = `${prefix}/${tableName}`;
    addOpenApiFindByIdPath(openapi, findByIdPathPrefix, tableName);
    app.get(`${findByIdPathPrefix}/:recordId`, (req, res) => {
      const { recordId } = req.params;
      airtable[tableName].findById(recordId).then((value) => res.send(value));
    });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/openapi', (req, res) => res.send(openapi));

  return openapi;
}

function addOpenApiFindByIdPath(
  openapi: OpenAPIV3.Document,
  pathPrefix: string,
  tableName: string
) {
  const path = `${pathPrefix}/{recordId}`;
  const previous = openapi.paths[path] || {};
  const findByIdPathObject: OpenAPIV3.PathItemObject = {
    get: {
      summary: `Find a ${tableName} record by record Id`,
      operationId: `findById${tableName}`,
      tags: [tableName],
      parameters: [
        {
          in: 'path',
          name: 'recordId',
          description: 'The unique ID of the airtable record',
        },
      ],
      responses: {
        '200': {
          description: `Returns a single ${tableName} record`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${getEntityName(tableName)}`,
              },
            },
          },
        },
      },
    },
  };
  openapi.paths[path] = { ...previous, ...findByIdPathObject };
}

function getEntityName(tableName: string, isArray = false) {
  const entityName = `${titleCaseString(tableName)}Entity`;
  return `${entityName}${isArray ? 'Array' : ''}`;
}

function addOpenApiFindAllPath(
  openapi: OpenAPIV3.Document,
  path: string,
  tableName: string
) {
  const findAllPathObject: OpenAPIV3.PathItemObject = {
    get: {
      summary: `List all ${tableName}`,
      operationId: `findAll${tableName}`,
      tags: [tableName],
      responses: {
        '200': {
          description: `An array of all ${tableName}`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${getEntityName(tableName, true)}`,
              },
            },
          },
        },
      },
    },
  };
  const previous = openapi.paths[path] || {};
  openapi.paths[path] = { ...previous, ...findAllPathObject };
}

function addOpenApiComponentSchemas(
  openapi: OpenAPIV3.Document,
  airtableSpec: GenericAirtableSpec,
  tableName: string
): void {
  openapi.components.schemas[getEntityName(tableName)] = {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
      },
      ...Object.entries(airtableSpec[tableName]).reduce((acc, curr) => {
        const [key, propertyType] = curr;
        acc[key] = { type: propertyType };
        return acc;
      }, {}),
    },
  };
  openapi.components.schemas[getEntityName(tableName, true)] = {
    type: 'array',
    items: {
      $ref: `#/components/schemas/${getEntityName(tableName)}`,
    },
  };
}

function titleCaseString(it: string): string {
  const [first, ...rest] = it;
  return [first.toUpperCase(), ...rest].join('');
}
