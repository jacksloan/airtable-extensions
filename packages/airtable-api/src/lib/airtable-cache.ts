import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  from,
  merge,
  Observable,
  of,
  timer,
} from 'rxjs';
import {
  delayWhen,
  concatMap,
  exhaustMap,
  filter,
  map,
  scan,
  shareReplay,
  switchMap,
  switchMapTo,
  take,
  tap,
} from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import {
  AirtableCacheOptions,
  AirtableQueueStrategy,
} from './airtable-cache.model';

interface CacheItem {
  value: any;
  expires: number;
}

interface QueueItem {
  requestId: string;
  type: 'REQUEST' | 'RESPONSE';
}

interface QueueRequest extends QueueItem {
  cacheKey: string;
  observable: Observable<any>;
}

interface QueueResponse extends QueueItem {
  value: any;
}

export class AirtableRateLimitingCache {
  readonly requests$: BehaviorSubject<QueueRequest> = new BehaviorSubject({
    cacheKey: 'INITIAL',
    requestId: 'INITIAL',
    type: 'REQUEST',
    observable: EMPTY,
  });
  readonly responses$: BehaviorSubject<QueueResponse> = new BehaviorSubject({
    requestId: 'INITIAL',
    type: 'RESPONSE',
    value: 'INITIAL',
  });
  readonly pendingByRequestId$: Observable<{ [k: string]: QueueRequest }>;
  readonly pendingByCacheKey$: Observable<{ [k: string]: QueueRequest[] }>;
  readonly lastRequestTime$: BehaviorSubject<number> = new BehaviorSubject(
    new Date().getTime() - this.config.throttleTime
  );

  readonly cache$: BehaviorSubject<Record<string, CacheItem>> =
    new BehaviorSubject({});

  constructor(
    public config = {
      // The API is limited to 5 requests per second per base. If you exceed this rate, you will receive a 429 status code and will need to wait 30 seconds before subsequent requests will succeed.
      throttleTime: 250,
    }
  ) {
    this.pendingByRequestId$ = merge(this.requests$, this.responses$).pipe(
      scan((acc, curr) => {
        if (curr.type === 'RESPONSE') delete acc[curr.requestId];
        else acc = { ...acc, [curr.requestId]: curr };
        return acc;
      }, {}),
      shareReplay(1)
    );
    this.pendingByCacheKey$ = this.pendingByRequestId$.pipe(
      map((requestsById) => {
        return Object.values(requestsById).reduce((acc, curr) => {
          const items = acc[curr.cacheKey] || [];
          return { ...acc, [curr.cacheKey]: [...items, curr] };
        }, {});
      }),
      shareReplay(1)
    );

    this.requests$
      .pipe(
        concatMap((req) => {
          const { requestId, observable: request } = req;

          return this.lastRequestTime$.pipe(
            take(1),
            delayWhen((lastRequestTime) => {
              const delay = this.calculateDelayTime(lastRequestTime);
              return timer(delay);
            }),
            tap(() => this.lastRequestTime$.next(new Date().getTime())),
            switchMapTo(request),
            tap((response) =>
              this.responses$.next({
                requestId,
                type: 'RESPONSE',
                value: response,
              })
            )
          );
        })
      )
      .subscribe(); // TODO, don't forget to unsubscribe

    // this.pendingByRequestId$.subscribe((pendingByRequestId$) => {
    //   console.log({ pendingByRequestId$ });
    // });

    // this.requests$.subscribe((requests$) => {
    //   console.log({ requests$ });
    // });

    // this.responses$.subscribe((responses$) => {
    //   console.log({ responses$ });
    // });
  }

