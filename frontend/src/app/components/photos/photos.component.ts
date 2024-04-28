import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NUMBER_PHOTOS_PER_PAGE } from 'src/app/common/constants';
import { IAlbum, IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';
import { UtilsService } from 'src/app/services/utils.service';
import { PhotoComponent } from '../photo/photo.component';

@Component({
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
})
export class PhotosComponent {
  public photos: IPhoto[] = [];
  public photosToShow: IPhoto[] = [];

  public arePhotosLoading: boolean = true;
  public photosLoading: boolean[] = [];

  public pageSize: number = NUMBER_PHOTOS_PER_PAGE;
  public pageIndex: number = 0;

  public albumInfo: IAlbum | null = null;

  private albumIdRouteParameter: string = '';
  private nameOfThePhotoToSearch: string = '';

  private sortAscending: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private albumService: AlbumService,
    private dialog: MatDialog,
    private httpService: HttpService,
    private navBarService: NavBarService,
    private utilsService: UtilsService
  ) {}

  public async ngOnInit(): Promise<void> {
    const albumIdParamValue: string | null =
      this.activatedRoute.snapshot.paramMap.get('albumId');
    this.albumIdRouteParameter = albumIdParamValue ? albumIdParamValue : '';

    this.navBarService.filterEmitted$.subscribe((filter: string) => {
      this.nameOfThePhotoToSearch = filter;
      this.pageIndex = 0;
      this.getPaginatedPhotos();
    });

    for (let i: number = 0; i < this.pageSize; i++) {
      this.photosLoading.push(true);
    }

    let photosCount: number = 0;
    let totalPhotosCount: number = 0;
    if (this.albumIdRouteParameter) {
      await firstValueFrom(
        this.httpService.getAlbumInfo(this.albumIdRouteParameter)
      ).then(async (albumInfo: IGoogleDriveFields) => {
        await firstValueFrom(
          this.httpService.getPhotosWithinAlbum(this.albumIdRouteParameter)
        ).then(async (photosWithinAlbum: IGoogleDriveFields[]) => {
          this.albumInfo = {
            albumId: albumInfo.id,
            albumName: albumInfo.name,
            albumCreatedTime: albumInfo.createdTime,
            photos: photosWithinAlbum,
          };
          photosWithinAlbum.forEach(
            async (photoWithinAlbum: IGoogleDriveFields) => {
              if (this.albumInfo) {
                const photo: IPhoto = {
                  photoName: photoWithinAlbum.name.replace(/\.[^.]+$/, ''),
                  photoUrl: `https://lh3.googleusercontent.com/d/${photoWithinAlbum.id}`,
                  photoCreatedTime: photoWithinAlbum.createdTime,
                  album: this.albumInfo,
                  showLegend: false,
                };
                this.photos.push(photo);
                this.photosLoading[this.photos.length - 1] = false;
                this.photosLoading.push(true);
                this.albumService.emitChange(this.photos);
                this.getPaginatedPhotos();
                photosCount += 1;

                if (photosCount === photosWithinAlbum.length) {
                  this.arePhotosLoading = false;
                }
              }
            }
          );
        });
      });
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
                    const album: IAlbum = {
                      albumId: albumInfo.id,
                      albumName: albumInfo.name,
                      albumCreatedTime: albumInfo.createdTime,
                      photos: photosWithinAlbum,
                    };
                    const photo: IPhoto = {
                      photoName: photoWithinAlbum.name.replace(/\.[^.]+$/, ''),
                      photoUrl: `https://lh3.googleusercontent.com/d/${photoWithinAlbum.id}`,
                      photoCreatedTime: photoWithinAlbum.createdTime,
                      album: album,
                      showLegend: false,
                    };
                    this.photos.push(photo);
                    this.photosLoading[this.photos.length - 1] = false;
                    this.photosLoading.push(true);
                    this.albumService.emitChange(this.photos);
                    this.getPaginatedPhotos();
                    photosCount += 1;

                    if (photosCount === totalPhotosCount) {
                      this.arePhotosLoading = false;
                    }
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
    return this.photosLoading.slice(startIndex, startIndex + this.pageSize);
  }

  public getPaginatedPhotos(): IPhoto[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    if (this.nameOfThePhotoToSearch) {
      this.photosToShow = this.photos.filter((photo: IPhoto) => {
        return photo.photoName
          .toLowerCase()
          .includes(this.nameOfThePhotoToSearch.toLowerCase());
      });
    } else {
      this.photosToShow = this.photos;
    }

    return this.photosToShow.slice(startIndex, startIndex + this.pageSize);
  }

  public openPhoto(photo: IPhoto): void {
    const dialogRef: MatDialogRef<PhotoComponent, any> =
      this.dialog.open(PhotoComponent);

    const instance: PhotoComponent = dialogRef.componentInstance;
    instance.photo = photo;
  }

  public sortPhotosByCreatedTime(): void {
    this.photos = this.photos.sort((a: IPhoto, b: IPhoto) => {
      const dateA: Date = new Date(a.photoCreatedTime);
      const dateB: Date = new Date(b.photoCreatedTime);

      if (this.sortAscending) {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

    this.sortAscending = !this.sortAscending;
    this.pageIndex = 0;
  }
}
