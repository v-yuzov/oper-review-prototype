import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TuiRoot, RouterOutlet],
  template: `
    <tui-root>
      <main class="layout">
        <router-outlet />
      </main>
    </tui-root>
  `,
  styles: [
    `
      .layout {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
      }
    `,
  ],
})
export class AppComponent {}
