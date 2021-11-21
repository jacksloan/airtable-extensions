import type { Express } from 'express';
import { AirtableApi } from 'jbs-airtable-api-extensions';

export function addFindByIdRoute(
  expressApp: Express,
  airtable: AirtableApi<any>,
  baseBase: string,
  tableName: string
) {
  expressApp.get(`${baseBase}/:recordId`, (req, res) => {
    const { recordId } = req.params;
    airtable[tableName].findById(recordId).then((value) => res.send(value));
  });
}
