import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import {
  form,
  FormField,
  FormValueControl,
  required,
  maxLength,
  validate,
  submit,
} from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

interface ReviewData {
  rating: number;
  comment: string;
}

/**
 * StarRating Component
 *
 * Signal Forms のカスタムフォームコントロール実装例。
 * FormValueControl<number> インターフェースを実装し、
 * [formField] ディレクティブと連携する。
 *
 * ## 学習ポイント
 * - FormValueControl インターフェースの実装
 * - model() によるフォームとの双方向バインディング
 * - キーボードアクセシビリティ（左右矢印キー対応）
 * - ARIA属性による適切なアクセシビリティ
 */
@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center gap-1',
    role: 'radiogroup',
    'aria-label': 'Rating',
    '(mouseleave)': 'hoveredStar.set(0)',
  },
  template: `
    @for (star of stars; track star) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="value() >= star"
        [attr.aria-label]="star + ' star'"
        [class]="
          'text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-colors ' +
          starClassList()[star]
        "
        (mouseenter)="hoveredStar.set(star)"
        (click)="selectStar(star)"
        (keydown)="onKeydown($event)"
      >
        ★
      </button>
    }
  `,
})
export class StarRating implements FormValueControl<number> {
  /** フォームにバインドされる値（0-5の整数） */
  readonly value = model(0);

  /** ホバー中の星（0はホバーなし） */
  protected readonly hoveredStar = signal(0);

  /** 5つの星を表す配列 */
  protected readonly stars = [1, 2, 3, 4, 5];

  /**
   * 各星のCSSクラスを計算
   * hover中は1からhover位置まで、それ以外は選択済みの星まで黄色にする
   */
  protected readonly starClassList = computed(() => {
    const hovered = this.hoveredStar();
    const selected = this.value();
    const classes: Record<number, string> = {};

    for (const star of this.stars) {
      if (hovered > 0) {
        classes[star] = star <= hovered ? 'text-yellow-300' : 'text-gray-300';
      } else {
        classes[star] = star <= selected ? 'text-yellow-400' : 'text-gray-300';
      }
    }
    return classes;
  });

  /**
   * 星をクリックして評価を選択
   */
  protected selectStar(star: number): void {
    this.value.set(star);
  }

  /**
   * キーボード操作のハンドリング
   * - 左矢印/下矢印: 評価を下げる
   * - 右矢印/上矢印: 評価を上げる
   * - Home: 最小値（1）に設定
   * - End: 最大値（5）に設定
   */
  protected onKeydown(event: KeyboardEvent): void {
    const current = this.value();
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        if (current < 5) {
          this.value.set(current + 1);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        if (current > 1) {
          this.value.set(current - 1);
        } else if (current === 0) {
          this.value.set(1);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.value.set(1);
        break;
      case 'End':
        event.preventDefault();
        this.value.set(5);
        break;
    }
  }
}

/**
 * Book Review Example
 *
 * Signal Forms のカスタムフォームコントロール実装例として、
 * 星5段階評価を含む書籍レビューフォームを作成。
 *
 * ## 学習ポイント
 * - カスタムコントロール（StarRating）の統合
 * - [formField] によるカスタムコントロールとの連携
 * - validate() によるカスタムバリデーション
 * - maxLength バリデータの使用
 */
@Component({
  selector: 'app-book-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExampleCard, StarRating],
  template: `
    <app-example-card
      title="Book Review"
      topic="Custom Control"
      description="「Signal Forms 入門」の評価をお願いします"
      sourcePath="examples/book-review.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <!-- 星評価 -->
        <div class="mb-4">
          <span class="block text-sm font-medium text-gray-700 mb-1"> Rating </span>
          <!--
            カスタムコントロールとの連携:
            StarRating は FormValueControl<number> を実装しているため、
            [formField] ディレクティブで直接バインド可能
          -->
          <app-star-rating [formField]="reviewForm.rating" />
          @if (ratingErrors().length > 0) {
            <ul class="mt-1 text-sm text-red-600">
              @for (message of ratingErrors(); track message) {
                <li>{{ message }}</li>
              }
            </ul>
          }
        </div>

        <!-- コメント -->
        <app-form-field class="mb-6" label="Comment" [errorMessages]="commentErrors()">
          <textarea
            [formField]="reviewForm.comment"
            rows="4"
            class="form-textarea aria-invalid:border-red-500"
            [aria-invalid]="reviewForm.comment().touched() && reviewForm.comment().invalid()"
            placeholder="この本についてのコメントを入力してください"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">{{ reviewForm.comment().value().length }} / 500</p>
        </app-form-field>

        <app-button type="submit"> Submit Review </app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success">
          Thank you for your review! (Rating: {{ submitted.rating }} stars)
        </div>
      }
    </app-example-card>
  `,
})
export class BookReview {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<ReviewData | null>(null);

  /**
   * フォームモデル
   *
   * rating: 0-5 の整数（0は未選択）
   * comment: 自由入力テキスト
   */
  readonly reviewModel = signal<ReviewData>({
    rating: 0,
    comment: '',
  });

  /**
   * フォーム定義
   *
   * - rating: カスタムバリデーションで1以上を必須とする
   * - comment: required + maxLength(500)
   */
  readonly reviewForm = form(this.reviewModel, (schema) => {
    // rating は 1以上の値が必要（0は未選択）
    validate(schema.rating, ({ value }) => {
      if (value() < 1) {
        return { kind: 'required', message: 'Please select a rating' };
      }
      return undefined;
    });

    required(schema.comment, { message: 'Comment is required' });
    maxLength(schema.comment, 500, { message: 'Comment must be 500 characters or less' });
  });

  readonly ratingErrors = computed(() => fieldErrors(this.reviewForm.rating()));
  readonly commentErrors = computed(() => fieldErrors(this.reviewForm.comment()));

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.reviewForm, async () => {
      this.submittedValue.set({ ...this.reviewModel() });
    });

    // invalid なフィールドにフォーカス
    if (this.reviewForm.rating().invalid()) {
      // StarRating の最初のボタンにフォーカス
      const firstStar = document.querySelector('app-star-rating button');
      if (firstStar instanceof HTMLElement) {
        firstStar.focus();
      }
    } else if (this.reviewForm.comment().invalid()) {
      this.reviewForm.comment().focusBoundControl();
    }
  }
}
