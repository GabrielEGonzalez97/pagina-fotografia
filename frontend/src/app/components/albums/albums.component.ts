import { Component, OnInit } from '@angular/core';
import { NUMBER_ALBUMS_PER_PAGE } from 'src/app/common/constants';
import { IAlbum, IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';
import {
  DONE_STATE,
  IWithState,
  UtilsService,
} from 'src/app/services/utils.service';
import { BasePhotos } from '../base-photos/base-photos';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent extends BasePhotos implements OnInit {
  private rootFolderInfo: IGoogleDriveFields = null;
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

    this.httpService
      .getRootFolder()
      .subscribe((getRootFolderResponse: IWithState<IGoogleDriveFields[]>) => {
        if (getRootFolderResponse.state === DONE_STATE) {
          this.rootFolderInfo = getRootFolderResponse.value[0];

          this.httpService
            .getAlbumsInfo(this.rootFolderInfo.id)
            .subscribe(
              (getAlbumsInfoResponse: IWithState<IGoogleDriveFields[]>) => {
                if (getAlbumsInfoResponse.state === DONE_STATE) {
                  this.albumsInfo = getAlbumsInfoResponse.value;
                  this.albumsInfo = this.sortAlbumsByCreatedTime(
                    this.albumsInfo
                  );

                  this.completePhotosWithLoadingPhotos(this.albumsInfo.length);
                  this.albumsInfo.forEach(
                    (albumInfo: IGoogleDriveFields, index: number) => {
                      this.httpService
                        .getPhotosWithinAlbum(albumInfo.id)
                        .subscribe(
                          (
                            getPhotosWithinAlbumResponse: IWithState<
                              IGoogleDriveFields[]
                            >
                          ) => {
                            if (
                              getPhotosWithinAlbumResponse.state === DONE_STATE
                            ) {
                              if (
                                getPhotosWithinAlbumResponse.value.length > 0
                              ) {
                                const photoInfo: IGoogleDriveFields =
                                  getPhotosWithinAlbumResponse.value[0];
                                const album: IAlbum = {
                                  albumId: albumInfo.id,
                                  albumName: albumInfo.name,
                                  albumCreatedTime: albumInfo.createdTime,
                                  photos: getPhotosWithinAlbumResponse.value,
                                };
                                this.photos[index] = {
                                  photoName: this.getPhotoNameWithoutExtension(
                                    photoInfo.name
                                  ),
                                  photoUrl: `https://lh3.googleusercontent.com/d/${photoInfo.id}`,
                                  photoCreatedTime: photoInfo.createdTime,
                                  album: album,
                                  isLoading: false,
                                };
                                this.setPaginatedPhotos(false);
                              } else {
                                this.photos[index].isLoading = false;
                              }
                            }
                          }
                        );
                    }
                  );
                  this.albumService.emitChange(this.photos);
                }
              }
            );
        }
      });
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
