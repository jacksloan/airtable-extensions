import { OpenAPIV3 } from 'openapi-types';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiUpdatePath(
  openapi: OpenAPIV3.Document,
  pathPrefix: string,
  tableName: string
) {
  const path = `${pathPrefix}/{recordId}`;
  const previous = openapi.paths[path] || {};
  const componentSchemaName = `#/components/schemas/${getEntityName(
    tableName
  ).simpleName()}`;
  const findByIdPathObject: OpenAPIV3.PathItemObject = {
    put: {
      summary: `Update a ${tableName} record`,
      operationId: `update${tableName}`,
      tags: [tableName],
      parameters: [
        {
          in: 'path',
          name: 'recordId',
          description: 'The unique ID of the airtable record',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: componentSchemaName,
            }
          }
        },
      },
      responses: {
        '201': {
          description: `Update a ${tableName} record`,
          content: {
            'application/json': {
              schema: {
                $ref: componentSchemaName,
              },
            },
          },
        },
      },
    },
  };
  openapi.paths[path] = { ...previous, ...findByIdPathObject };
}
