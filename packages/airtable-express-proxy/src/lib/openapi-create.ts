import { OpenAPIV3 } from 'openapi-types';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiCreatePath(
  openapi: OpenAPIV3.Document,
  pathPrefix: string,
  tableName: string
) {
  const path = `${pathPrefix}`;
  const previous = openapi.paths[path] || {};
  const findByIdPathObject: OpenAPIV3.PathItemObject = {
    post: {
      summary: `Create an array of ${tableName} records`,
      operationId: `create${tableName}`,
      tags: [tableName],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${getEntityName(
                tableName
              ).arrayName()}`,
            },
          },
        },
      },
      responses: {
        '201': {
          description: `${tableName} created successfully`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${getEntityName(
                  tableName
                ).arrayName()}`,
              },
            },
          },
        },
      },
    },
  };
  openapi.paths[path] = { ...previous, ...findByIdPathObject };
}
