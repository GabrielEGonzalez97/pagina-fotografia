import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { NUMBER_ALBUMS_PER_PAGE } from 'src/app/common/constants';
import { IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent implements OnInit {
  public firstPhotoByAlbum: Map<string, string> = new Map<string, string>(); // We need this for the moment when the user need to view a one specific
  public photos: IPhoto[] = [];
  public areImagesLoading: boolean = true;
  public imagesLoading: boolean[] = [];

  public pageSize: number = NUMBER_ALBUMS_PER_PAGE;
  public pageIndex: number = 0;

  private rootFolderInfo: IGoogleDriveFields[] = [];
  private albumsInfo: IGoogleDriveFields[] = [];

  constructor(
    private albumService: AlbumService,
    private httpService: HttpService,
    private utilsService: UtilsService
  ) {}

  public async ngOnInit(): Promise<void> {
    for (let i: number = 0; i < this.pageSize; i++) {
      this.imagesLoading.push(true);
    }

    let photosCount: number = 0;
    let photosAux: IPhoto[] = [];
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
                  const newPhoto: IPhoto = {
                    photoUrl,
                    photoCreatedTime: photos[0].createdTime,
                    album: {
                      albumId: albumInfo.id,
                      albumName: albumInfo.name,
                      albumCreatedTime: albumInfo.createdTime,
                      photos: photos,
                    },
                  };
                  this.binaryInsertion(photosAux, newPhoto);
                  photosCount += 1;
                  if (photosCount === this.albumsInfo.length) {
                    this.areImagesLoading = false;
                    this.photos = photosAux;
                    this.albumService.emitChange(this.photos);
                  }
                });
              } else {
                photosCount += 1;
                if (photosCount === this.albumsInfo.length) {
                  this.areImagesLoading = false;
                  this.photos = photosAux;
                  this.albumService.emitChange(this.photos);
                }
              }
            });
          });
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
      if (
        photo.album.albumCreatedTime < photos[lBound].album.albumCreatedTime
      ) {
        photos.splice(lBound, 0, photo);
        this.imagesLoading[lBound] = false;
      } else {
        photos.splice(lBound + 1, 0, photo);
        this.imagesLoading[lBound + 1] = false;
      }
    } else {
      const midPoint: number = Math.floor((uBound - lBound) / 2) + lBound;

      if (
        photo.album.albumCreatedTime < photos[midPoint].album.albumCreatedTime
      ) {
        this.binaryHelper(photos, photo, lBound, midPoint);
      } else {
        this.binaryHelper(photos, photo, midPoint + 1, uBound);
      }
    }
  }

  public navigateTo(route: string): void {
    this.utilsService.navigateTo(route);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
  }

  public getPaginatedPhotos(): IPhoto[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.photos.slice(startIndex, startIndex + this.pageSize);
  }
}
