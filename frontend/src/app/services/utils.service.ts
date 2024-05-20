import { Injectable, OnDestroy, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  ObservableInput,
  OperatorFunction,
  ReplaySubject,
  catchError,
  combineLatest,
  filter,
  map,
  of,
  pipe,
  shareReplay,
  startWith,
  take,
  takeUntil,
} from 'rxjs';

export const LOADING_STATE = 'loading';
export const ERROR_STATE = 'error';
export const DONE_STATE = 'done';

export interface IWithState<T> {
  state: typeof LOADING_STATE | typeof ERROR_STATE | typeof DONE_STATE;
  value: T | null;
}

export interface IWithOpenState {
  open: boolean;
}

export interface IWithDisabledState {
  disabled: boolean;
}

export interface IWithDestroyed {
  destroyed$: ReplaySubject<void>;
}

export type Keys<T> = { [k in keyof T]: k }[keyof T];

type CombinedObservableWithState<T> = Observable<
  IWithState<{
    [P in keyof T]: T[P] extends ObservableInput<IWithState<infer U> | infer U>
      ? U
      : never;
  }>
>;

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private router: Router) {}

  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * filters out values emitted by any `Observable<IWithState<T>>` and emits again
   * only the contained values for `done` `IWithState`s as an `Observable<T>`.
   *
   * Useful when we need to wait for the value to trigger a different subscription,
   * but we don't need to return the `state`for rendering loading animations
   */
  public filterDone = <T>(): OperatorFunction<IWithState<T> | T, T> =>
    pipe(
      filter((v) => (this.isIWithState(v) ? v.state === DONE_STATE : true)),
      map((v) => (this.isIWithState(v) ? v.value! : v)),
      shareReplay(1)
    );

  /**
   * Wraps any `Observable` in an `IWithState` Interface that reports the state of the
   * subscription from the moment it is created ("loading" `state`), until
   * it completes ("done" `state`). In case of errors the `state` will be "error"
   * and the `value` will only be available (not `undefined`) if the state is `done`.
   * Useful for Http calls.
   */
  public withState = <T>(ob$: Observable<T>) =>
    ob$.pipe(
      map((value: T) => ({ state: DONE_STATE, value })),
      startWith({ state: LOADING_STATE, value: null }),
      catchError((error) => {
        console.error(error);
        return of({ state: ERROR_STATE, value: null });
      })
    ) as Observable<IWithState<T>>;

  public isOfNonOptionalType = <T>(
    value: unknown,
    ...attsToCheck: Keys<T>[]
  ): value is T =>
    value instanceof Object &&
    !!value &&
    attsToCheck.reduce(
      (currentValidationState: boolean, att: Keys<T>) =>
        currentValidationState &&
        value[att.toString() as keyof typeof value] !== undefined,
      true
    );

  public isOnDestroy = (value: unknown): value is OnDestroy =>
    this.isOfNonOptionalType<OnDestroy>(value, 'ngOnDestroy');

  public isIWithDestroyed = (value: unknown): value is IWithDestroyed =>
    this.isOfNonOptionalType<IWithDestroyed>(value, 'destroyed$');

  public isIWithState = <T>(value: unknown): value is IWithState<T> =>
    this.isOfNonOptionalType<IWithState<T>>(value, 'value', 'state');

  public componentDestroyed = (component: unknown) => {
    let oldNgOnDestroy: () => void;
    if (!this.isIWithDestroyed(component)) {
      (component as IWithDestroyed).destroyed$ = new ReplaySubject<void>(1);
    }
    if (this.isOnDestroy(component)) {
      oldNgOnDestroy = component.ngOnDestroy;
    }
    if (this.isIWithDestroyed(component) && this.isOnDestroy(component)) {
      component.ngOnDestroy = () => {
        if (oldNgOnDestroy) {
          oldNgOnDestroy.apply(component);
        }
        component.destroyed$.next();
        component.destroyed$.complete();
      };
    }
    return (component as IWithDestroyed).destroyed$;
  };

  /**
   * Auto unsubscribe once the component, directive, or pipe gets destroyed
   */
  public safeSubscribe = <T>(
    ob$: Observable<T>,
    component: unknown,
    cb: (value: T) => void
  ) => {
    const destroyed$ = this.componentDestroyed(component);
    ob$.pipe(takeUntil(destroyed$)).subscribe(cb);
  };

  /**
   * same as safeSubscribe but use to query only the last emitted value and then unsubscribe (opposite to the
   * regular use of hot observables which stays subscribed until the component gets destroyed))
   */
  public safeSubscribeOnce = <T>(
    ob$: Observable<T>,
    component: unknown,
    cb: (value: T) => void
  ) => {
    const destroyed$ = this.componentDestroyed(component);
    ob$.pipe(this.filterDone(), take(1), takeUntil(destroyed$)).subscribe(cb);
  };

  /**
   * Combine the state of the `valuesWithState` passed in. If all the values have their state as
   * `done` then the result will be `done`. If any of them has its state as `error` then `error`
   * will be returned. `loading` will be the state in any other case.
   * We check for null values to be backward compatible with the previous approach to
   * store the state of the app as `BehavioralSubject`s initialized with `null`. Once every
   * Store is migrated to an `IWithState` `ReplaySubject` the support for `any` values
   * will be deprecated and removed
   */
  public combineState = (
    ...valuesWithState: (IWithState<unknown> | unknown)[]
  ) =>
    valuesWithState.every(
      (v) => v !== null && (!this.isIWithState(v) || v.state === DONE_STATE)
    )
      ? DONE_STATE
      : valuesWithState.some(
          (v) =>
            v !== null && (!this.isIWithState(v) || v.state === ERROR_STATE)
        )
      ? ERROR_STATE
      : LOADING_STATE;

  /**
   * Combine the `valuesWithState` passed in. If all the values have their state as
   * `done` then the result will have it too. If any of them has its state as `error` then `error`
   * will be the state of the result. `loading` will be the state in any other case.
   * The value of the result will be the array returned by the `combineLatest` operator
   * if the state is `done`, and undefined otherwise
   */
  public combineLatestKeepState = <
    T extends ObservableInput<IWithState<unknown> | unknown>[]
  >(
    ...valuesWithState: T
  ): CombinedObservableWithState<T> =>
    combineLatest(...valuesWithState).pipe(
      map(
        (valuesCombined) => {
          const mergedState = this.combineState(...valuesCombined);
          if (mergedState !== DONE_STATE) {
            return {
              state: mergedState,
              value: [...valuesWithState.map((_) => null)],
            };
          }
          return {
            state: mergedState,
            value: valuesCombined.map((v) =>
              this.isIWithState(v) && v.state && v.state === DONE_STATE
                ? v.value
                : v
            ),
          };
        }
        /*** NOTE: we need to manually cast the type to `CombinedObservableWithState<T>` due to a
         * limitation in the `combineLatest` operator from rxjs which lost the types for the
         * input observables. This is going to be solve in rxjs v7 once released. */
      )
    ) as CombinedObservableWithState<T>;

  /**
   * combines the `mapWithState` operator with an `startWith` (In case the source observable is not initialized yet)
   * and a `shareReplay` to avoid to trigger the project function multiple times for each new subscriber
   */
  public extractFromIWithStateSource = <T, R>(
    project: (value: T) => R
  ): OperatorFunction<IWithState<T>, IWithState<R>> =>
    pipe(
      this.mapWithState(project),
      startWith({ state: LOADING_STATE, value: null } as IWithState<R>),
      shareReplay(1)
    );

  /**
   * Same as `map` from [rxjs](https://rxjs-dev.firebaseapp.com/api/operators/map) but keeping the
   * `IWithState` wrapper around the mapped value and applies the `project` function to the valued
   * contained by the `IWithState` wrapper if the state is `done`
   */
  public mapWithState = <T, R>(
    project: (value: T) => R
  ): OperatorFunction<IWithState<T>, IWithState<R>> =>
    map((valueWithState: IWithState<T>) => ({
      state: valueWithState.state,
      value:
        valueWithState.state === DONE_STATE
          ? project(valueWithState.value as T)
          : null,
    }));

  /** Returns a new iterable where the values are numbers from 0 up to but not including `upTo`.
   * Similar to [python's range](https://docs.python.org/3.3/library/stdtypes.html?highlight=range#range) built in type
   * You can pass a @param shift and will be added to each value
   * @example
   * // returns [2,3,4]
   * range(3, 2);
   */
  public range = (upTo: number, shift?: number) =>
    [...Array(upTo).keys()].map((v) => (shift ? v + shift : v));

  /**
   * Check if some `value` is a `TemplateRef` using the `instanceof` operator
   */
  public isTemplate = (value: unknown) => value instanceof TemplateRef;
  public withOpenState = <T>(values: T[]) =>
    values.map((v) => ({ ...v, open: false } as IWithOpenState & T));
  public withDisabledState = <T>(values: T[]) =>
    values.map((v) => ({ ...v, disabled: false } as IWithDisabledState & T));
}
