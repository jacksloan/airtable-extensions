import { OpenAPIV3 } from 'openapi-types';
import { AirtableOptions } from 'packages/airtable-api/src/lib/airtable-api';
import { GenericAirtableSpec } from './model';
import { getEntityName } from './openapi-get-entity-name';

export function addOpenApiFindAllPath(
  openapi: OpenAPIV3.Document,
  path: string,
  tableName: string,
  entityModel: GenericAirtableSpec[string]
) {
  const findAllPathObject: OpenAPIV3.PathItemObject = {
    get: {
      summary: `List all ${tableName}`,
      operationId: `findAll${tableName}`,
      tags: [tableName],
      parameters: <
        ((OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject) & {
          name: keyof AirtableOptions<any>;
        })[]
      >[
        {
          in: 'query',
          name: 'fields',
          schema: {
            type: 'array',
            items: {
              $ref: `#/components/schemas/${getEntityName(
                tableName
              ).propertyEnumsName()}`,
            },
          },
        },
        {
          in: 'query',
          name: 'sort',
          required: false,
          style: 'deepObject',
          schema: {
            type: 'object',
            explode: false,
            properties: {
              ...Object.keys(entityModel).reduce(
                (acc, curr) => ({
                  ...acc,
                  [curr]: {
                    $ref: '#/components/schemas/SortDirection',
                  },
                }),
                {}
              ),
            },
          },
        },
        {
          in: 'query',
          name: 'filterByFormula',
          schema: {
            type: 'string',
          },
        },
        {
          in: 'query',
          name: 'cellFormat',
          schema: {
            $ref: '#/components/schemas/CellFormat',
          },
        },
        {
          in: 'query',
          name: 'maxRecords',
          schema: {
            type: 'integer',
          },
        },
        {
          in: 'query',
          name: 'pageSize',
          schema: {
            type: 'integer',
          },
        },
        {
          in: 'query',
          name: 'timeZone',
          schema: {
            type: 'string',
          },
        },
        {
          in: 'query',
          name: 'userLocale',
          schema: {
            type: 'string',
          },
        },
        {
          in: 'query',
          name: 'view',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '200': {
          description: `An array of all ${tableName}`,
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
  const previous = openapi.paths[path] || {};
  openapi.paths[path] = { ...previous, ...findAllPathObject };
}
