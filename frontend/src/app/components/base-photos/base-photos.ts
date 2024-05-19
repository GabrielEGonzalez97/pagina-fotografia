import { PageEvent } from '@angular/material/paginator';
import { NUMBER_ALBUMS_PER_PAGE } from 'src/app/common/constants';
import { IPhoto } from 'src/app/common/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';

export abstract class BasePhotos {
  protected photos: IPhoto[] = [];
  protected photosToShow: IPhoto[] = [];

  protected arePhotosLoading: boolean = true;
  protected photosLoading: boolean[] = [];

  protected pageSize: number = NUMBER_ALBUMS_PER_PAGE;
  protected pageIndex: number = 0;

  protected nameOfThePhotoToSearch: string = '';

  protected sortAscending: boolean = true;

  constructor(private navBarService: NavBarService) {}

  protected onInit(getPhotoFieldToUse: (photo: IPhoto) => string): void {
    this.navBarService.filterEmitted$.subscribe((filter: string) => {
      this.nameOfThePhotoToSearch = filter;
      this.pageIndex = 0;
      this.getPaginatedPhotos(getPhotoFieldToUse);
    });

    for (let i: number = 0; i < this.pageSize; i++) {
      this.photosLoading.push(true);
    }
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
  }

  protected getPaginatedLoadingPhotos(): boolean[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    return this.photosLoading.slice(startIndex, startIndex + this.pageSize);
  }

  protected sortPhotosByCreatedTime(
    getPhotoFieldToUse: (photo: IPhoto) => string
  ): void {
    this.photos = this.photos.sort((photo1: IPhoto, photo2: IPhoto) => {
      const dateA: Date = new Date(getPhotoFieldToUse(photo1));
      const dateB: Date = new Date(getPhotoFieldToUse(photo2));

      if (this.sortAscending) {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

    this.sortAscending = !this.sortAscending;
    this.pageIndex = 0;
  }

  protected getPaginatedPhotos(
    getPhotoFieldToUse: (photo: IPhoto) => string
  ): IPhoto[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    if (this.nameOfThePhotoToSearch) {
      this.photosToShow = this.photos.filter((photo: IPhoto) => {
        return getPhotoFieldToUse(photo)
          .toLowerCase()
          .includes(this.nameOfThePhotoToSearch.toLowerCase());
      });
    } else {
      this.photosToShow = this.photos;
    }

    return this.photosToShow.slice(startIndex, startIndex + this.pageSize);
  }
}
