import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  form,
  FormField,
  maxLength,
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

/** 出張申請モデル */
interface TripRequest {
  /** 出発日 (YYYY-MM-DD) */
  departureDate: string;
  /** 帰着日 (YYYY-MM-DD) */
  returnDate: string;
  /** 出張目的 */
  purpose: string;
  /** 概算予算 (円) */
  budget: number;
}

const INITIAL_TRIP: TripRequest = {
  departureDate: '',
  returnDate: '',
  purpose: '',
  budget: 0,
};

/** 申請可能な最大出張日数 */
const MAX_TRIP_DAYS = 14;

/**
 * factory: 引数で「最小日付」を受け取り、`FieldValidator<string>` を返す。
 *
 * 同じロジックを別の field に複数回適用するために validator を関数として
 * 切り出す。引数で振る舞いを差し替えられるため、出発日にも帰着日にも
 * （別メッセージで）再利用できる。
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
 * Business Trip Request Example
 *
 * 独自バリデータの作り方を学ぶサンプル。Simple Signup が示す
 * 「`validate()` 1 回利用」よりも踏み込み、`validate()` の戻り値 3 形
 * （`undefined` / 単一エラー / エラー配列）、factory パターンによる
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
  selector: 'app-business-trip-request',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExamplePage],
  template: `
    <app-example-page
      [readme]="readme"
      sourcePath="examples/business-trip-request/business-trip-request.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <app-form-field class="mb-4" label="Departure date" [errorMessages]="departureDateErrors()">
          <input
            type="date"
            [formField]="tripForm.departureDate"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="
              tripForm.departureDate().touched() && tripForm.departureDate().invalid()
            "
          />
        </app-form-field>

        <app-form-field class="mb-4" label="Return date" [errorMessages]="returnDateErrors()">
          <input
            type="date"
            [formField]="tripForm.returnDate"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="tripForm.returnDate().touched() && tripForm.returnDate().invalid()"
          />
        </app-form-field>

        <app-form-field class="mb-4" label="Purpose" [errorMessages]="purposeErrors()">
          <input
            type="text"
            [formField]="tripForm.purpose"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="tripForm.purpose().touched() && tripForm.purpose().invalid()"
          />
        </app-form-field>

        <app-form-field class="mb-6" label="Budget (JPY)" [errorMessages]="budgetErrors()">
          <input
            type="number"
            [formField]="tripForm.budget"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="tripForm.budget().touched() && tripForm.budget().invalid()"
          />
        </app-form-field>

        <app-button type="submit">Submit request</app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success" role="status">
          Request submitted!
          <ul class="mt-2 text-sm list-disc list-inside">
            <li>Departure: {{ submitted.departureDate }}</li>
            <li>Return: {{ submitted.returnDate }}</li>
            <li>Purpose: {{ submitted.purpose }}</li>
            <li>Budget: {{ submitted.budget }}</li>
          </ul>
        </div>
      }
    </app-example-page>
  `,
})
export class BusinessTripRequest {
  protected readonly readme = readme;

  /** 送信時点のスナップショット (null なら未送信) */
  readonly submittedValue = signal<TripRequest | null>(null);

  /** フォームモデル */
  readonly tripModel = signal<TripRequest>({ ...INITIAL_TRIP });

  /**
   * フォーム定義
   *
   * - 必須・長さ・最小値は組み込みバリデータでカバー (脇役)
   * - 出発日/帰着日には `dateAtLeast(today, message)` factory を共有
   * - 親パス (`s`) に `validateTree()` を 1 つ書き、cross-field を集約
   */
  readonly tripForm = form(this.tripModel, (s) => {
    const today = todayIso();

    required(s.departureDate, { message: 'Departure date is required' });
    required(s.returnDate, { message: 'Return date is required' });
    required(s.purpose, { message: 'Purpose is required' });
    maxLength(s.purpose, 200, { message: 'Purpose must be 200 characters or fewer' });
    min(s.budget, 1, { message: 'Budget must be at least 1' });

    // factory パターン: 同じ validator を 2 field で再利用
    validate(s.departureDate, dateAtLeast(today, '出発日は今日以降を指定してください'));
    validate(s.returnDate, dateAtLeast(today, '帰着日は今日以降を指定してください'));

    // validateTree: 親パスから子 field を `fieldTree` でターゲット
    // 違反が 2 つ同時に起こるケースを表現するため、エラー配列を返す形を採用
    validateTree(s, ({ value, fieldTreeOf }) => {
      const v = value();
      if (!v.departureDate || !v.returnDate) {
        return undefined;
      }

      const errors: ValidationError.WithOptionalFieldTree[] = [];

      if (v.departureDate > v.returnDate) {
        errors.push({
          kind: 'invalidDateRange',
          message: '帰着日は出発日以降にしてください',
          fieldTree: fieldTreeOf(s.returnDate),
        });
      }

      const days = daysBetween(v.departureDate, v.returnDate);
      if (days > MAX_TRIP_DAYS) {
        errors.push({
          kind: 'tripTooLong',
          message: `出張期間は ${MAX_TRIP_DAYS} 日以内にしてください`,
          fieldTree: fieldTreeOf(s.departureDate),
        });
      }

      return errors.length > 0 ? errors : undefined;
    });
  });

  readonly departureDateErrors = computed(() => fieldErrors(this.tripForm.departureDate()));
  readonly returnDateErrors = computed(() => fieldErrors(this.tripForm.returnDate()));
  readonly purposeErrors = computed(() => fieldErrors(this.tripForm.purpose()));
  readonly budgetErrors = computed(() => fieldErrors(this.tripForm.budget()));

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.tripForm, async () => {
      this.submittedValue.set({ ...this.tripModel() });
    });

    const fields = [
      this.tripForm.departureDate,
      this.tripForm.returnDate,
      this.tripForm.purpose,
      this.tripForm.budget,
    ];
    const firstInvalid = fields.find((f) => f().invalid());
    firstInvalid?.().focusBoundControl();
  }
}
