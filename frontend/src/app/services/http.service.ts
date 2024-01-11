import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IGoogleDriveFields } from './interfaces';

const BACKEND_API_URL: string = 'https://surfphoto-page.vercel.app';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient) {}

  public getRootFolder(): Observable<IGoogleDriveFields[]> {
    const endpointUrl: string = `${BACKEND_API_URL}/getRootFolderInfo`; // here we will need to add the URL for the local deployment
    return this.http.get<IGoogleDriveFields[]>(endpointUrl);
  }

  public getAlbumsInfo(rootFolderId: string): Observable<IGoogleDriveFields[]> {
    const endpointUrl: string = `${BACKEND_API_URL}/getAlbumsInfo/${rootFolderId}`;
    return this.http.get<IGoogleDriveFields[]>(endpointUrl);
  }

  public getAlbumInfo(albumId: string): Observable<IGoogleDriveFields> {
    const endpointUrl: string = `${BACKEND_API_URL}/getAlbumInfo/${albumId}`;
    return this.http.get<IGoogleDriveFields>(endpointUrl);
  }

  public getPhotosWithinAlbum(
    albumId: string
  ): Observable<IGoogleDriveFields[]> {
    const endpointUrl: string = `${BACKEND_API_URL}/getPhotosWithinAlbum/${albumId}`;
    return this.http.get<IGoogleDriveFields[]>(endpointUrl);
  }

  public getPhotoById(photoId: string): Observable<ArrayBuffer> {
    const endpointUrl: string = `${BACKEND_API_URL}/getPhotoById/${photoId}`;
    return this.http.get(endpointUrl, {
      responseType: 'arraybuffer',
    });
  }
}
