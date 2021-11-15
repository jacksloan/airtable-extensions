import { AirtableCacheOptions } from '..';
import airtableCache from './airtable-cache';

export function AirtableCache(options: AirtableCacheOptions) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function () {
      return airtableCache.schedule(
        options,
        // eslint-disable-next-line prefer-rest-params
        method.apply(this, arguments)
      );
    };
  };
}
