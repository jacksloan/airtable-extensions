import { OpenAPIV3 } from 'openapi-types';
import { GenericAirtableSpec } from './model';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiComponentSchemas(
  openapi: OpenAPIV3.Document,
  airtableEntityModel: GenericAirtableSpec[string],
  tableName: string
): void {
  const name = getEntityName(tableName).simpleName();
  const arrayName = getEntityName(tableName).arrayName();
  const propsEnum = getEntityName(tableName).propertyEnumsName();
  openapi.components.schemas[name] = {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'integer',
      },
      ...Object.entries(airtableEntityModel).reduce((acc, curr) => {
        const [key, propertyType] = curr;
        acc[key] = { type: propertyType };
        return acc;
      }, {}),
    },
  };
  openapi.components.schemas[arrayName] = {
    type: 'array',
    items: {
      $ref: `#/components/schemas/${name}`,
    },
  };
  openapi.components.schemas[propsEnum] = {
    type: 'string',
    enum: Object.keys(airtableEntityModel),
  };
}
