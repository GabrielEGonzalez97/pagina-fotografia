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
  

  /*
  document.getElementsByClassName('page-container').oncontextmenu = function(){return false}

  public cancelRightClick(): void {
    document.addEventListener("contextmenu", function(e){
      e.preventDefault();
    }, false)
  }
  
  app.addEventListener('click', () => {
    alert('click izquierdo')
  })*/

  constructor(private albumService: AlbumService) {}

  public ngOnInit(): void {
    this.albumService.photosEmitted$.subscribe((photos: IPhoto[]) => {
      this.photos = photos;
    });
  }
}
