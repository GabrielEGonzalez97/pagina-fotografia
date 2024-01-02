import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NUMBER_PHOTOS_PER_PAGE } from 'src/app/common/constants';
import { IPhoto } from 'src/app/common/interfaces';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
})
export class PhotosComponent {
  public photos: IPhoto[] = [];
  public areImagesLoading: boolean = true;
  public imagesLoading: boolean[] = [];

  public albumInfo: IGoogleDriveFields | null = null;

  private albumId: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpService: HttpService
  ) {}

  public async ngOnInit(): Promise<void> {
    const albumIdParamValue: string | null =
      this.activatedRoute.snapshot.paramMap.get('albumId');
    this.albumId = albumIdParamValue ? albumIdParamValue : '';

    for (let i: number = 0; i < NUMBER_PHOTOS_PER_PAGE; i++) {
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
}
