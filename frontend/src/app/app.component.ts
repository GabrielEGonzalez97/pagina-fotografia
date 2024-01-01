import { Component } from '@angular/core';
import { IPhoto } from './common/interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public photos: IPhoto[] = [];

  constructor() {}

  public ngOnInit(): void {}

  public updatePhotos(photos: IPhoto[]): void {
    this.photos = photos;
  }
}
