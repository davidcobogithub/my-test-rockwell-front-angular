import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { TaskDTO } from "../models/TaskDTO.model";

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private url = environment.apiUrl;

  constructor(private http: HttpClient) { }

  executeGetMethod(task:TaskDTO): Observable<any> {
    return this.http.post(this.url + '/api/service', task);
  }
}
