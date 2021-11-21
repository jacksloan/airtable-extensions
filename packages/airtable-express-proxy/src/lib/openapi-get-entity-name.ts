export function getEntityName(tableName: string) {
  return {
    simpleName: () => `${titleCaseString(tableName)}`,
    arrayName: () => `${titleCaseString(tableName)}Entity`,
    propertyEnumsName: () => `${titleCaseString(tableName)}Properties`,
  };
}

function titleCaseString(it: string): string {
  const [first, ...rest] = it;
  return [first.toUpperCase(), ...rest].join('');
}
