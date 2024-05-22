import { Component, OnInit } from '@angular/core';
import { IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public photos: IPhoto[] = [];

  public photoToShow: IPhoto | null = null;

  constructor(private albumService: AlbumService) {}

  public ngOnInit(): void {
    this.albumService.photosEmitted$.subscribe((photos: IPhoto[]) => {
      this.photos = photos;
      if (!this.photoToShow || !this.photoToShow.photoUrl) {
        this.changeHeaderPicture();
      }
    });
  }

  public changeHeaderPicture(): void {
    if (this.photos && this.photos.length > 0) {
      const randomIndex: number = Math.floor(
        Math.random() * this.photos.length
      );
      this.photoToShow = this.photos[randomIndex];
    } else {
      this.photoToShow = null;
    }
  }
}
