import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IAlbum, IPhoto } from '../common/interfaces';
import { HttpService } from './http.service';
import { IGoogleDriveFields } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private httpService: HttpService, private router: Router) {}

  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  public async getPhoto(
    photoWithinAlbumInfo: IGoogleDriveFields,
    albumInfo: IAlbum
  ): Promise<IPhoto> {
    const photoArrayBuffer: ArrayBuffer = await firstValueFrom(
      this.httpService.getPhotoById(photoWithinAlbumInfo.id)
    );

    const blob: Blob = new Blob([photoArrayBuffer]);
    const photoUrl: string = window.URL.createObjectURL(blob);

    return {
      photoName: photoWithinAlbumInfo.name.replace(/\.[^.]+$/, ''),
      photoUrl,
      photoCreatedTime: photoWithinAlbumInfo.createdTime,
      album: albumInfo,
    };
  }
}
