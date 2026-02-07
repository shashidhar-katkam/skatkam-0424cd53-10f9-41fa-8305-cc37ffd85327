import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Role, CreateRoleDto, UpdateRoleDto } from '@assessment-task/data';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private base = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(page = 1, limit = 10): Observable<{ items: Role[]; total: number }> {
    return this.http.get<{ items: Role[]; total: number }>(this.base, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.base}/${id}`);
  }

  create(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<Role>(this.base, dto);
  }

  update(id: string, dto: UpdateRoleDto): Observable<Role> {
    return this.http.put<Role>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${id}`);
  }
}
