import { ChangeDetectionStrategy, Component, computed, effect, signal, untracked, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { form, required, submit } from '@angular/forms/signals';
import { Combobox, ComboboxInput, ComboboxPopupContainer } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

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
  imports: [Combobox, ComboboxInput, ComboboxPopupContainer, Listbox, Option, AppFormField, AppButton, AppExampleCard],
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
          <div class="relative" ngCombobox [filterMode]="'manual'">
            <input
              ngComboboxInput
              [(value)]="cityInputValue"
              type="text"
              class="form-input"
              autocomplete="off"
            />

            <!--
              ngComboboxPopupContainer: combobox の expanded 状態に応じてポップアップを表示。
              Listbox は ComboboxPopup をホストディレクティブとして持つため、
              明示的な ngComboboxPopup は不要。
            -->
            <ng-template ngComboboxPopupContainer>
              @if (suggestionItems().length > 0) {
                <ul
                  ngListbox
                  [(values)]="selectedCities"
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

  /** combobox input の値（@angular/aria が管理） */
  readonly cityInputValue = signal('');

  /** listbox の選択値 */
  readonly selectedCities = signal<string[]>([]);

  /** フォームモデル */
  readonly searchModel = signal({ city: '' });

  /**
   * フォーム定義
   *
   * debounce は [formField] を使わないため effect 内で実装。
   */
  readonly searchForm = form(this.searchModel, (schema) => {
    required(schema.city, { message: 'City is required' });
  });

  /** エラーメッセージ */
  readonly cityErrors = computed(() => fieldErrors(this.searchForm.city()));

  /** 候補リスト（入力値と完全一致する1件のみの場合は非表示） */
  readonly suggestionItems = computed(() => {
    if (!this.suggestions.hasValue()) return [];
    const items = this.suggestions.value();
    const input = this.cityInputValue();
    if (items.length === 1 && items[0] === input) return [];
    return items;
  });

  /**
   * httpResource による補完候補の取得
   *
   * searchModel().city を直接読み取り、変更のたびに自動リクエスト。
   * 前のリクエストは自動キャンセルされる（switchMap相当）。
   * 2文字未満は undefined を返してリクエストをスキップ。
   */
  readonly suggestions = httpResource<string[]>(() => {
    const q = this.searchModel().city;
    if (q.length < 2) return undefined;
    return `/api/cities?q=${encodeURIComponent(q)}`;
  });

  /** input への参照（フォーカス制御用） */
  private readonly comboboxInput = viewChild(ComboboxInput);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** combobox への参照（プログラム的な開閉用） */
  private readonly combobox = viewChild(Combobox);

  constructor() {
    // 入力値を 300ms debounce して form model に反映
    effect(() => {
      const city = this.cityInputValue();
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        // 同じ値なら更新しない（選択後の重複更新を防止）
        if (untracked(() => this.searchModel().city) !== city) {
          this.searchModel.update((v) => ({ ...v, city }));
        }
      }, 300);
    });

    // 選択値を即時 form model・input に反映し、combobox を閉じる
    effect(() => {
      const selected = this.selectedCities();
      if (selected.length > 0) {
        const city = selected[0];
        untracked(() => {
          this.searchModel.update((v) => ({ ...v, city }));
          this.cityInputValue.set(city);
          this.combobox()?.close();
        });
      }
    });
  }

  /** フォーム送信 */
  onSubmit(event: Event): void {
    event.preventDefault();
    submit(this.searchForm, async () => {
      this.submittedCity.set(this.searchModel().city);
    });

    if (this.searchForm.city().invalid()) {
      this.comboboxInput()?.element.focus();
    }
  }
}
