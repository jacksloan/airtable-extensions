import type { Express } from 'express';
import { createApi } from '@airtable-extensions/airtable-api';

export function addAirtableRoutes(
  app: Express,
  config: {
    globalRoutePrefix?: `/${string}`;
    airtableSpec: {
      // tableName
      [k: string]: {
        // fieldName
        [k: string]: 'string' | 'boolean' | 'number';
      };
    };
    airtableApiKey: string;
    airtableBaseId: string;
  }
): void {
  const airtable = createApi({
    apiKey: config.airtableApiKey,
    baseId: config.airtableBaseId,
    spec: config.airtableSpec,
  });

  const prefix = config.globalRoutePrefix || '';

  Object.keys(config.airtableSpec).forEach((tableName) => {
    // TODO - SECURITY! return 403 forbidden by default
    // TODO - make required auth/login middleware as part of config
    // TODO - create endpoints
    // TODO - update endpoints
    // TODO - swagger and swagger-ui endpoints
    app.get(`${prefix}/${tableName}`, (req, res) => {
      airtable[tableName].findAll().then((it) => res.send(it));
    });

    app.get(`${prefix}/${tableName}/:recordId`, (req, res) => {
      const { recordId } = req.params;
      airtable[tableName].findById(recordId).then((value) => res.send(value));
    });
  });
}
