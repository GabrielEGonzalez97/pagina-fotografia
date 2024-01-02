import { Component, Input, OnInit } from '@angular/core';
import { IPhoto } from 'src/app/common/interfaces';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
})
export class PhotoComponent implements OnInit {
  @Input() public photo: IPhoto | null = null;

  constructor() {}

  public ngOnInit(): void {}
}
