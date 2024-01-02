import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumsComponent } from './components/albums/albums.component';
import { PhotosComponent } from './components/photos/photos.component';

const routes: Routes = [
  {
    path: '',
    component: AlbumsComponent,
  },
  {
    path: 'album/:albumId',
    component: PhotosComponent,
  },
  {
    path: 'fotos',
    component: PhotosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
