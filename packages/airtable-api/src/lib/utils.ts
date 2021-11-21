export function omit<T, K extends string>(object: T, removeKey: K): Omit<T, K> {
  return (
    Object.entries(object)
      // TODO, consider making id and fields separate properties in the AirtableEntity type
      .filter(([key]) => key !== removeKey)
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {} as Omit<T, K>
      )
  );
}

export function omitId<T>(entity: T): Omit<T, 'id'> {
  return omit(entity, 'id');
}
