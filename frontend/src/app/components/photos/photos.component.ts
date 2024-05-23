import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { NUMBER_PHOTOS_PER_PAGE } from 'src/app/common/constants';
import { IAlbum, IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';
import { DONE_STATE, IWithState } from 'src/app/services/utils.service';
import { BasePhotos } from '../base-photos/base-photos';
import { PhotoComponent } from '../photo/photo.component';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
})
export class PhotosComponent extends BasePhotos implements OnInit {
  public albumInfo: IAlbum | null = null;

  private albumIdRouteParameter: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private albumService: AlbumService,
    private dialog: MatDialog,
    private httpService: HttpService,
    navBarService: NavBarService
  ) {
    super(navBarService, NUMBER_PHOTOS_PER_PAGE);
  }

  public async ngOnInit(): Promise<void> {
    super.onInit();

    const albumIdParamValue: string | null =
      this.activatedRoute.snapshot.paramMap.get('albumId');
    this.albumIdRouteParameter = albumIdParamValue ? albumIdParamValue : '';

    if (this.albumIdRouteParameter) {
      this.httpService
        .getAlbumInfo(this.albumIdRouteParameter)
        .subscribe((getAlbumInfoResponse: IWithState<IGoogleDriveFields>) => {
          if (getAlbumInfoResponse.state === DONE_STATE) {
            this.httpService
              .getPhotosWithinAlbum(this.albumIdRouteParameter)
              .subscribe(
                (photosWithinAlbum: IWithState<IGoogleDriveFields[]>) => {
                  if (photosWithinAlbum.state === DONE_STATE) {
                    const albumInfo: IGoogleDriveFields =
                      getAlbumInfoResponse.value;
                    this.albumInfo = {
                      albumId: albumInfo.id,
                      albumName: albumInfo.name,
                      albumCreatedTime: albumInfo.createdTime,
                      photos: photosWithinAlbum.value,
                    };
                    this.completePhotosWithLoadingPhotos(
                      photosWithinAlbum.value
                    );
                    photosWithinAlbum.value.forEach(
                      async (photoWithinAlbum: IGoogleDriveFields) => {
                        if (this.albumInfo) {
                          const newPhoto: IPhoto = {
                            photoId: photoWithinAlbum.id,
                            photoName: this.getPhotoNameWithoutExtension(
                              photoWithinAlbum.name
                            ),
                            photoUrl: `https://lh3.googleusercontent.com/d/${photoWithinAlbum.id}`,
                            photoCreatedTime: photoWithinAlbum.createdTime,
                            album: this.albumInfo,
                            showLegend: false,
                            isLoading: false,
                          };
                          const existingPhotoIndex: number =
                            this.photos.findIndex(
                              (photo: IPhoto) =>
                                photo.photoId === newPhoto.photoId
                            );
                          if (existingPhotoIndex !== -1) {
                            this.photos[existingPhotoIndex] = newPhoto;
                          }
                          this.setPaginatedPhotos(true);
                          this.albumService.emitChange(this.photos);
                        }
                      }
                    );
                  }
                }
              );
          }
        });
    } else {
      // await firstValueFrom(this.httpService.getRootFolder()).then(
      //   async (rootFolderInfo: IGoogleDriveFields[]) => {
      //     await firstValueFrom(
      //       this.httpService.getAlbumsInfo(rootFolderInfo[0].id)
      //     ).then(async (albumsInfo: IGoogleDriveFields[]) => {
      //       albumsInfo.forEach(async (albumInfo: IGoogleDriveFields) => {
      //         await firstValueFrom(
      //           this.httpService.getPhotosWithinAlbum(albumInfo.id)
      //         ).then(async (photosWithinAlbum: IGoogleDriveFields[]) => {
      //           totalPhotosCount += photosWithinAlbum.length;
      //           const album: IAlbum = {
      //             albumId: albumInfo.id,
      //             albumName: albumInfo.name,
      //             albumCreatedTime: albumInfo.createdTime,
      //             photos: photosWithinAlbum,
      //           };
      //           photosWithinAlbum.forEach(
      //             async (photoWithinAlbum: IGoogleDriveFields) => {
      //               const photo: IPhoto = {
      //                 photoName: photoWithinAlbum.name.replace(/\.[^.]+$/, ''),
      //                 photoUrl: `https://lh3.googleusercontent.com/d/${photoWithinAlbum.id}`,
      //                 photoCreatedTime: photoWithinAlbum.createdTime,
      //                 album: album,
      //                 showLegend: false,
      //               };
      //               this.photos.push(photo);
      //               this.photosLoading[this.photos.length - 1] = false;
      //               this.photosLoading.push(true);
      //               this.albumService.emitChange(this.photos);
      //               this.getPaginatedPhotos();
      //               photosCount += 1;
      //               if (photosCount === totalPhotosCount) {
      //                 this.arePhotosLoading = false;
      //               }
      //             }
      //           );
      //         });
      //       });
      //     });
      //   }
      // );
    }
  }

  public openPhoto(photo: IPhoto): void {
    const dialogRef: MatDialogRef<PhotoComponent, any> =
      this.dialog.open(PhotoComponent);

    const instance: PhotoComponent = dialogRef.componentInstance;
    instance.photo = photo;
  }

  public override getPhotoDateFieldToUse: (photo: IPhoto) => string = (
    photo: IPhoto
  ) => photo.photoCreatedTime;

  public override getPhotoNameFieldToUse: (photo: IPhoto) => string = (
    photo: IPhoto
  ) => photo.photoName;
}
