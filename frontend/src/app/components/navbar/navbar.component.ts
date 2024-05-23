import { Component, ElementRef, OnInit } from '@angular/core';
import { NavBarService } from 'src/app/services/navbar.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  host: {
    '(document:click)': 'onClickOutsideRightPanel($event)',
  },
})
export class NavbarComponent implements OnInit {
  public active: boolean = false;
  public inputText: string = '';

  constructor(
    private elementRef: ElementRef,
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

  public onInputChange(): void {
    this.navBarService.emitFilterChange(this.inputText);
  }

  public clearInputText(): void {
    this.inputText = '';
    this.onInputChange();
  }

  public onClickOutsideRightPanel(event: any): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.active = false;
    }
  }
}
