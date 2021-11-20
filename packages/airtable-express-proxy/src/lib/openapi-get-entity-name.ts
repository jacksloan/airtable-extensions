export function getEntityName(tableName: string, isArray = false) {
  const entityName = `${titleCaseString(tableName)}Entity`;
  return `${entityName}${isArray ? 'Array' : ''}`;
}

function titleCaseString(it: string): string {
  const [first, ...rest] = it;
  return [first.toUpperCase(), ...rest].join('');
}
