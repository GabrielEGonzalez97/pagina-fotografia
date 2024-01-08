import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { NUMBER_ALBUMS_PER_PAGE } from 'src/app/common/constants';
import { IAlbum, IPhoto } from 'src/app/common/interfaces';
import { AlbumService } from 'src/app/services/albums.service';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent implements OnInit {
  public photos: IPhoto[] = [];
  public photosToShow: IPhoto[] = [];

  public arePhotosLoading: boolean = true;
  public photosLoading: boolean[] = [];

  public pageSize: number = NUMBER_ALBUMS_PER_PAGE;
  public pageIndex: number = 0;

  private rootFolderInfo: IGoogleDriveFields[] = [];
  private albumsInfo: IGoogleDriveFields[] = [];
  private nameOfTheAlbumToSearch: string = '';

  private sortAscending: boolean = true;

  constructor(
    private albumService: AlbumService,
    private httpService: HttpService,
    private navBarService: NavBarService,
    private utilsService: UtilsService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.navBarService.filterEmitted$.subscribe((filter: string) => {
      this.nameOfTheAlbumToSearch = filter;
      this.getPaginatedPhotos();
    });

    for (let i: number = 0; i < this.pageSize; i++) {
      this.photosLoading.push(true);
    }

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
                await this.utilsService
                  .getPhoto(photosWithinAlbum[0], album)
                  .then((photo: IPhoto) => {
                    this.photos.push(photo);
                    this.photosLoading[this.photos.length - 1] = false;
                    this.photosLoading.push(true);
                    this.albumService.emitChange(this.photos);
                    photosCount += 1;

                    if (photosCount === this.albumsInfo.length) {
                      this.arePhotosLoading = false;
                    }
                  });
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

  public navigateTo(route: string): void {
    this.utilsService.navigateTo(route);
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
    if (this.nameOfTheAlbumToSearch) {
      this.photosToShow = this.photos.filter((photo: IPhoto) => {
        return photo.album.albumName
          .toLowerCase()
          .includes(this.nameOfTheAlbumToSearch.toLowerCase());
      });
      this.pageIndex = 0;
    } else {
      this.photosToShow = this.photos;
    }

    return this.photosToShow.slice(startIndex, startIndex + this.pageSize);
  }

  public sortPhotosByCreatedTime(): void {
    this.photos = this.photos.sort((a: IPhoto, b: IPhoto) => {
      const dateA: Date = new Date(a.album.albumCreatedTime);
      const dateB: Date = new Date(b.album.albumCreatedTime);

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
