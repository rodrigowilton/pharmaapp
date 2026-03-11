import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private h() {
    const t = localStorage.getItem('token');
    return new HttpHeaders(t ? { Authorization: `Bearer ${t}` } : {});
  }

  get<T>(path: string)             { return firstValueFrom(this.http.get<T>   (`${this.base}${path}`, { headers: this.h() })); }
  post<T>(path: string, body: any) { return firstValueFrom(this.http.post<T>  (`${this.base}${path}`, body, { headers: this.h() })); }
  put<T>(path: string, body: any)  { return firstValueFrom(this.http.put<T>   (`${this.base}${path}`, body, { headers: this.h() })); }
  patch<T>(path: string, body: any){ return firstValueFrom(this.http.patch<T> (`${this.base}${path}`, body, { headers: this.h() })); }
}
