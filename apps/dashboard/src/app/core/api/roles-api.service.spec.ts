import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RolesApiService } from './roles-api.service';
import { environment } from '../../../environments/environment';

describe('RolesApiService', () => {
  let service: RolesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RolesApiService],
    });
    service = TestBed.inject(RolesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getRoles should GET with pagination', () => {
    service.getRoles(1, 10).subscribe((res) => {
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
    });
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/roles'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0 });
  });

  it('getRoles should use default page and limit when not provided', () => {
    service.getRoles().subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/roles'));
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0 });
  });

  it('getRole should GET by id', () => {
    const role = { id: 'r1', name: 'Admin', slug: 'admin' } as any;
    service.getRole('r1').subscribe((r) => expect(r).toEqual(role));
    const req = httpMock.expectOne(`${environment.apiUrl}/roles/r1`);
    expect(req.request.method).toBe('GET');
    req.flush(role);
  });

  it('create should POST role', () => {
    const dto = { name: 'Editor', slug: 'editor' } as any;
    service.create(dto).subscribe((r) => expect(r.name).toBe('Editor'));
    const req = httpMock.expectOne(environment.apiUrl + '/roles');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'r1', ...dto });
  });

  it('update should PUT role', () => {
    const dto = { name: 'Updated' } as any;
    service.update('r1', dto).subscribe((r) => expect(r.name).toBe('Updated'));
    const req = httpMock.expectOne(`${environment.apiUrl}/roles/r1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'r1', ...dto });
  });

  it('delete should DELETE role by id', () => {
    service.delete('r1').subscribe((res) => expect(res.deleted).toBe(true));
    const req = httpMock.expectOne(`${environment.apiUrl}/roles/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });
});
