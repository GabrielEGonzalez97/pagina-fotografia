import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /*
  document.getElementsByClassName('page-container').oncontextmenu = function(){return false}

  public cancelRightClick(): void {
    document.addEventListener("contextmenu", function(e){
      e.preventDefault();
    }, false)
  }
  
  app.addEventListener('click', () => {
    alert('click izquierdo')
  })*/

  constructor() {}

  public ngOnInit(): void {}
}
