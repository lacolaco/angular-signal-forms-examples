import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppSourceLink } from './source-link';

/**
 * AppExampleCard
 *
 * サンプルページ共通のレイアウトコンポーネント。
 * タイトル・トピック・説明・ソースリンクを統一的に表示する。
 *
 * ## 使い方
 * ```html
 * <app-example-card
 *   title="Pizza Order"
 *   topic="Conditional Form"
 *   description="注文内容を入力してください"
 *   sourcePath="examples/pizza-order.ts"
 * >
 *   <form>...</form>
 * </app-example-card>
 * ```
 */
@Component({
  selector: 'app-example-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSourceLink],
  template: `
    <div class="page-container">
      <div class="form-card">
        <h1 class="form-heading">{{ title() }}</h1>
        <p class="form-topic">{{ topic() }}</p>
        <p class="form-description">{{ description() }}</p>

        <ng-content />

        <app-source-link class="mt-6" [path]="sourcePath()" />
      </div>
    </div>
  `,
})
export class AppExampleCard {
  /** ページタイトル */
  readonly title = input.required<string>();
  /** トピック（学習ポイントの種類） */
  readonly topic = input.required<string>();
  /** 説明文 */
  readonly description = input.required<string>();
  /** GitHubソースへのパス */
  readonly sourcePath = input.required<string>();
}
