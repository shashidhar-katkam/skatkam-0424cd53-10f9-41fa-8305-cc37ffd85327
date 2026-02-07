import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserListComponent } from './user-list.component';
import { AuthService } from '../../../core/auth/auth.service';
import { UsersApiService } from '../../../core/api/users-api.service';
import { of } from 'rxjs';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let usersApi: UsersApiService;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { user: () => null, hasPermission: () => false } },
        { provide: UsersApiService, useValue: { getUsers: jest.fn(), delete: jest.fn() } },
      ],
    }).compileComponents();

    usersApi = TestBed.inject(UsersApiService) as any;
    (usersApi.getUsers as jest.Mock).mockReturnValue(of({ items: [], total: 0 }));

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(usersApi.getUsers).toHaveBeenCalledWith(1, 10);
  });

  it('paginatedRange should return 0-0 when total is 0', () => {
    component.total.set(0);
    expect(component.paginatedRange()).toBe('0-0');
  });

  it('paginatedRange should return range for page 0', () => {
    component.total.set(25);
    component.pageIndex.set(0);
    expect(component.paginatedRange()).toBe('1-10');
  });

  it('currentUserId should return auth user id', () => {
    (auth as any).user = () => ({ id: 'u1' });
    expect(component.currentUserId()).toBe('u1');
  });

  it('canEdit should return true when user has create or update permission', () => {
    (auth as any).hasPermission = (p: string) => p === 'users.create_users';
    expect(component.canEdit()).toBe(true);
  });
});
