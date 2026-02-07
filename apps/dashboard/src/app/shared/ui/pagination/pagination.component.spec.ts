import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginationComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pageIndex', 0);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('total', 50);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('rangeLabel', 'user(s)');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rangeText should show correct range', () => {
    expect(component.rangeText).toContain('1-10');
    expect(component.rangeText).toContain('50');
    expect(component.rangeText).toContain('user(s)');
  });

  it('prev should emit pageChange when not on first page', () => {
    fixture.componentRef.setInput('pageIndex', 1);
    fixture.detectChanges();
    const spy = jest.fn();
    component.pageChange.subscribe(spy);
    component.prev();
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('prev should not emit when on first page', () => {
    const spy = jest.fn();
    component.pageChange.subscribe(spy);
    component.prev();
    expect(spy).not.toHaveBeenCalled();
  });

  it('next should emit pageChange when not on last page', () => {
    const spy = jest.fn();
    component.pageChange.subscribe(spy);
    component.next();
    expect(spy).toHaveBeenCalledWith(1);
  });
});
