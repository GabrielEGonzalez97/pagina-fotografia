import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IPhoto } from '../common/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AlbumService {
  private emitPhotos: Subject<IPhoto[]> = new Subject<IPhoto[]>();
  public photosEmitted$: Observable<IPhoto[]> = this.emitPhotos.asObservable();

  constructor() {}

  public emitChange(change: IPhoto[]): void {
    this.emitPhotos.next(change);
  }
}
