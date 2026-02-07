import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Task,
  TaskDetail,
  CreateTaskDto,
  UpdateTaskDto,
  TaskListParams,
} from '@assessment-task/data';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private base = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(params?: TaskListParams): Observable<Task[]> {
    let httpParams = new HttpParams();
    if (params?.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<Task[]>(this.base, { params: httpParams });
  }

  getTask(id: string): Observable<TaskDetail> {
    return this.http.get<TaskDetail>(`${this.base}/${id}`);
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.base, dto);
  }

  update(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${id}`);
  }
}
