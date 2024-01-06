import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavBarService {
  private emitFilter: Subject<string> = new Subject<string>();
  public filterEmitted$: Observable<string> = this.emitFilter.asObservable();

  constructor() {}

  public emitFilterChange(filter: string): void {
    this.emitFilter.next(filter);
  }
}
