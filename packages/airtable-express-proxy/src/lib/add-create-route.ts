import type { Express } from 'express';
import { AirtableApi } from 'jbs-airtable-api-extensions';

export function addCreateRoute(
  expressApp: Express,
  airtable: AirtableApi<any>,
  basePath: string,
  tableName: string
) {
  expressApp.post(`${basePath}`, (req, res) => {
    const record = req.body;
    airtable[tableName].create(record).then((value) => res.send(value));
  });
}
