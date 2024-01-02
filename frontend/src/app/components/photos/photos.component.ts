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
    let photosAux: IPhoto[] = [];
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
                this.binaryInsertion(photosAux, newPhoto);
                photosCount += 1;
                if (photosCount === photosWithinAlbum.length) {
                  this.areImagesLoading = false;
                  this.photos = photosAux;
                }
              });
            }
          );
        });
      }
    );
  }

  private binaryInsertion(photos: IPhoto[], photo: IPhoto): void {
    if (photos.length === 0) {
      photos.push(photo);
      this.imagesLoading[0] = false;
    } else {
      this.binaryHelper(photos, photo, 0, photos.length - 1);
    }
  }

  private binaryHelper(
    photos: IPhoto[],
    photo: IPhoto,
    lBound: number,
    uBound: number
  ): void {
    if (uBound <= lBound) {
      if (photo.photoCreatedTime < photos[lBound].photoCreatedTime) {
        photos.splice(lBound, 0, photo);
        this.imagesLoading[lBound] = false;
      } else {
        photos.splice(lBound + 1, 0, photo);
        this.imagesLoading[lBound + 1] = false;
      }
    } else {
      const midPoint: number = Math.floor((uBound - lBound) / 2) + lBound;

      if (photo.photoCreatedTime < photos[midPoint].photoCreatedTime) {
        this.binaryHelper(photos, photo, lBound, midPoint);
      } else {
        this.binaryHelper(photos, photo, midPoint + 1, uBound);
      }
    }
  }
}
