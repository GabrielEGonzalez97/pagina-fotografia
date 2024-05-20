import { IGoogleDriveFields } from '../services/interfaces';

export interface IAlbum {
  albumId: string;
  albumName: string;
  albumCreatedTime: string;
  photos: IGoogleDriveFields[];
}

export interface IPhoto {
  photoName: string;
  photoUrl: string;
  photoCreatedTime: string;
  album: IAlbum;
  isLoading: boolean;
  showLegend?: boolean;
}
