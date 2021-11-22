import type { OperatorFunction, SchedulerLike } from 'rxjs';
import { asyncScheduler, Observable, timer } from 'rxjs';
import { delayWhen } from 'rxjs/operators';

export function rateLimit<T>(
  requestsPerPeriod = 5,
  period = 1_000,
  scheduler: SchedulerLike = asyncScheduler
): OperatorFunction<T, T> {
  let intervalEnds = 0;
  let activeCountForInterval = 0;

  return function <T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      delayWhen(() => {
        const now = scheduler.now();

        if (intervalEnds <= now) {
          activeCountForInterval = 1;
          intervalEnds = now + period;
          return timer(0, scheduler);
        } else {
          if (++activeCountForInterval > requestsPerPeriod) {
            activeCountForInterval = 1;
            intervalEnds += period;
          }
          const delay = intervalEnds - period - now;
          return timer(delay, scheduler);
        }
      })
    );
  };
}
