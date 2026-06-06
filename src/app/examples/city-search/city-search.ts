import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { AppFormField } from '../../lib/ui/form-field';
import { AppButton } from '../../lib/ui/button';
import { AppExampleCard } from '../../lib/ui/example-card';
import { fieldErrors } from '../../lib/field-errors';

/**
 * 都市検索オートコンプリートのサンプル
 *
 * ## 学習ポイント
 * - httpResource() によるシグナルベースのHTTPリクエスト
 * - @angular/aria の Combobox ディレクティブによるアクセシブルなオートコンプリート
 * - キーボード操作（Arrow Up/Down, Enter, Escape）の自動提供
 * - Signal Forms との統合パターン
 */
@Component({
  selector: 'app-city-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    FormField,
    AppFormField,
    AppButton,
    AppExampleCard,
  ],
  template: `
    <app-example-card
      title="City Search"
      topic="Autocomplete"
      description="Autocomplete search with httpResource"
      sourcePath="examples/city-search/city-search.ts"
    >
      <p class="text-xs text-gray-500 mb-6">
        Type 2+ characters to see suggestions. e.g.:
        <code class="bg-gray-100 px-1 rounded">To</code> (Tokyo, Toronto),
        <code class="bg-gray-100 px-1 rounded">Pa</code> (Paris, Prague)
      </p>

      <form novalidate (submit)="onSubmit($event)">
        <app-form-field class="mb-4" label="City" [errorMessages]="cityErrors()">
          <div class="relative">
            <input
              ngCombobox
              #combobox="ngCombobox"
              [formField]="searchForm.city"
              [(expanded)]="isComboboxExpanded"
              type="text"
              class="form-input"
              autocomplete="off"
            />

            <ng-template ngComboboxPopup [combobox]="combobox">
              @if (suggestionItems().length > 0) {
                <ul
                  ngComboboxWidget
                  ngListbox
                  #listbox="ngListbox"
                  selectionMode="explicit"
                  [(value)]="selectedCities"
                  [activeDescendant]="listbox.activeDescendant()"
                  class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  @for (city of suggestionItems(); track city) {
                    <li
                      ngOption
                      [value]="city"
                      [label]="city"
                      class="px-4 py-2 cursor-pointer hover:bg-blue-50 data-[active=true]:bg-blue-100"
                    >
                      {{ city }}
                    </li>
                  }
                </ul>
              }
            </ng-template>

            @if (suggestions.isLoading()) {
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <span class="text-gray-400 text-sm">Searching...</span>
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

  /** listbox の選択値 */
  readonly selectedCities = signal<string[]>([]);

  /** 直近に選択された city（無選択時は undefined）。下の 2 つの linkedSignal の source */
  private readonly selectedCity = computed(() => this.selectedCities()[0]);

  /**
   * フォームモデル。selectedCity を source にした linkedSignal で
   * 選択時に city を確定値で上書きしつつ、ユーザー入力（[formField] 経由）
   * での書き換えはそのまま保持する。
   */
  readonly searchModel = linkedSignal({
    source: this.selectedCity,
    computation: (selected, previous): { city: string } =>
      selected !== undefined ? { city: selected } : (previous?.value ?? { city: '' }),
  });

  /**
   * combobox の展開状態。同じく selectedCity を source にした linkedSignal で
   * 選択確定時に false へリセット、それ以外は combobox 側の two-way 書き込みを保持。
   */
  readonly isComboboxExpanded = linkedSignal({
    source: this.selectedCity,
    computation: (selected, previous): boolean =>
      selected !== undefined ? false : (previous?.value ?? false),
  });

  /** フォーム定義 */
  readonly searchForm = form(this.searchModel, (schema) => {
    required(schema.city, { message: 'City is required' });
  });

  /** エラーメッセージ */
  readonly cityErrors = computed(() => fieldErrors(this.searchForm.city()));

  /**
   * httpResource による補完候補の取得
   *
   * searchForm.city().value() を読んで変更のたびに自動リクエスト。
   * 前のリクエストは自動キャンセルされる（switchMap相当）。
   * 2文字未満は undefined を返してリクエストをスキップ。
   */
  readonly suggestions = httpResource<string[]>(() => {
    const q = this.searchForm.city().value();
    if (q.length < 2) return undefined;
    return `/api/cities?q=${encodeURIComponent(q)}`;
  });

  /** 候補リスト */
  readonly suggestionItems = computed(() => this.suggestions.value() ?? []);

  /** フォーム送信 */
  onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.searchForm, async () => {
      this.submittedCity.set(this.searchForm.city().value());
    });

    if (this.searchForm.city().invalid()) {
      this.searchForm.city().focusBoundControl();
    }
  }
}
