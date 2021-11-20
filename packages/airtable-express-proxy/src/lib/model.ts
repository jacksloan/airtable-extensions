export interface GenericAirtableSpec {
  // tableName
  [k: string]: {
    // fieldName
    [k: string]: 'string' | 'boolean' | 'number';
  };
}
