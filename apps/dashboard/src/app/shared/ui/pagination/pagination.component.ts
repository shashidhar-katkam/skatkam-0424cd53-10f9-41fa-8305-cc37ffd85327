import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { paginatedRange } from '../../utils/paginated-range';

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
    const range = paginatedRange(this.pageIndex(), this.pageSize(), tot);
    return 'Showing ' + range + ' of ' + tot + ' ' + this.rangeLabel();
  }

  prev(): void {
    if (this.pageIndex() > 0) this.pageChange.emit(this.pageIndex() - 1);
  }

  next(): void {
    if (this.pageIndex() < this.totalPages() - 1) this.pageChange.emit(this.pageIndex() + 1);
  }
}
