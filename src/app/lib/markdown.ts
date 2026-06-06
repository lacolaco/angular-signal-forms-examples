import { Service } from '@angular/core';
import { Marked } from 'marked';
import type { HighlighterCore } from 'shiki/core';

/**
 * MarkdownRenderer.render に渡す追加オプション
 */
export interface RenderOptions {
  /**
   * Markdown 中の相対リンク (`./xxx.ts` 等) を絶対 URL に解決する関数。
   * 未指定の場合は href をそのまま使う。外部リンク (`http(s)://...`) や
   * フラグメント (`#xxx`) は呼び出し前に除外しても良いし resolver 側で
   * passthrough にしても良い。
   */
  resolveHref?: (href: string) => string;
}

/**
 * Markdown → HTML 変換サービス
 *
 * marked + shiki の組み合わせで README.md をレンダリングする。
 * shiki は fine-grained import + JavaScript エンジンで構成し、
 * SSR/prerender 含め WASM 不要で動作する。
 *
 * highlighter はアプリ起動中シングルトンとして遅延初期化される。
 * render() ごとに `Marked` インスタンスを新規生成するのは、link resolver が
 * 呼び出しごとに異なる（example ごとに GitHub ベース URL が異なる）ため。
 */
@Service()
export class MarkdownRenderer {
  private highlighterPromise: Promise<HighlighterCore> | null = null;

  async render(raw: string, options: RenderOptions = {}): Promise<string> {
    const highlighter = await this.getHighlighter();
    const loadedLangs = new Set(highlighter.getLoadedLanguages());
    const { resolveHref } = options;

    const m = new Marked({
      async: true,
      gfm: true,
      renderer: {
        code({ text, lang }) {
          const language = lang && loadedLangs.has(lang) ? lang : 'text';
          return highlighter.codeToHtml(text, {
            lang: language,
            theme: 'github-light',
          });
        },
        link({ href, title, text }) {
          const resolved = resolveHref ? resolveHref(href) : href;
          const isExternal = /^https?:\/\//.test(resolved);
          const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
          const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a href="${escapeAttr(resolved)}"${titleAttr}${targetAttr}>${text}</a>`;
        },
      },
    });

    return m.parse(raw, { async: true });
  }

  private getHighlighter(): Promise<HighlighterCore> {
    if (!this.highlighterPromise) {
      this.highlighterPromise = this.createHighlighter();
    }
    return this.highlighterPromise;
  }

  private async createHighlighter(): Promise<HighlighterCore> {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ]);

    return createHighlighterCore({
      themes: [import('@shikijs/themes/github-light')],
      langs: [
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/html'),
        import('@shikijs/langs/bash'),
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
