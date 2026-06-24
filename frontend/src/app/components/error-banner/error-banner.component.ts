import {
  ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked,
} from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="error-banner">
        <span>{{ message() }}</span>
        <button class="dismiss-btn" (click)="onDismiss()" aria-label="Dismiss">×</button>
      </div>
    }
  `,
  styles: [`
    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      margin-bottom: 1.5rem;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 10px;
      color: #f87171;
      font-size: 0.9375rem;
    }

    .dismiss-btn {
      background: none;
      border: none;
      color: #f87171;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;
      opacity: 0.7;
      flex-shrink: 0;

      &:hover { opacity: 1; }
    }
  `],
})
export class ErrorBannerComponent {
  message = input<string | null>(null);
  dismissed = output<void>();

  private internalDismissed = signal(false);
  protected visible = computed(() => !!this.message() && !this.internalDismissed());

  constructor() {
    effect(() => {
      this.message();
      untracked(() => this.internalDismissed.set(false));
    });
  }

  onDismiss(): void {
    this.internalDismissed.set(true);
    this.dismissed.emit();
  }
}
