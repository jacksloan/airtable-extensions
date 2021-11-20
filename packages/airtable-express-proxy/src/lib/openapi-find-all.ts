import { OpenAPIV3 } from 'openapi-types';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiFindAllPath(
  openapi: OpenAPIV3.Document,
  path: string,
  tableName: string
) {
  const findAllPathObject: OpenAPIV3.PathItemObject = {
    get: {
      summary: `List all ${tableName}`,
      operationId: `findAll${tableName}`,
      tags: [tableName],
      responses: {
        '200': {
          description: `An array of all ${tableName}`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${getEntityName(tableName, true)}`,
              },
            },
          },
        },
      },
    },
  };
  const previous = openapi.paths[path] || {};
  openapi.paths[path] = { ...previous, ...findAllPathObject };
}
