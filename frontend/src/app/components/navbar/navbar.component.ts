import { Component, OnInit } from '@angular/core';
import { NavBarService } from 'src/app/services/navbar.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  public active: boolean = false;

  constructor(
    private navBarService: NavBarService,
    private utilsService: UtilsService
  ) {}

  public ngOnInit(): void {}

  public setActiveShow(): void {
    this.active = !this.active;
  }

  public navigateTo(route: string): void {
    this.utilsService.navigateTo(route);
  }

  public onInputChange(event: any): void {
    this.navBarService.emitFilterChange(event.target.value);
  }
}
