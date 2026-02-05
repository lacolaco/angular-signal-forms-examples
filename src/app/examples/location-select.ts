import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

/**
 * 地域データの型定義
 */
interface Region {
  id: string;
  name: string;
  countries: Country[];
}

interface Country {
  id: string;
  name: string;
  cities: City[];
}

interface City {
  id: string;
  name: string;
}

/**
 * サンプル地域データ
 * 実際のアプリケーションではAPIから取得する
 */
const LOCATION_DATA: Region[] = [
  {
    id: 'asia',
    name: 'Asia',
    countries: [
      {
        id: 'japan',
        name: 'Japan',
        cities: [
          { id: 'tokyo', name: 'Tokyo' },
          { id: 'osaka', name: 'Osaka' },
          { id: 'kyoto', name: 'Kyoto' },
        ],
      },
      {
        id: 'korea',
        name: 'South Korea',
        cities: [
          { id: 'seoul', name: 'Seoul' },
          { id: 'busan', name: 'Busan' },
        ],
      },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    countries: [
      {
        id: 'france',
        name: 'France',
        cities: [
          { id: 'paris', name: 'Paris' },
          { id: 'lyon', name: 'Lyon' },
        ],
      },
      {
        id: 'germany',
        name: 'Germany',
        cities: [
          { id: 'berlin', name: 'Berlin' },
          { id: 'munich', name: 'Munich' },
        ],
      },
    ],
  },
];

/**
 * 依存ドロップダウン（カスケード選択）のサンプル
 *
 * ## 学習ポイント
 * - computed() による依存選択肢の自動更新
 * - 親の選択変更時に子の値をリセット
 * - シグナルのリアクティブ性を活用したUI更新
 */
@Component({
  selector: 'app-location-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExampleCard],
  template: `
    <app-example-card
      title="Location Select"
      topic="Cascade Select"
      description="依存ドロップダウン（カスケード選択）のサンプル"
      sourcePath="examples/location-select.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <app-form-field class="mb-4" label="Region" [errorMessages]="regionErrors()">
          <select
            [formField]="locationForm.region"
            class="form-input"
            [class.invalid]="locationForm.region().touched() && locationForm.region().invalid()"
            (change)="onRegionChange()"
          >
            <option value="">-- Select Region --</option>
            @for (r of regions; track r.id) {
              <option [value]="r.id">{{ r.name }}</option>
            }
          </select>
        </app-form-field>

        <app-form-field class="mb-4" label="Country" [errorMessages]="countryErrors()">
          <!--
            computed() で選択肢を動的に生成
            親（region）が変わると自動的に更新される
          -->
          <select
            [formField]="locationForm.country"
            class="form-input"
            [class.invalid]="locationForm.country().touched() && locationForm.country().invalid()"
            (change)="onCountryChange()"
          >
            <option value="">-- Select Country --</option>
            @for (c of availableCountries(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </app-form-field>

        <app-form-field class="mb-6" label="City" [errorMessages]="cityErrors()">
          <select
            [formField]="locationForm.city"
            class="form-input"
            [class.invalid]="locationForm.city().touched() && locationForm.city().invalid()"
          >
            <option value="">-- Select City --</option>
            @for (c of availableCities(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </app-form-field>

        <app-button type="submit">Submit</app-button>
      </form>

      @if (submittedValue(); as value) {
        <div class="form-success">
          <p>Selected Location:</p>
          <p>
            {{ getRegionName(value.region) }} / {{ getCountryName(value.region, value.country) }} /
            {{ getCityName(value.region, value.country, value.city) }}
          </p>
        </div>
      }
    </app-example-card>
  `,
})
export class LocationSelect {
  /** 地域データ */
  protected readonly regions = LOCATION_DATA;

  /** 送信済みデータ */
  protected readonly submittedValue = signal<{
    region: string;
    country: string;
    city: string;
  } | null>(null);

  /** フォームモデル */
  readonly locationModel = signal({
    region: '',
    country: '',
    city: '',
  });

  /** フォーム定義 */
  readonly locationForm = form(this.locationModel, (schema) => {
    required(schema.region, { message: 'Region is required' });
    required(schema.country, { message: 'Country is required' });
    required(schema.city, { message: 'City is required' });
  });

  /** エラーメッセージ */
  readonly regionErrors = computed(() => fieldErrors(this.locationForm.region()));
  readonly countryErrors = computed(() => fieldErrors(this.locationForm.country()));
  readonly cityErrors = computed(() => fieldErrors(this.locationForm.city()));

  /**
   * 選択中の地域に応じた国リスト
   *
   * computed() により locationModel の region 変更を自動検知
   */
  protected readonly availableCountries = computed(() => {
    const regionId = this.locationModel().region;
    if (!regionId) return [];
    const region = this.regions.find((r) => r.id === regionId);
    return region?.countries ?? [];
  });

  /**
   * 選択中の国に応じた都市リスト
   *
   * computed() により locationModel の country 変更を自動検知
   */
  protected readonly availableCities = computed(() => {
    const countryId = this.locationModel().country;
    if (!countryId) return [];
    const country = this.availableCountries().find((c) => c.id === countryId);
    return country?.cities ?? [];
  });

  /**
   * 地域変更時: 国と都市をリセット
   */
  protected onRegionChange(): void {
    this.locationModel.update((v) => ({ ...v, country: '', city: '' }));
  }

  /**
   * 国変更時: 都市をリセット
   */
  protected onCountryChange(): void {
    this.locationModel.update((v) => ({ ...v, city: '' }));
  }

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.locationForm, async () => {
      this.submittedValue.set({ ...this.locationModel() });
    });

    // invalid なフィールドの最初にフォーカス
    const fields = [this.locationForm.region, this.locationForm.country, this.locationForm.city];
    const firstInvalidField = fields.find((field) => field().invalid());
    firstInvalidField?.().focusBoundControl();
  }

  /** 表示用ヘルパー */
  protected getRegionName(id: string): string {
    return this.regions.find((r) => r.id === id)?.name ?? id;
  }

  protected getCountryName(regionId: string, countryId: string): string {
    const region = this.regions.find((r) => r.id === regionId);
    return region?.countries.find((c) => c.id === countryId)?.name ?? countryId;
  }

  protected getCityName(regionId: string, countryId: string, cityId: string): string {
    const region = this.regions.find((r) => r.id === regionId);
    const country = region?.countries.find((c) => c.id === countryId);
    return country?.cities.find((c) => c.id === cityId)?.name ?? cityId;
  }
}
