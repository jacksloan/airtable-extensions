import type { Express } from 'express';
import { createApi } from 'jbs-airtable-api-extensions';
import type { OpenAPIV3 } from 'openapi-types';
import * as swaggerUi from 'swagger-ui-express';
import { addFindAllRoute } from './add-find-all-route';
import { addFindByIdRoute } from './add-find-by-id-route';
import { GenericAirtableSpec } from './model';
import { addOpenApiComponentSchemas } from './openapi-component-schema';
import { addOpenApiFindAllPath } from './openapi-find-all';
import { addOpenApiFindByIdPath } from './openapi-find-by-id';

export function addAirtableRoutes(
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
    // TODO - make required auth/login middleware as part of config
    // TODO - create endpoints
    // TODO - update endpoints

    const entityModel = config.airtableSpec[tableName];
    addOpenApiComponentSchemas(openapi, entityModel, tableName);

    const findAllPath = `${prefix}/${tableName}`;
    addOpenApiFindAllPath(openapi, findAllPath, tableName, entityModel);
    addFindAllRoute(expressApp, airtable, findAllPath, tableName);

    const findByIdPathPrefix = `${prefix}/${tableName}`;
    addOpenApiFindByIdPath(openapi, findByIdPathPrefix, tableName);
    addFindByIdRoute(expressApp, airtable, findByIdPathPrefix, tableName);
  });

  expressApp.use('/api', swaggerUi.serve, swaggerUi.setup(openapi));
  expressApp.get('/openapi', (req, res) => res.send(openapi));

  return openapi;
}
