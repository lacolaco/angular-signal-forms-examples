import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownRenderer } from '../markdown';
import { AppSourceLink } from './source-link';

const GITHUB_REPO = 'https://github.com/lacolaco/angular-signal-forms-examples';

/**
 * sourcePath（例: `examples/simple-signup/simple-signup.ts`）が指すソースの
 * 親ディレクトリを GitHub blob URL のベースとして、README 内の `./xxx` 相対
 * リンクを絶対 URL に解決する関数を返す。外部 URL・フラグメントはそのまま。
 */
function makeReadmeHrefResolver(sourcePath: string): (href: string) => string {
  const lastSlash = sourcePath.lastIndexOf('/');
  const dir = lastSlash >= 0 ? sourcePath.slice(0, lastSlash + 1) : '';
  const base = `${GITHUB_REPO}/blob/main/src/app/${dir}`;
  return (href: string) => {
    if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
      return href;
    }
    return base + href.replace(/^\.\//, '');
  };
}

/**
 * AppExamplePage
 *
 * 学習コンテンツとしてのサンプルページ共通レイアウト。
 * 左カラムに README.md をレンダリングし、右カラムにデモフォームを並べる
 * 2 カラム構成（モバイルは縦積み）。
 *
 * README は呼び出し元から文字列として import した Markdown を受け取り、
 * MarkdownRenderer (marked + shiki) で HTML に変換して表示する。
 * `.md` の文字列 import は angular.json の `loader: { ".md": "text" }` 設定で有効化される。
 *
 * ## 使い方
 * ```ts
 * import readme from './README.md';
 * // ...
 * template: `
 *   <app-example-page
 *     [readme]="readme"
 *     sourcePath="examples/pizza-order/pizza-order.ts"
 *   >
 *     <form>...</form>
 *   </app-example-page>
 * `,
 * ```
 */
@Component({
  selector: 'app-example-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSourceLink],
  template: `
    <div class="example-page">
      <div class="example-layout">
        <article class="example-readme">
          @if (readmeHtml.value(); as html) {
            <div class="markdown-body" [innerHTML]="html"></div>
          } @else {
            <p class="text-sm text-gray-500">Loading explanation…</p>
          }
        </article>
        <aside class="example-demo">
          <div class="form-card">
            <ng-content />
          </div>
          <app-source-link class="mt-4" [path]="sourcePath()" />
        </aside>
      </div>
    </div>
  `,
})
export class AppExamplePage {
  private readonly markdown = inject(MarkdownRenderer);
  private readonly sanitizer = inject(DomSanitizer);

  /** README.md の Markdown 文字列（`import readme from './README.md'` で受け取る） */
  readonly readme = input.required<string>();
  /** GitHub ソースへのリポジトリ内パス */
  readonly sourcePath = input.required<string>();

  private readonly hrefResolver = computed(() => makeReadmeHrefResolver(this.sourcePath()));

  readonly readmeHtml = resource({
    params: () => ({ raw: this.readme(), resolveHref: this.hrefResolver() }),
    loader: async ({ params }) => {
      const html = await this.markdown.render(params.raw, {
        resolveHref: params.resolveHref,
      });
      // 信頼できる build-time 埋め込みなので shiki の inline style を保つため bypass
      return this.sanitizer.bypassSecurityTrustHtml(html);
    },
  });
}
