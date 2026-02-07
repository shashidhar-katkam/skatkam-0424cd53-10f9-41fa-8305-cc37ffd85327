import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PermissionsApiService } from './permissions-api.service';
import { environment } from '../../../environments/environment';

describe('PermissionsApiService', () => {
  let service: PermissionsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermissionsApiService],
    });
    service = TestBed.inject(PermissionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStructure should GET structure', () => {
    const structure = { modules: [] } as any;
    service.getStructure().subscribe((s) => expect(s).toEqual(structure));
    const req = httpMock.expectOne(`${environment.apiUrl}/permissions/structure`);
    expect(req.request.method).toBe('GET');
    req.flush(structure);
  });

  it('sync should POST to sync', () => {
    const response = {
      success: true,
      message: 'ok',
      stats: {
        modulesCreated: 0,
        modulesUpdated: 1,
        featuresCreated: 0,
        featuresUpdated: 0,
        totalModules: 1,
        totalFeatures: 5,
      },
    };
    service.sync().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.stats.totalModules).toBe(1);
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/permissions/sync`);
    expect(req.request.method).toBe('POST');
    req.flush(response);
  });
});
