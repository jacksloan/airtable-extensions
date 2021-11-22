import type { Express } from 'express';
import { AirtableApi } from 'jbs-airtable-api-extensions';

export function addUpdateRoute(
  expressApp: Express,
  airtable: AirtableApi<any>,
  basePath: string,
  tableName: string
) {
  expressApp.put(`${basePath}/:recordId`, (req, res) => {
    const { recordId } = req.params;
    const record = req.body;
    if (recordId !== record.id) {
      res
        .status(400)
        .send(
          `400 - malformed request. Path variable recordId ${recordId} must match request body record.id ${record.id}`
        );
    }
    airtable[tableName].update(record).then((value) => res.send(value));
  });
}
