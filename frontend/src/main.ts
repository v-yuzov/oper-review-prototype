import { Sanitizer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NgDompurifySanitizer } from '@taiga-ui/dompurify';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    { provide: Sanitizer, useClass: NgDompurifySanitizer },
  ],
}).catch((err) => console.error(err));
