import { AirtableApi, AirtableOptions } from 'jbs-airtable-api-extensions';
import type { Express } from 'express';

export function addFindAllRoute(
  app: Express,
  airtable: AirtableApi<any>,
  findAllPath: string,
  tableName: string,
) {
  app.get(findAllPath, (req, res) => {
    const query = req.query as Omit<
      AirtableOptions<any>,
      'sort' | 'pageSize' | 'maxRecords'
    > & {
      sort: {
        [k: string]: 'asc' | 'desc';
      };
      maxRecords: string;
      pageSize: string;
    };
    const options: AirtableOptions<any> = {
      ...query,
      sort: Object.entries(query.sort || {}).map(([key, value]) => ({
        field: key,
        direction: value as 'asc' | 'desc',
      })),
      maxRecords: query.maxRecords ? parseInt(query.maxRecords) : null,
      pageSize: query.pageSize ? parseInt(query.pageSize) : null,
    };
    if (options.sort.length < 1) {
      delete options.sort;
    }
    if (!options.maxRecords) {
      delete options.maxRecords;
    }
    if (!options.pageSize) {
      delete options.pageSize;
    }
    airtable[tableName].findAll(options).then((it) => res.send(it));
  });
}
