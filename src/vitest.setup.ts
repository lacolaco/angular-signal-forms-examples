/// <reference types="vitest/globals" />
/// <reference types="vitest/browser" />

/**
 * Vitest グローバルセットアップファイル
 *
 * angular.json の test.options.setupFiles で指定され、
 * 全テストファイルの実行前に自動的に読み込まれる。
 *
 * MSW (Mock Service Worker) をブラウザモードで初期化し、
 * API モックを有効化する。
 */

import { worker } from './mocks/browser';

/**
 * 全テスト実行前: MSW worker を起動
 *
 * worker.stop() は呼ばない。@angular/build:unit-test は isolate: false が
 * 既定で、ファイルごとの afterAll で worker.stop() を呼ぶと他ファイルの
 * テスト実行中に MSW が無効化されて race を起こす。ブラウザコンテキスト
 * 自体が test run 終了時に破棄されるので明示停止は不要。
 */
beforeAll(async () => {
  await worker.start();
});

/**
 * 各テスト後: ハンドラをリセットして副作用を防ぐ
 */
afterEach(() => worker.resetHandlers());
