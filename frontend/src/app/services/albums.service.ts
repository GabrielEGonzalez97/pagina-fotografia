import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IPhoto } from '../common/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AlbumService {
  private emitPhotos = new Subject<IPhoto[]>();
  public photosEmitted$ = this.emitPhotos.asObservable();

  constructor() {}

  public emitChange(change: IPhoto[]): void {
    this.emitPhotos.next(change);
  }
}
