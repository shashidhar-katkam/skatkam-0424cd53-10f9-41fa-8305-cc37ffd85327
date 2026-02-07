import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  pageIndex = input.required<number>();
  totalPages = input.required<number>();
  total = input.required<number>();
  pageSize = input.required<number>();
  rangeLabel = input<string>('item(s)');
  pageChange = output<number>();

  get rangeText(): string {
    const tot = this.total();
    if (tot === 0) return 'Showing 0-0';
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min((this.pageIndex() + 1) * this.pageSize(), tot);
    return 'Showing ' + start + '-' + end + ' of ' + tot + ' ' + this.rangeLabel();
  }

  prev(): void {
    if (this.pageIndex() > 0) this.pageChange.emit(this.pageIndex() - 1);
  }

  next(): void {
    if (this.pageIndex() < this.totalPages() - 1) this.pageChange.emit(this.pageIndex() + 1);
  }
}