  /**
   * Schedules an API request for airtable.
   * Depending on the cache options a cached value could be returned
   * immediately or a request will be added to the queue for later execution
   * @param options
   * @param request
   * @returns
   */
  public async schedule<T>(
    options: AirtableCacheOptions,
    request: () => Promise<T>
  ): Promise<T | Error> {
    const { cacheKey } = options;
    let { queueStrategy, getExpiration } = options;
    getExpiration = getExpiration ?? (() => new Date().getTime() + 10_000);
    queueStrategy = queueStrategy ?? AirtableQueueStrategy.EXPIRED;

    const response = combineLatest([
      this.pendingByRequestId$,
      this.cache$,
    ]).pipe(
      take(1),
      exhaustMap(([pendingById, cache]) => {
        const cacheItem = cache[cacheKey];
        const cacheItemExpired =
          (cacheItem?.expires || 0) < new Date().getTime();
        const cachedValue$ = of(cacheItem?.value);
        const pendingRequestsCount = Object.keys(pendingById).length;
        const noRequestsPending = pendingRequestsCount < 1;

        switch (queueStrategy) {
          case AirtableQueueStrategy.EXPIRED:
            return cacheItemExpired
              ? this.addNewRequestOrAwaitExisting(
                  cacheKey,
                  getExpiration,
                  request
                )
              : cachedValue$;

          case AirtableQueueStrategy.ALWAYS:
            return this.addNewRequestOrAwaitExisting(
              cacheKey,
              getExpiration,
              request
            );

          case AirtableQueueStrategy.NONE_PENDING:
            return noRequestsPending || cacheItemExpired
              ? this.addNewRequestOrAwaitExisting(
                  cacheKey,
                  getExpiration,
                  request
                )
              : cachedValue$;

          default:
            return of(
              new Error(`unknown queue strategy: ${AirtableQueueStrategy}`)
            );
        }
      })
    );

    return response.toPromise(); // use firstValueFrom once we can upgrade to latest rxjs
  }

  /**
   * @param cacheKey
   * @returns a snapshot of the cached item
   */
  public getCacheItem(cacheKey: string): any {
    return this.cache$.getValue()[cacheKey];
  }

  public expireCacheItem(cacheKey: string): void {
    const existing = this.getCacheItem(cacheKey);
    if (existing) {
      const expiredItem: CacheItem = { ...existing, expires: null };
      this.setCacheItem(cacheKey, expiredItem);
    }
  }

  private addNewRequestOrAwaitExisting(
    cacheKey: string | null | undefined,
    getExpiration: () => number,
    request: () => Promise<any>
  ): Observable<any> {
    return this.pendingByCacheKey$.pipe(
      take(1),
      switchMap((pending) => {
        const pendingRequest = pending[cacheKey]?.[0];
        const requestId =
          pendingRequest?.requestId || this.addToQueue(cacheKey, request());

        return this.responses$.pipe(
          filter((res) => res.requestId === requestId),
          take(1),
          map((res) => res.value),
          tap((value) => {
            if (!pendingRequest && cacheKey) {
              this.setCacheItem(cacheKey, { value, expires: getExpiration() });
            }
          })
        );
      })
    );
  }

  /**
   * Calculates the minimum amout of time needed to
   * schedule a new request without exceeding the throttle time
   * @param lastRequestTime time since the last request was made to airtable
   * @param throttleTime minimum time between requests
   * @returns
   */
  private calculateDelayTime(
    lastRequestTime: number,
    throttleTime = this.config.throttleTime
  ): number {
    const timeSinceLastRequest = new Date().getTime() - lastRequestTime;
    const delay = throttleTime - timeSinceLastRequest;
    return delay > 0 ? delay : 0;
  }

  /**
   * Adds a new request to the requests$ subject
   * @param cacheKey
   * @param request
   * @returns a unique request id associated with the scheduled request
   */
  private addToQueue<T>(cacheKey: string, request: Promise<T>): string {
    const requestId = uuid();
    this.requests$.next({
      requestId,
      type: 'REQUEST',
      cacheKey,
      observable: from(request),
    });
    return requestId;
  }

  private setCacheItem(cacheKey: string, item: CacheItem): void {
    const cache = this.cache$.getValue();
    this.cache$.next({ ...cache, [cacheKey]: item });
  }
}

export default new AirtableRateLimitingCache();
