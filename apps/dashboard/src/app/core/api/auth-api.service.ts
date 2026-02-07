import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginDto, LoginResponse, MeResponse, RegisterDto } from '@assessment-task/data';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(dto: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, dto);
  }

  register(dto: RegisterDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/register`, dto);
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/me`);
  }
}
