import { OpenAPIV3 } from 'openapi-types';
import { GenericAirtableSpec } from './model';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiComponentSchemas(
  openapi: OpenAPIV3.Document,
  airtableSpec: GenericAirtableSpec,
  tableName: string
): void {
  openapi.components.schemas[getEntityName(tableName)] = {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
      },
      ...Object.entries(airtableSpec[tableName]).reduce((acc, curr) => {
        const [key, propertyType] = curr;
        acc[key] = { type: propertyType };
        return acc;
      }, {}),
    },
  };
  openapi.components.schemas[getEntityName(tableName, true)] = {
    type: 'array',
    items: {
      $ref: `#/components/schemas/${getEntityName(tableName)}`,
    },
  };
}
