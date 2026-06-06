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
import { MarkdownRenderer } from './app/lib/markdown';

/**
 * テスト中は AppExamplePage の README レンダリングを抑止する。
 * 本物の render は marked + shiki の非同期 init を行い、テスト DOM に
 * サンプル内コードと同じテキスト（例: "Passwords do not match"）を
 * 重複出力するため `screen.getByText` 等で誤マッチを起こす。
 *
 * 既存 spec の見出しアサーション `getByRole('heading', { name: /xxx/ })` を
 * 維持するため、README 冒頭の `# Heading` 1 行だけは h1 として残す。
 */
MarkdownRenderer.prototype.render = async (raw: string) => {
  const m = raw.match(/^#\s+(.+)$/m);
  return m ? `<h1>${m[1]}</h1>` : '';
};

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
