import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersApiService } from './users-api.service';
import { environment } from '../../../environments/environment';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersApiService],
    });
    service = TestBed.inject(UsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUsers should GET with pagination params', () => {
    service.getUsers(2, 10).subscribe((res) => {
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
    });
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/users'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0 });
  });

  it('getUsers should use default page and limit when not provided', () => {
    service.getUsers().subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/users'));
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0 });
  });

  it('getUser should GET by id', () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'User' } as any;
    service.getUser('u1').subscribe((u) => expect(u).toEqual(user));
    const req = httpMock.expectOne(`${environment.apiUrl}/users/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('create should POST user', () => {
    const dto = { email: 'new@b.com', password: 'pass', name: 'New' } as any;
    service.create(dto).subscribe((u) => expect(u.email).toBe('new@b.com'));
    const req = httpMock.expectOne(environment.apiUrl + '/users');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'u1', ...dto });
  });

  it('update should PUT user', () => {
    const dto = { name: 'Updated' } as any;
    service.update('u1', dto).subscribe((u) => expect(u.name).toBe('Updated'));
    const req = httpMock.expectOne(`${environment.apiUrl}/users/u1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'u1', ...dto });
  });

  it('delete should DELETE user by id', () => {
    service.delete('u1').subscribe((res) => expect(res.deleted).toBe(true));
    const req = httpMock.expectOne(`${environment.apiUrl}/users/u1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });
});
