import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { IGoogleDriveFields } from 'src/app/services/interfaces';

@Component({
  selector: 'app-albums', //forma de referenciar el componente en otros componentes
  templateUrl: './albums.component.html', //la referencia del template usado para el componente album
  styleUrls: ['./albums.component.scss'], //referencia del style scss
})
export class AlbumsComponent implements OnInit {
  private rootFolderInfo: IGoogleDriveFields[] = [];
  private albumsInfo: IGoogleDriveFields[] = [];

  constructor(private httpService: HttpService) {}

  public async ngOnInit(): Promise<void> {
    await firstValueFrom(this.httpService.getRootFolder()).then(
      async (rootFolderInfo: IGoogleDriveFields[]) => {
        this.rootFolderInfo = rootFolderInfo;
        console.log(this.rootFolderInfo);
        await firstValueFrom(
          this.httpService.getAlbumsInfo(this.rootFolderInfo[0].id)
        ).then((albumsInfo: IGoogleDriveFields[]) => {
          this.albumsInfo = albumsInfo;
          console.log(this.albumsInfo); // We will need the first photo of each album to render that photo in the page representing the album
        });
      }
    );
  }
}
