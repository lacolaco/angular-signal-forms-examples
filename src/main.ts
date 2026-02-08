import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function prepareApp() {
  const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${baseHref}mockServiceWorker.js`, options: { scope: baseHref } },
  });
}

prepareApp().then(() => bootstrapApplication(App, appConfig).catch((err) => console.error(err)));
