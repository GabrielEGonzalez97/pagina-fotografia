import { IGoogleDriveFields } from '../services/interfaces';

export interface IAlbum {
  albumId: string;
  albumName: string;
  albumCreatedTime: string;
  photos: IGoogleDriveFields[];
}

export interface IPhoto {
  photoUrl: string;
  photoCreatedTime: string;
  album: IAlbum;
}
