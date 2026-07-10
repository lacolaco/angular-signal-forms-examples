import { Component, computed, signal } from '@angular/core';
import {
  form,
  FormField,
  min,
  required,
  submit,
  validate,
  validateTree,
  type FieldValidator,
  type ValidationError,
} from '@angular/forms/signals';
import { AppButton } from '../../lib/ui/button';
import { AppExamplePage } from '../../lib/ui/example-page';
import { AppFormField } from '../../lib/ui/form-field';
import { fieldErrors } from '../../lib/field-errors';
import readme from './README.md';

/** ホテル予約検索クエリ */
interface HotelSearchQuery {
  /** チェックイン日 (YYYY-MM-DD) */
  checkInDate: string;
  /** チェックアウト日 (YYYY-MM-DD) */
  checkOutDate: string;
  /** 宿泊人数 */
  guests: number;
}

const INITIAL_QUERY: HotelSearchQuery = {
  checkInDate: '',
  checkOutDate: '',
  guests: 1,
};

/** 連続予約可能な最大泊数 */
const MAX_STAY_DAYS = 30;

/**
 * factory: 引数で「最小日付」を受け取り、`FieldValidator<string>` を返す。
 *
 * 同じロジックを別の field に複数回適用するために validator を関数として
 * 切り出す。引数で振る舞いを差し替えられるため、チェックイン日にも
 * チェックアウト日にも (別メッセージで) 再利用できる。
 */
function dateAtLeast(minIsoDate: string, message: string): FieldValidator<string> {
  return ({ value }) => {
    const v = value();
    if (!v) return undefined;
    if (v < minIsoDate) {
      return { kind: 'dateAtLeast', message };
    }
    return undefined;
  };
}

/** YYYY-MM-DD 形式の日付文字列同士の日数差を計算 */
function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * ユーザーのローカルカレンダー日付を YYYY-MM-DD で取得。
 *
 * `<input type="date">.value` はローカルカレンダーの年月日を返すので、
 * それと比較する「今日」もローカル基準で組み立てる必要がある。
 * `toISOString().slice(0, 10)` は UTC 基準のため、JST など UTC+ なゾーンでは
 * 真夜中から数時間「昨日」を「今日以降」と誤判定する。
 */
function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Hotel Search Example
 *
 * 独自バリデータの作り方を学ぶサンプル。Simple Signup が示す
 * 「`validate()` 1 回利用」よりも踏み込み、`validate()` の戻り値 3 形
 * (`undefined` / 単一エラー / エラー配列)、factory パターンによる
 * validator の再利用、`validateTree()` で親パスから子 field を
 * ターゲットする cross-field の書き方をまとめて見せる。
 *
 * ## 学習ポイント
 * - `validate()` の戻り値: `undefined` (pass) / 単一エラー / エラー配列の使い分け
 * - validator factory: 引数で振る舞いを切り替え、複数 field に再利用
 * - `validateTree()` + `fieldTreeOf()`: 親パスで cross-field を宣言し、
 *   エラーを特定の子 field にターゲットする
 */
@Component({
  selector: 'app-hotel-search',
  imports: [FormField, AppFormField, AppButton, AppExamplePage],
  template: `
    <app-example-page [readme]="readme" sourcePath="examples/hotel-search/hotel-search.ts">
      <form novalidate (submit)="onSubmit($event)">
        <app-form-field class="mb-4" label="Check-in date" [errorMessages]="checkInDateErrors()">
          <input
            type="date"
            [formField]="searchForm.checkInDate"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="
              searchForm.checkInDate().touched() && searchForm.checkInDate().invalid()
            "
          />
        </app-form-field>

        <app-form-field class="mb-4" label="Check-out date" [errorMessages]="checkOutDateErrors()">
          <input
            type="date"
            [formField]="searchForm.checkOutDate"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="
              searchForm.checkOutDate().touched() && searchForm.checkOutDate().invalid()
            "
          />
        </app-form-field>

        <app-form-field class="mb-6" label="Guests" [errorMessages]="guestsErrors()">
          <input
            type="number"
            [formField]="searchForm.guests"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="searchForm.guests().touched() && searchForm.guests().invalid()"
          />
        </app-form-field>

        <app-button type="submit">Search hotels</app-button>
      </form>

      @if (submittedQuery(); as query) {
        <div class="form-success" role="status">
          Search submitted!
          <ul class="mt-2 text-sm list-disc list-inside">
            <li>Check-in: {{ query.checkInDate }}</li>
            <li>Check-out: {{ query.checkOutDate }}</li>
            <li>Guests: {{ query.guests }}</li>
          </ul>
        </div>
      }
    </app-example-page>
  `,
})
export class HotelSearch {
  protected readonly readme = readme;

  /** 送信時点のスナップショット (null なら未送信) */
  readonly submittedQuery = signal<HotelSearchQuery | null>(null);

  /** フォームモデル */
  readonly queryModel = signal<HotelSearchQuery>({ ...INITIAL_QUERY });

  /**
   * フォーム定義
   *
   * - 必須・最小値は組み込みバリデータでカバー (脇役)
   * - チェックイン日/チェックアウト日には `dateAtLeast(today, message)` factory を共有
   * - 親パス (`s`) に `validateTree()` を 1 つ書き、cross-field を集約
   */
  readonly searchForm = form(this.queryModel, (s) => {
    const today = todayIso();

    required(s.checkInDate, { message: 'Check-in date is required' });
    required(s.checkOutDate, { message: 'Check-out date is required' });
    min(s.guests, 1, { message: 'Guests must be at least 1' });

    // factory パターン: 同じ validator を 2 field で再利用
    validate(s.checkInDate, dateAtLeast(today, 'チェックイン日は今日以降の日付を指定してください'));
    validate(
      s.checkOutDate,
      dateAtLeast(today, 'チェックアウト日は今日以降の日付を指定してください'),
    );

    // validateTree: 親パスから子 field を `fieldTree` でターゲット
    // 違反が 2 つ同時に起こるケースを表現するため、エラー配列を返す形を採用
    validateTree(s, ({ value, fieldTreeOf }) => {
      const v = value();
      if (!v.checkInDate || !v.checkOutDate) {
        return undefined;
      }

      const errors: ValidationError.WithOptionalFieldTree[] = [];

      if (v.checkInDate >= v.checkOutDate) {
        errors.push({
          kind: 'invalidDateRange',
          message: 'チェックアウト日はチェックイン日より後にしてください',
          fieldTree: fieldTreeOf(s.checkOutDate),
        });
      }

      const nights = daysBetween(v.checkInDate, v.checkOutDate);
      if (nights > MAX_STAY_DAYS) {
        errors.push({
          kind: 'stayTooLong',
          message: `連続予約は ${MAX_STAY_DAYS} 泊までです`,
          fieldTree: fieldTreeOf(s.checkInDate),
        });
      }

      return errors.length > 0 ? errors : undefined;
    });
  });

  readonly checkInDateErrors = computed(() => fieldErrors(this.searchForm.checkInDate()));
  readonly checkOutDateErrors = computed(() => fieldErrors(this.searchForm.checkOutDate()));
  readonly guestsErrors = computed(() => fieldErrors(this.searchForm.guests()));

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.searchForm, async () => {
      this.submittedQuery.set({ ...this.queryModel() });
    });

    const fields = [
      this.searchForm.checkInDate,
      this.searchForm.checkOutDate,
      this.searchForm.guests,
    ];
    const firstInvalid = fields.find((f) => f().invalid());
    firstInvalid?.().focusBoundControl();
  }
}
