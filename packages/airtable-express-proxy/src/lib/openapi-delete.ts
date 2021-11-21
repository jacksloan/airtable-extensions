import { OpenAPIV3 } from 'openapi-types';

export function addOpenApiDeletePath(
  openapi: OpenAPIV3.Document,
  pathPrefix: string,
  tableName: string
) {
  const path = `${pathPrefix}/{recordId}`;
  const previous = openapi.paths[path] || {};
  const findByIdPathObject: OpenAPIV3.PathItemObject = {
    delete: {
      summary: `Delete a ${tableName} record by record Id`,
      operationId: `deleteById${tableName}`,
      tags: [tableName],
      parameters: [
        {
          in: 'path',
          name: 'recordId',
          description: 'The unique ID of the airtable record',
        },
      ],
      responses: {
        '204': {
          description: `Recorded deleted success`,
        },
      },
    },
  };
  openapi.paths[path] = { ...previous, ...findByIdPathObject };
}
