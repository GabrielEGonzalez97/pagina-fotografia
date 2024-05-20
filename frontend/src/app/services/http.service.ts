import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IGoogleDriveFields } from './interfaces';
import { IWithState, UtilsService } from './utils.service';

const BACKEND_API_URL: string = 'https://surfphotos-gamma.vercel.app';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient, private utilsService: UtilsService) {}

  public getRootFolder(): Observable<IWithState<IGoogleDriveFields[]>> {
    const endpointUrl: string = `${BACKEND_API_URL}/getRootFolderInfo`; // here we will need to add the URL for the local deployment
    return this.getWithState<IGoogleDriveFields[]>(endpointUrl);
  }

  public getAlbumsInfo(
    rootFolderId: string
  ): Observable<IWithState<IGoogleDriveFields[]>> {
    const endpointUrl: string = `${BACKEND_API_URL}/getAlbumsInfo/${rootFolderId}`;
    return this.getWithState<IGoogleDriveFields[]>(endpointUrl);
  }

  public getAlbumInfo(albumId: string): Observable<IGoogleDriveFields> {
    const endpointUrl: string = `${BACKEND_API_URL}/getAlbumInfo/${albumId}`;
    return this.http.get<IGoogleDriveFields>(endpointUrl);
  }

  public getPhotosWithinAlbum(
    albumId: string
  ): Observable<IWithState<IGoogleDriveFields[]>> {
    const endpointUrl: string = `${BACKEND_API_URL}/getPhotosWithinAlbum/${albumId}`;
    return this.getWithState<IGoogleDriveFields[]>(endpointUrl);
  }

  public getPhotoById(photoId: string): Observable<ArrayBuffer> {
    const endpointUrl: string = `${BACKEND_API_URL}/getPhotoById/${photoId}`;
    return this.http.get(endpointUrl, {
      responseType: 'arraybuffer',
    });
  }

  private getWithState = <T>(
    url: string,
    params?: HttpParams,
    responseType?: any
  ) =>
    this.utilsService.withState(
      this.http.get<T>(url, { params, responseType })
    );

  private postWithState = <T>(
    url: string,
    body: any,
    headers?: any,
    responseType?: any,
    params?: HttpParams
  ) => {
    const httpHeaders = new HttpHeaders({
      accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    });
    const options = { headers: httpHeaders };
    return this.utilsService.withState(this.http.post<T>(url, body, options));
  };
}
