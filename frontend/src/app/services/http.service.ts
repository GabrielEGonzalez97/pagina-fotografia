import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor(private http: HttpClient) {
  }

  public getRootFolder() {
    this.http.get(this.configUrl);//here we will need to add the URL for the local deployment
  }

}
