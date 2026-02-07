import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TasksApiService } from './tasks-api.service';
import { environment } from '../../../environments/environment';

describe('TasksApiService', () => {
  let service: TasksApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksApiService],
    });
    service = TestBed.inject(TasksApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTasks should GET with optional params', () => {
    service.getTasks().subscribe((tasks) => expect(tasks).toEqual([]));
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/tasks'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTasks should include sortBy and sortOrder when provided', () => {
    service.getTasks({ sortBy: 'createdAt', sortOrder: 'desc' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/tasks'));
    expect(req.request.params.get('sortBy')).toBe('createdAt');
    expect(req.request.params.get('sortOrder')).toBe('desc');
    req.flush([]);
  });

  it('getTasks should include status and category when provided', () => {
    service.getTasks({ status: 'todo', category: 'work' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/tasks'));
    expect(req.request.params.get('status')).toBe('todo');
    expect(req.request.params.get('category')).toBe('work');
    req.flush([]);
  });

  it('getTask should GET by id', () => {
    const taskDetail = { id: 't1', title: 'Task', status: 'todo' } as any;
    service.getTask('t1').subscribe((t) => expect(t).toEqual(taskDetail));
    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/t1`);
    expect(req.request.method).toBe('GET');
    req.flush(taskDetail);
  });

  it('create should POST task', () => {
    const dto = { title: 'New', status: 'todo' } as any;
    service.create(dto).subscribe((t) => expect(t.title).toBe('New'));
    const req = httpMock.expectOne(environment.apiUrl + '/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ ...dto, id: 't1' });
  });

  it('update should PUT task', () => {
    const dto = { title: 'Updated' } as any;
    service.update('t1', dto).subscribe((t) => expect(t.title).toBe('Updated'));
    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/t1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 't1', ...dto });
  });

  it('delete should DELETE task', () => {
    service.delete('t1').subscribe((res) => expect(res.deleted).toBe(true));
    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });
});
