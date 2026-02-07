import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ShortcutItem {
  keys: string;
  description: string;
  context?: string;
}

@Component({
  selector: 'app-shortcuts-help-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70"
      (click)="close()"
    >
      <div
        class="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/80">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Keyboard shortcuts</h2>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-600 dark:hover:text-slate-200"
            (click)="close()"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
          <p class="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Use these shortcuts on the Tasks page to work faster.
          </p>
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th class="border-b border-slate-200 pb-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Key</th>
                <th class="border-b border-slate-200 pb-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody class="[&>tr]:border-b [&>tr]:border-slate-100 dark:[&>tr]:border-slate-700">
              @for (item of shortcuts; track item.keys) {
                <tr>
                  <td class="py-3 pr-4">
                    <kbd class="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">{{ item.keys }}</kbd>
                  </td>
                  <td class="py-3 text-slate-700 dark:text-slate-300">{{ item.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button type="button" class="btn-secondary" (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
})
export class ShortcutsHelpDialogComponent {
  closed = output<void>();

  readonly shortcuts: ShortcutItem[] = [
    { keys: '?', description: 'Show this keyboard shortcuts help' },
    { keys: 'N', description: 'Create a new task (when you have permission)' },
    { keys: 'E', description: 'Edit the currently viewed task (when task detail is open)' },
    { keys: 'Delete', description: 'Delete the currently viewed task (when task detail is open, with confirmation)' },
    { keys: 'Esc', description: 'Close the task detail or this help dialog' },
  ];

  close(): void {
    this.closed.emit();
  }
}
