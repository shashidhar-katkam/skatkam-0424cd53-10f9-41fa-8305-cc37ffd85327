import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RoleListComponent } from './role-list.component';
import { AuthService } from '../../../core/auth/auth.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { of } from 'rxjs';

describe('RoleListComponent', () => {
  let component: RoleListComponent;
  let fixture: ComponentFixture<RoleListComponent>;
  let rolesApi: RolesApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleListComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { hasPermission: () => false } },
        { provide: RolesApiService, useValue: { getRoles: jest.fn(), delete: jest.fn() } },
      ],
    }).compileComponents();

    rolesApi = TestBed.inject(RolesApiService) as any;
    (rolesApi.getRoles as jest.Mock).mockReturnValue(of({ items: [], total: 0 }));

    fixture = TestBed.createComponent(RoleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    expect(rolesApi.getRoles).toHaveBeenCalledWith(1, 10);
  });

  it('permissionCount should count true permissions', () => {
    const role = { id: '1', name: 'Admin', permissions: { 'a': true, 'b': false, 'c': true } } as any;
    expect(component.permissionCount(role)).toBe(2);
  });

  it('permissionCount should return 0 for invalid permissions', () => {
    expect(component.permissionCount({ permissions: null } as any)).toBe(0);
  });

  it('totalPages should be at least 1', () => {
    component.total.set(0);
    expect(component.totalPages()).toBe(1);
  });
});
