import { OpenAPIV3 } from 'openapi-types';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiFindByIdPath(
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
                $ref: `#/components/schemas/${getEntityName(
                  tableName
                ).simpleName()}`,
              },
            },
          },
        },
      },
    },
  };
  openapi.paths[path] = { ...previous, ...findByIdPathObject };
}
