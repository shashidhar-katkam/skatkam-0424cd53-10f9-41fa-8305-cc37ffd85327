import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-block.component.html',
  styleUrl: './loading-block.component.scss',
})
export class LoadingBlockComponent {
  message = 'Loading...';
}
