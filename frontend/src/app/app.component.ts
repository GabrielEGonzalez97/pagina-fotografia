import { Component } from '@angular/core';
import { IPhoto } from './common/interfaces';
import { AlbumService } from './services/albums.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public photos: IPhoto[] = [];

  constructor(private albumService: AlbumService) {}

  public ngOnInit(): void {
    this.albumService.photosEmitted$.subscribe((photos: IPhoto[]) => {
      this.photos = photos;
    });
  }
}
