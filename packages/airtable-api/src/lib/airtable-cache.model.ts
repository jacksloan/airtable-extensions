export enum AirtableQueueStrategy {
  // only creates a request in the queue if cache item is expired
  EXPIRED = 'EXPIRED',

  // create a request in the queue if the item is expired or there are no other requests pending
  NONE_PENDING = 'NONE_PENDING',

  // always create a request in the queue
  ALWAYS = 'ALWAYS',
}

export interface AirtableCacheOptions {
  // is cache key is null or undefined, the corresponding response will not be cached
  cacheKey: string | null | undefined;
  getExpiration?: () => number;
  queueStrategy?: AirtableQueueStrategy;
}
