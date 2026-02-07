import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PermissionStructure } from '@assessment-task/data';

export interface SyncPermissionsResponse {
  success: boolean;
  message: string;
  stats: {
    modulesCreated: number;
    modulesUpdated: number;
    featuresCreated: number;
    featuresUpdated: number;
    totalModules: number;
    totalFeatures: number;
  };
  version?: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionsApiService {
  private base = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  getStructure(): Observable<PermissionStructure> {
    return this.http.get<PermissionStructure>(`${this.base}/structure`);
  }

  sync(): Observable<SyncPermissionsResponse> {
    return this.http.post<SyncPermissionsResponse>(`${this.base}/sync`, {});
  }
}
