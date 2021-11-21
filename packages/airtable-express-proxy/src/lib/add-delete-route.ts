import type { Express } from 'express';
import type { AirtableApi } from 'jbs-airtable-api-extensions';

export function addDeleteRoute(
  expressApp: Express,
  airtable: AirtableApi<any>,
  basePath: string,
  tableName: string
) {
  expressApp.delete(`${basePath}/:recordId`, (req, res) => {
    const { recordId } = req.params;
    airtable[tableName].delete(recordId).then(() => res.status(204).send());
  });
}
