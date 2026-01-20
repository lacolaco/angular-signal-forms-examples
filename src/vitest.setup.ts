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
 */
beforeAll(async () => {
  await worker.start();
});

/**
 * 各テスト後: ハンドラをリセットして副作用を防ぐ
 */
afterEach(() => worker.resetHandlers());

/**
 * 全テスト終了後: MSW worker を停止
 */
afterAll(() => worker.stop());
