import { PageEvent } from '@angular/material/paginator';
import { IPhoto } from 'src/app/common/interfaces';
import { IGoogleDriveFields } from 'src/app/services/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';

export abstract class BasePhotos {
  protected photos: IPhoto[] = [];
  protected photosToShow: IPhoto[] = [];

  protected pageSize: number = 0;
  protected pageIndex: number = 0;

  protected nameOfThePhotoToSearch: string = '';

  protected sortAscending: boolean = true;

  constructor(private navBarService: NavBarService, pageSize: number) {
    this.pageSize = pageSize;
  }

  protected onInit(): void {
    this.completePhotosWithLoadingPhotos(this.pageSize);

    this.setPaginatedPhotos(false);

    this.navBarService.filterEmitted$.subscribe((filter: string) => {
      this.nameOfThePhotoToSearch = filter;
      this.pageIndex = 0;
      this.setPaginatedPhotos(true);
    });
  }

  protected completePhotosWithLoadingPhotos(numberPhotos: number): void {
    this.photos = [];
    for (let i: number = 0; i < numberPhotos; i++) {
      this.photos.push(this.getLoadingPhoto());
    }
  }

  private getLoadingPhoto(): IPhoto {
    return {
      photoName: '',
      photoUrl: '',
      photoCreatedTime: '',
      album: null,
      isLoading: true,
    };
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.setPaginatedPhotos(true);
  }

  protected setPaginatedPhotos(useFilter: boolean): void {
    const startIndex: number = this.pageIndex * this.pageSize;
    if (this.nameOfThePhotoToSearch && useFilter) {
      this.photosToShow = this.photos.filter((photo: IPhoto) => {
        return this.getPhotoNameFieldToUse(photo)
          .toLowerCase()
          .includes(this.nameOfThePhotoToSearch.toLowerCase());
      });
    } else {
      this.photosToShow = this.photos;
    }

    this.photosToShow = this.photosToShow.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  protected sortPhotosByCreatedTime(): void {
    this.photos = this.photos.sort((photo1: IPhoto, photo2: IPhoto) => {
      const dateA: Date = new Date(this.getPhotoDateFieldToUse(photo1));
      const dateB: Date = new Date(this.getPhotoDateFieldToUse(photo2));

      if (this.sortAscending) {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

    this.sortAscending = !this.sortAscending;
    this.pageIndex = 0;
    this.setPaginatedPhotos(true);
  }

  protected sortAlbumsByCreatedTime(
    albums: IGoogleDriveFields[]
  ): IGoogleDriveFields[] {
    albums = albums.sort(
      (album1: IGoogleDriveFields, album2: IGoogleDriveFields) => {
        const dateA: Date = new Date(album1.createdTime);
        const dateB: Date = new Date(album2.createdTime);
        return dateB.getTime() - dateA.getTime();
      }
    );

    return albums;
  }

  protected getPhotoNameWithoutExtension(photoName: string): string {
    return photoName.replace(/\.[^.]+$/, '');
  }

  public abstract getPhotoDateFieldToUse: (photo: IPhoto) => string;
  public abstract getPhotoNameFieldToUse: (photo: IPhoto) => string;
}
