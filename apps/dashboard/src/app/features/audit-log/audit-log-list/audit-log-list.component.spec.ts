import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogListComponent } from './audit-log-list.component';
import { AuditApiService } from '../../../core/api/audit-api.service';
import { of, throwError } from 'rxjs';

describe('AuditLogListComponent', () => {
  let component: AuditLogListComponent;
  let fixture: ComponentFixture<AuditLogListComponent>;
  let auditApi: AuditApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogListComponent],
      providers: [{ provide: AuditApiService, useValue: { getAuditLog: jest.fn() } }],
    }).compileComponents();

    auditApi = TestBed.inject(AuditApiService) as any;
    (auditApi.getAuditLog as jest.Mock).mockReturnValue(of({ items: [], total: 0 }));

    fixture = TestBed.createComponent(AuditLogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load audit log on init', () => {
    expect(auditApi.getAuditLog).toHaveBeenCalledWith(1, 10);
  });

  it('setPage should update pageIndex and load', () => {
    (auditApi.getAuditLog as jest.Mock).mockClear();
    component.total.set(25);
    component.setPage(1);
    expect(component.pageIndex()).toBe(1);
    expect(auditApi.getAuditLog).toHaveBeenCalledWith(2, 10);
  });

  it('should handle load error by clearing entries', (done) => {
    (auditApi.getAuditLog as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(AuditLogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    setTimeout(() => {
      expect(component.entries()).toEqual([]);
      expect(component.total()).toBe(0);
      done();
    }, 50);
  });
});
