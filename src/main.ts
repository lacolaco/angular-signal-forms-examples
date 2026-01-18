import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { isDevMode } from '@angular/core';

async function prepareApp() {
  if (isDevMode()) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepareApp().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)));
