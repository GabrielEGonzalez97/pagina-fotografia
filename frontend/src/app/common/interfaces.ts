import { IGoogleDriveFields } from '../services/interfaces';

export interface IAlbum {
  albumName: string;
  albumCreatedTime: string;
  photos: IGoogleDriveFields[];
}

export interface IPhoto {
  photoUrl: string;
  album: IAlbum;
}
