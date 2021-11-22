import { TestScheduler } from 'rxjs/testing';
import { rateLimit } from './rxjs-rate-limit';

describe('rxjs rateLimit operator', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });
  it('should limit requests to 1 per 10 frames', () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const source = cold('abcd|').pipe(rateLimit(1, 10, testScheduler));
      const expected = 'a 9ms b 9ms c 9ms (d|)';
      expectObservable(source).toBe(expected);
    });
  });

  it('should limit requests to 2 per 10 frames', () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const source = cold('abcdef|').pipe(rateLimit(2, 10, testScheduler));
      const expected = '(ab) 6ms (cd) 6ms (ef|)';
      expectObservable(source).toBe(expected);
    });
  });
});
