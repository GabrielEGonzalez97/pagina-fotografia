import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(private router: Router) {}

  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
