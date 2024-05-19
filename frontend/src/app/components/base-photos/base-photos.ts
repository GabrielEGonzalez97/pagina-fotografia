import { PageEvent } from '@angular/material/paginator';
import { IPhoto } from 'src/app/common/interfaces';
import { NavBarService } from 'src/app/services/navbar.service';

export abstract class BasePhotos {
  protected photos: IPhoto[] = [];
  protected photosToShow: IPhoto[] = [];

  protected arePhotosLoading: boolean = true;
  protected photosLoading: boolean[] = [];
  protected photosLoadingToShow: boolean[] = [];

  protected pageSize: number = 0;
  protected pageIndex: number = 0;

  protected nameOfThePhotoToSearch: string = '';

  protected sortAscending: boolean = true;

  constructor(private navBarService: NavBarService, pageSize: number) {
    this.pageSize = pageSize;
  }

  protected onInit(): void {
    for (let i: number = 0; i < this.pageSize; i++) {
      this.photosLoading.push(true);
    }

    this.setPaginatedLoadingPhotos();

    this.navBarService.filterEmitted$.subscribe((filter: string) => {
      this.nameOfThePhotoToSearch = filter;
      this.pageIndex = 0;
      this.setPaginatedLoadingPhotos();
      this.getPaginatedPhotos();
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.setPaginatedLoadingPhotos();
  }

  protected setPaginatedLoadingPhotos(): void {
    const startIndex: number = this.pageIndex * this.pageSize;
    this.photosLoadingToShow = this.photosLoading.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  protected getPaginatedPhotos(): IPhoto[] {
    const startIndex: number = this.pageIndex * this.pageSize;
    if (this.nameOfThePhotoToSearch) {
      this.photosToShow = this.photos.filter((photo: IPhoto) => {
        return this.getPhotoNameFieldToUse(photo)
          .toLowerCase()
          .includes(this.nameOfThePhotoToSearch.toLowerCase());
      });
    } else {
      this.photosToShow = this.photos;
    }

    return this.photosToShow.slice(startIndex, startIndex + this.pageSize);
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
  }

  public abstract getPhotoDateFieldToUse: (photo: IPhoto) => string;
  public abstract getPhotoNameFieldToUse: (photo: IPhoto) => string;
}
