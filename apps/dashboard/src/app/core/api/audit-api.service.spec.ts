import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditApiService } from './audit-api.service';
import { environment } from '../../../environments/environment';

describe('AuditApiService', () => {
  let service: AuditApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditApiService],
    });
    service = TestBed.inject(AuditApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAuditLog should GET with page and limit', () => {
    service.getAuditLog(2, 20).subscribe((res) => {
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
    });
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/audit-log'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [], total: 0 });
  });

  it('getAuditLog should use defaults when no params', () => {
    service.getAuditLog().subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith(environment.apiUrl + '/audit-log'));
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0 });
  });
});
