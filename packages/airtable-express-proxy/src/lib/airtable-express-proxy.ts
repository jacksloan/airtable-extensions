import type { Express } from 'express';
import { createApi } from 'jbs-airtable-api-extensions';
import type { OpenAPIV3 } from 'openapi-types';
import * as swaggerUi from 'swagger-ui-express';
import { GenericAirtableSpec } from './model';
import { addOpenApiComponentSchemas } from './openapi-component-schema';
import { addOpenApiFindAllPath } from './openapi-find-all';
import { addOpenApiFindByIdPath } from './openapi-find-by-id';

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
