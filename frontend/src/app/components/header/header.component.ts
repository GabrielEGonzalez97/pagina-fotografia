import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IPhoto } from 'src/app/common/interfaces';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnChanges {
  @Input() public photos: IPhoto[] = [];

  public photoToShow: IPhoto | null = null;

  constructor() {}

  public ngOnInit(): void {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['photos'] &&
      changes['photos'].currentValue &&
      changes['photos'].currentValue.length > 0
    ) {
      this.changeHeaderPicture();
    }
  }

  public changeHeaderPicture(): void {
    if (this.photos && this.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.photos.length);
      this.photoToShow = this.photos[randomIndex];
    } else {
      this.photoToShow = null;
    }
  }
}
