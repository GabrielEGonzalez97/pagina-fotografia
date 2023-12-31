import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  public active : boolean = false;
  
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  setActiveShow() : void {
      this.active = !this.active;
  }

}
