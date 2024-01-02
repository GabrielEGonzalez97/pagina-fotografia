import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NUMBER_PHOTOS_PER_PAGE } from 'src/app/common/constants';
import { IPhoto } from 'src/app/common/interfaces';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { PhotoComponent } from '../photo/photo.component';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
})
export class PhotosComponent {
  public photos: IPhoto[] = [];
  public areImagesLoading: boolean = true;
  public imagesLoading: boolean[] = [];

  public pageSize: number = NUMBER_PHOTOS_PER_PAGE;
  public pageIndex: number = 0;

  public albumInfo: IGoogleDriveFields | null = null;

  private albumId: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private httpService: HttpService
  ) {}

  public async ngOnInit(): Promise<void> {
    const albumIdParamValue: string | null =
      this.activatedRoute.snapshot.paramMap.get('albumId');
    this.albumId = albumIdParamValue ? albumIdParamValue : '';

    for (let i: number = 0; i < this.pageSize; i++) {
      this.imagesLoading.push(true);
    }

    let photosCount: number = 0;
    let totalPhotosCount: number = 0;
    if (this.albumId) {
      await firstValueFrom(this.httpService.getAlbumInfo(this.albumId)).then(
        async (albumInfo: IGoogleDriveFields) => {
          this.albumInfo = albumInfo;
          await firstValueFrom(
            this.httpService.getPhotosWithinAlbum(this.albumId)
          ).then(async (photosWithinAlbum: IGoogleDriveFields[]) => {
            photosWithinAlbum.forEach(
              async (photoWithinAlbum: IGoogleDriveFields) => {
                await firstValueFrom(
                  this.httpService.getPhotoById(photoWithinAlbum.id)
                ).then((photo: ArrayBuffer) => {
                  const blob: Blob = new Blob([photo]);
                  const photoUrl: string = window.URL.createObjectURL(blob);
                  const newPhoto: IPhoto = {
                    photoName: photoWithinAlbum.name,
                    photoUrl,
                    photoCreatedTime: photoWithinAlbum.createdTime,
                    album: {
                      albumId: albumInfo.id,
                      albumName: albumInfo.name,
                      albumCreatedTime: albumInfo.createdTime,
                      photos: photosWithinAlbum,
                    },
                  };

                  this.photos.push(newPhoto);
                  this.imagesLoading[this.photos.length - 1] = false;
                  this.imagesLoading.push(true);
                  photosCount += 1;

                  if (photosCount === photosWithinAlbum.length) {
                    this.areImagesLoading = false;
                  }
                });
              }
            );
          });
        }
      );
    } else {
      await firstValueFrom(this.httpService.getRootFolder()).then(
        async (rootFolderInfo: IGoogleDriveFields[]) => {
          await firstValueFrom(
            this.httpService.getAlbumsInfo(rootFolderInfo[0].id)
          ).then(async (albumsInfo: IGoogleDriveFields[]) => {
            albumsInfo.forEach(async (albumInfo: IGoogleDriveFields) => {
              await firstValueFrom(
                this.httpService.getPhotosWithinAlbum(albumInfo.id)
              ).then(async (photosWithinAlbum: IGoogleDriveFields[]) => {
                totalPhotosCount += photosWithinAlbum.length;
                photosWithinAlbum.forEach(
                  async (photoWithinAlbum: IGoogleDriveFields) => {
                    await firstValueFrom(
                      this.httpService.getPhotoById(photoWithinAlbum.id)
                    ).then((photo: ArrayBuffer) => {
                      const blob: Blob = new Blob([photo]);
                      const photoUrl: string = window.URL.createObjectURL(blob);
                      const newPhoto: IPhoto = {
                        photoName: photoWithinAlbum.name,
                        photoUrl,
                        photoCreatedTime: photoWithinAlbum.createdTime,
                        album: {
                          albumId: albumInfo.id,
                          albumName: albumInfo.name,
                          albumCreatedTime: albumInfo.createdTime,
                          photos: photosWithinAlbum,
                        },
                      };
                      this.photos.push(newPhoto);
                      this.imagesLoading[this.photos.length - 1] = false;
                      this.imagesLoading.push(true);
                      photosCount += 1;

                      if (photosCount === totalPhotosCount) {
                        this.areImagesLoading = false;
                      }
                    });
                  }
                );
              });
            });
          });
        }
      );
    }
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
  }

  public getPaginatedLoadingPhotos(): boolean[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    return this.imagesLoading.slice(startIndex, startIndex + this.pageSize);
  }

  public getPaginatedPhotos(): IPhoto[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    return this.photos.slice(startIndex, startIndex + this.pageSize);
  }

  public openPhoto(photo: IPhoto): void {
    const dialogRef: MatDialogRef<PhotoComponent, any> =
      this.dialog.open(PhotoComponent);

    let instance: PhotoComponent = dialogRef.componentInstance;
    instance.photo = photo;
  }
}
