import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentationComponent } from './documentation.component';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

describe('DocumentationComponent', () => {
  let component: DocumentationComponent;
  let fixture: ComponentFixture<DocumentationComponent>;
  let authMock: { getToken: jest.Mock };
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(async () => {
    authMock = { getToken: jest.fn().mockReturnValue(null) };
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DocumentationComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(DocumentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openSwagger should open URL with token when auth has token', () => {
    authMock.getToken.mockReturnValue('my-token');
    component.openSwagger();
    expect(window.open).toHaveBeenCalledWith(
      `${environment.apiUrl}/api-docs?token=${encodeURIComponent('my-token')}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('openSwagger should open URL with token from localStorage when auth has no token', () => {
    authMock.getToken.mockReturnValue(null);
    localStorage.setItem('task_jwt', 'stored-token');
    component.openSwagger();
    expect(window.open).toHaveBeenCalledWith(
      `${environment.apiUrl}/api-docs?token=${encodeURIComponent('stored-token')}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('openSwagger should open base URL when no token', () => {
    authMock.getToken.mockReturnValue(null);
    component.openSwagger();
    expect(window.open).toHaveBeenCalledWith(
      `${environment.apiUrl}/api-docs`,
      '_blank',
      'noopener,noreferrer'
    );
  });
});
