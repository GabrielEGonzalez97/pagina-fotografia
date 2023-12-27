import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent implements OnInit {
  private rootFolderInfo: IGoogleDriveFields[] = [];
  private albumsInfo: IGoogleDriveFields[] = [];
  public firstPhotoByAlbum: Map<string, string> = new Map<string, string>(); // We need this for the moment when the user need to view a one specific
  public photos: string[] = [];

  constructor(private httpService: HttpService) {}

  public async ngOnInit(): Promise<void> {
    await firstValueFrom(this.httpService.getRootFolder()).then(
      // First we call the endpoint that returns the info of the root folder in Google Drive
      async (rootFolderInfo: IGoogleDriveFields[]) => {
        this.rootFolderInfo = rootFolderInfo;
        await firstValueFrom(
          this.httpService.getAlbumsInfo(this.rootFolderInfo[0].id) // Second we call the endpoint that returns the info of each folder within the root folder
        ).then((albumsInfo: IGoogleDriveFields[]) => {
          this.albumsInfo = albumsInfo;
          this.albumsInfo.forEach(async (albumInfo: IGoogleDriveFields) => {
            await firstValueFrom(
              this.httpService.getPhotosWithinAlbum(albumInfo.id) // Third we call the endpoint that returns the photos within each album folder
            ).then(async (photos: IGoogleDriveFields[]) => {
              if (photos[0]) {
                const firstPhotoId: string = photos[0].id;
                await firstValueFrom(
                  this.httpService.getPhotoById(firstPhotoId) // Fourth we call the endpoint that returns the photo itself
                ).then((photo: ArrayBuffer) => {
                  const blob: Blob = new Blob([photo]);
                  const photoUrl: string = window.URL.createObjectURL(blob);
                  this.firstPhotoByAlbum.set(albumInfo.id, photoUrl);
                  this.photos.push(photoUrl);
                });
              }
            });
          });
        });
      }
    );
  }
}
