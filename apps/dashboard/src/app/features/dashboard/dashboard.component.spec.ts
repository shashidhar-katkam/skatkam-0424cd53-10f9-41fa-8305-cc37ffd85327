import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth/auth.service';
import { TasksApiService } from '../../core/api/tasks-api.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockAuth = {
    user: () => ({ id: '1', name: 'Test', email: 'a@b.com', role: 'admin' }),
    hasPermission: jest.fn().mockReturnValue(true),
  };
  const mockTasksApi = {
    getTasks: jest.fn().mockReturnValue(of([])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: TasksApiService, useValue: mockTasksApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute summary from tasks', () => {
    component.tasks.set([
      { id: '1', status: 'todo' } as any,
      { id: '2', status: 'done' } as any,
    ]);
    expect(component.summary().total).toBe(2);
    expect(component.summary().todo).toBe(1);
    expect(component.summary().done).toBe(1);
  });

  it('canViewTasks should use auth.hasPermission', () => {
    (mockAuth.hasPermission as jest.Mock).mockReturnValue(true);
    expect(component.canViewTasks()).toBe(true);
    (mockAuth.hasPermission as jest.Mock).mockReturnValue(false);
    expect(component.canViewTasks()).toBe(false);
  });

  it('summary should count in_progress status', () => {
    component.tasks.set([
      { id: '1', status: 'in_progress' } as any,
      { id: '2', status: 'in_progress' } as any,
    ]);
    expect(component.summary().inProgress).toBe(2);
    expect(component.summary().total).toBe(2);
  });

  it('summary should use todo as default when status missing', () => {
    component.tasks.set([{ id: '1' } as any]);
    expect(component.summary().todo).toBe(1);
  });

  it('completionPercent should return 0 when total is 0', () => {
    component.tasks.set([]);
    expect(component.completionPercent()).toBe(0);
  });

  it('completionPercent should calculate when tasks exist', () => {
    component.tasks.set([
      { id: '1', status: 'done' } as any,
      { id: '2', status: 'done' } as any,
      { id: '3', status: 'todo' } as any,
    ]);
    expect(component.completionPercent()).toBe(67);
  });

  it('barWidth should return 0 when total is 0', () => {
    component.tasks.set([]);
    expect(component.barWidth('todo')).toBe(0);
  });

  it('barWidth should calculate percentage per status', () => {
    component.tasks.set([
      { id: '1', status: 'todo' } as any,
      { id: '2', status: 'todo' } as any,
      { id: '3', status: 'done' } as any,
    ]);
    expect(component.barWidth('todo')).toBeCloseTo(66.67, 1);
    expect(component.barWidth('done')).toBeCloseTo(33.33, 1);
    expect(component.barWidth('in_progress')).toBe(0);
  });
});
