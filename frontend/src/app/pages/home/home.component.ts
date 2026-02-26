import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Оперревью</h1>
    <p>Прототип — бэкенд и веб-клиент.</p>
  `,
  styles: [],
})
export class HomeComponent {}
