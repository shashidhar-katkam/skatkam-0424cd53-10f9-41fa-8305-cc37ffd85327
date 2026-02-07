import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { CreateUserDto, UpdateUserDto } from '@assessment-task/data';

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  organizationId: string;
  roleId: string;
  role: { id: string; name: string; slug: string };
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page = 1, limit = 10): Observable<{ items: UserResponse[]; total: number }> {
    return this.http.get<{ items: UserResponse[]; total: number }>(this.base, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/${id}`);
  }

  create(dto: CreateUserDto): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.base, dto);
  }

  update(id: string, dto: UpdateUserDto): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${id}`);
  }
}
