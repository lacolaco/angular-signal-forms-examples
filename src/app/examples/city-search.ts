import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { debounce, form, FormField, required, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

/**
 * 都市検索オートコンプリートのサンプル
 *
 * ## 学習ポイント
 * - httpResource() によるシグナルベースのHTTPリクエスト
 * - debounce() によるフォームスキーマレベルの入力遅延
 * - シグナル変更で自動リクエスト＆前リクエスト自動キャンセル
 * - 補完候補の表示と選択
 */
@Component({
  selector: 'app-city-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExampleCard],
  template: `
    <app-example-card
      title="City Search"
      topic="Autocomplete"
      description="httpResourceを使ったオートコンプリート検索"
      sourcePath="examples/city-search.ts"
    >
      <p class="text-xs text-gray-500 mb-6">
        2文字以上入力すると候補が表示されます。 例:
        <code class="bg-gray-100 px-1 rounded">To</code> (Tokyo, Toronto),
        <code class="bg-gray-100 px-1 rounded">Pa</code> (Paris, Prague)
      </p>

      <form novalidate (submit)="onSubmit($event)">
        <app-form-field class="mb-4" label="City" [errorMessages]="cityErrors()">
          <div class="relative">
            <input
              type="text"
              [formField]="searchForm.city"
              class="form-input"
              [class.invalid]="searchForm.city().touched() && searchForm.city().invalid()"
              autocomplete="off"
              (focus)="onFocus()"
              (blur)="onBlur()"
            />

            <!--
              httpResource の結果をリアクティブに表示。
              searchModel().city が変わるたびに自動でリクエストが発行され、
              前のリクエストは自動キャンセルされる（switchMap相当）。
            -->
            @if (showSuggestions() && suggestions.hasValue() && suggestions.value().length > 0) {
              <ul
                role="listbox"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                @for (city of suggestions.value(); track city) {
                  <li
                    role="option"
                    [attr.aria-selected]="searchModel().city === city"
                    class="px-4 py-2 cursor-pointer hover:bg-blue-50"
                    (mousedown)="selectCity(city)"
                  >
                    {{ city }}
                  </li>
                }
              </ul>
            }

            @if (suggestions.isLoading()) {
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <span class="text-gray-400 text-sm">検索中...</span>
              </div>
            }
          </div>
        </app-form-field>

        <app-button type="submit">Search</app-button>
      </form>

      @if (submittedCity(); as city) {
        <div class="form-success">
          <p>You selected: {{ city }}</p>
        </div>
      }
    </app-example-card>
  `,
})
export class CitySearch {
  /** 送信済みの都市名 */
  protected readonly submittedCity = signal<string | null>(null);

  /** 候補リストの表示状態 */
  protected readonly showSuggestions = signal(false);

  /** フォームモデル */
  readonly searchModel = signal({
    city: '',
  });

  /** フォーム定義 */
  readonly searchForm = form(this.searchModel, (schema) => {
    required(schema.city, { message: 'City is required' });
    debounce(schema.city, 300);
  });

  /** エラーメッセージ */
  readonly cityErrors = computed(() => fieldErrors(this.searchForm.city()));

  /**
   * httpResource による補完候補の取得
   *
   * searchModel().city を直接読み取り、変更のたびに自動リクエスト。
   * 前のリクエストは自動キャンセルされるため debounce 不要。
   * 2文字未満は undefined を返してリクエストをスキップ。
   */
  readonly suggestions = httpResource<string[]>(() => {
    const q = this.searchModel().city;
    if (q.length < 2) {
      return undefined;
    }
    return `/api/cities?q=${encodeURIComponent(q)}`;
  });

  protected onFocus(): void {
    this.showSuggestions.set(true);
  }

  protected onBlur(): void {
    // blur後すぐに閉じると候補クリックが効かないため少し遅延
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  /** 候補選択時 */
  protected selectCity(city: string): void {
    this.searchModel.update((v) => ({ ...v, city }));
    this.showSuggestions.set(false);
  }

  /** フォーム送信 */
  onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.searchForm, async () => {
      this.submittedCity.set(this.searchModel().city);
    });

    if (this.searchForm.city().invalid()) {
      this.searchForm.city().focusBoundControl();
    }
  }
}
