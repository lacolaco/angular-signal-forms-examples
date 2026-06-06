# Location Select

## 概要

地域(Region) → 国(Country) → 都市(City) の3段階カスケード選択を実装するサンプル。親の選択に応じて子の選択肢が動的に切り替わる依存ドロップダウンのパターンを学ぶ。

## 学習ポイント

- `computed()` による依存選択肢の自動導出
- 親の選択変更時に子の値をリセットするパターン
- `submit()` + `focusBoundControl()` による送信とフォーカス制御
- 複数フィールドの `required()` バリデーション

## フォーム構造

| フィールド | 型       | バリデーション              |
| ---------- | -------- | --------------------------- |
| `region`   | `string` | `required` (Region is required) |
| `country`  | `string` | `required` (Country is required) |
| `city`     | `string` | `required` (City is required)    |

## 実装の要点

### フォーム定義

`form()` にモデルシグナルとスキーマ関数を渡す。3フィールドすべてに `required()` を設定。

```typescript
// フォームモデル: 各フィールドの初期値は空文字列
readonly locationModel = signal({
  region: '',
  country: '',
  city: '',
});

// フォーム定義: required バリデータを各フィールドに適用
readonly locationForm = form(this.locationModel, (schema) => {
  required(schema.region, { message: 'Region is required' });
  required(schema.country, { message: 'Country is required' });
  required(schema.city, { message: 'City is required' });
});
```

### 連鎖選択肢（computed による自動導出）

`computed()` で親の選択値からフィルタリングした子の選択肢リストを生成する。親の値が変わると `computed()` が自動的に再計算される。

```typescript
// region の選択値に応じて国リストを自動導出
protected readonly availableCountries = computed(() => {
  const regionId = this.locationModel().region;
  if (!regionId) return [];
  const region = this.regions.find((r) => r.id === regionId);
  return region?.countries ?? [];
});

// country の選択値に応じて都市リストを自動導出
// availableCountries() を参照するため、region 変更時にも連鎖的に更新される
protected readonly availableCities = computed(() => {
  const countryId = this.locationModel().country;
  if (!countryId) return [];
  const country = this.availableCountries().find((c) => c.id === countryId);
  return country?.cities ?? [];
});
```

### 親の変更時に子をリセット

親の `(change)` イベントで子フィールドの値を空文字列にリセットする。`locationModel.update()` でモデルを直接更新する。

```typescript
// 地域変更時: 国と都市をリセット
protected onRegionChange(): void {
  this.locationModel.update((v) => ({ ...v, country: '', city: '' }));
}

// 国変更時: 都市をリセット
protected onCountryChange(): void {
  this.locationModel.update((v) => ({ ...v, city: '' }));
}
```

### テンプレート

`[formField]` ディレクティブでフォームフィールドをバインドし、`@for` で `computed()` の選択肢リストをレンダリングする。

```html
<!-- computed() の結果を @for で表示。親の選択が変わると自動的に更新 -->
<select [formField]="locationForm.country">
  <option value="">-- Select Country --</option>
  @for (c of availableCountries(); track c.id) {
    <option [value]="c.id">{{ c.name }}</option>
  }
</select>
```

### 送信処理

`submit()` でバリデーションを実行し、無効なフィールドがあれば最初の無効フィールドにフォーカスを移す。

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.locationForm, async () => {
    // 送信時点の値をスナップショットとして保存
    this.submittedValue.set({ ...this.locationModel() });
  });

  // 無効なフィールドの最初にフォーカス
  const fields = [this.locationForm.region, this.locationForm.country, this.locationForm.city];
  const firstInvalidField = fields.find((field) => field().invalid());
  firstInvalidField?.().focusBoundControl();
}
```

## コード

- [ソースコード](./location-select.ts)
- [テスト](./location-select.spec.ts)
