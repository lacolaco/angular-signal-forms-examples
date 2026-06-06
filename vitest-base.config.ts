import { defineConfig } from 'vitest/config';

/**
 * Vitest base config consumed by Angular の `@angular/build:unit-test` builder
 * （`runnerConfig: true`）。
 *
 * v22 の unit-test builder は build の `externalPackages: true` から得た
 * `implicitBrowser` 一覧をそのまま vite の `optimizeDeps.include` に投入し、
 * 同時に同パッケージを esbuild の external に並べる。msw はこの両側に載った
 * 結果、prebundle で「entry point "msw" cannot be marked as external」を吐く。
 * `exclude` だけでは include 側が剥がれないため、`configResolved` で
 * include 配列から msw を除去している。
 *
 * 参考: https://github.com/angular/angular-cli/issues/32523
 */
export default defineConfig({
  optimizeDeps: {
    exclude: ['msw', 'msw/browser'],
  },
  plugins: [
    {
      name: 'strip-msw-from-optimize-deps-include',
      enforce: 'post',
      configResolved(config) {
        const include = config.optimizeDeps?.include;
        if (Array.isArray(include)) {
          const filtered = include.filter((id) => id !== 'msw' && id !== 'msw/browser');
          (config.optimizeDeps as { include: string[] }).include = filtered;
        }
      },
    },
  ],
});
