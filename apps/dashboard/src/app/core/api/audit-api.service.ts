import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuditLogEntry } from '@assessment-task/data';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private base = `${environment.apiUrl}/audit-log`;

  constructor(private http: HttpClient) {}

  getAuditLog(page = 1, limit = 10): Observable<{ items: AuditLogEntry[]; total: number }> {
    return this.http.get<{ items: AuditLogEntry[]; total: number }>(this.base, {
      params: { page: String(page), limit: String(limit) },
    });
  }
}
