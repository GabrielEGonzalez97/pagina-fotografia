import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NUMBER_ALBUMS_PER_PAGE } from 'src/app/common/constants';
import { IAlbum, IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';
import { UtilsService } from 'src/app/services/utils.service';
import { BasePhotos } from '../base-photos/base-photos';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent extends BasePhotos implements OnInit {
  private rootFolderInfo: IGoogleDriveFields[] = [];
  private albumsInfo: IGoogleDriveFields[] = [];

  constructor(
    private albumService: AlbumService,
    private httpService: HttpService,
    navBarService: NavBarService,
    private utilsService: UtilsService
  ) {
    super(navBarService, NUMBER_ALBUMS_PER_PAGE);
  }

  public async ngOnInit(): Promise<void> {
    super.onInit();

    let photosCount: number = 0;
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
            ).then(async (photosWithinAlbum: IGoogleDriveFields[]) => {
              if (photosWithinAlbum[0]) {
                const album: IAlbum = {
                  albumId: albumInfo.id,
                  albumName: albumInfo.name,
                  albumCreatedTime: albumInfo.createdTime,
                  photos: photosWithinAlbum,
                };
                this.photos.push({
                  photoName: photosWithinAlbum[0].name.replace(/\.[^.]+$/, ''),
                  photoUrl: `https://lh3.googleusercontent.com/d/${photosWithinAlbum[0].id}`,
                  photoCreatedTime: photosWithinAlbum[0].createdTime,
                  album: album,
                });
                this.photosLoading[this.photos.length - 1] = false;
                this.photosLoading.push(true);
                this.albumService.emitChange(this.photos);
                this.getPaginatedPhotos();
                photosCount += 1;

                if (photosCount === this.albumsInfo.length) {
                  this.arePhotosLoading = false;
                }
              } else {
                photosCount += 1;
                if (photosCount === this.albumsInfo.length) {
                  this.arePhotosLoading = false;
                  this.albumService.emitChange(this.photos);
                }
              }
            });
          });
        });
      }
    );
  }

  public override getPhotoDateFieldToUse: (photo: IPhoto) => string = (
    photo: IPhoto
  ) => photo.album.albumCreatedTime;

  public override getPhotoNameFieldToUse: (photo: IPhoto) => string = (
    photo: IPhoto
  ) => photo.album.albumName;

  public navigateTo(route: string): void {
    this.utilsService.navigateTo(route);
  }
}
