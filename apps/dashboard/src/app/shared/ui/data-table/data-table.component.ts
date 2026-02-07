import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  showPagination = input<boolean>(false);
  pageIndex = input<number>(0);
  totalPages = input<number>(1);
  total = input<number>(0);
  pageSize = input<number>(10);
  rangeLabel = input<string>('item(s)');
  pageChange = output<number>();
}
