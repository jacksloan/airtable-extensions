import bodyParser from 'body-parser';
import type { Express } from 'express';
import { createApi } from 'jbs-airtable-api-extensions';
import type { OpenAPIV3 } from 'openapi-types';
import * as swaggerUi from 'swagger-ui-express';
import { addCreateRoute } from './lib/add-create-route';
import { addDeleteRoute } from './lib/add-delete-route';
import { addFindAllRoute } from './lib/add-find-all-route';
import { addFindByIdRoute } from './lib/add-find-by-id-route';
import { addUpdateRoute } from './lib/add-update-route.ts';
import { GenericAirtableSpec } from './lib/model';
import { addOpenApiComponentSchemas } from './lib/openapi-component-schema';
import { addOpenApiCreatePath } from './lib/openapi-create';
import { addOpenApiDeletePath } from './lib/openapi-delete';
import { addOpenApiFindAllPath } from './lib/openapi-find-all';
import { addOpenApiFindByIdPath } from './lib/openapi-find-by-id';
import { addOpenApiUpdatePath } from './lib/openapi-update';

export function createAirtableProxyRoutes(
  expressApp: Express,
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

  expressApp.use(bodyParser.json());

  const openapi: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: openapiInfo,
    paths: {},
    components: {
      schemas: {
        SortDirection: {
          type: 'string',
          enum: ['asc', 'desc'],
        },
        CellFormat: {
          type: 'string',
          enum: ['json', 'string'],
        },
      },
    },
  };

  const prefix = config.globalRoutePrefix || '';

  Object.keys(config.airtableSpec).forEach((tableName) => {
    // TODO - SECURITY! return 403 forbidden by default
    // make required auth/login middleware as part of config

    const entityModel = config.airtableSpec[tableName];
    addOpenApiComponentSchemas(openapi, entityModel, tableName);

    const basePath = `${prefix}/${tableName}`;

    // find all
    addOpenApiFindAllPath(openapi, basePath, tableName, entityModel);
    addFindAllRoute(expressApp, airtable, basePath, tableName);

    // find one
    addOpenApiFindByIdPath(openapi, basePath, tableName);
    addFindByIdRoute(expressApp, airtable, basePath, tableName);

    // update
    addOpenApiUpdatePath(openapi, basePath, tableName);
    addUpdateRoute(expressApp, airtable, basePath, tableName);

    // delete
    addOpenApiDeletePath(openapi, basePath, tableName);
    addDeleteRoute(expressApp, airtable, basePath, tableName);

    // create
    addOpenApiCreatePath(openapi, basePath, tableName);
    addCreateRoute(expressApp, airtable, basePath, tableName);
  });

  expressApp.use('/api', swaggerUi.serve, swaggerUi.setup(openapi));
  expressApp.get('/openapi', (req, res) => res.send(openapi));

  return openapi;
}
