# City Search

## 概要

都市名のオートコンプリート検索を実装するサンプル。Signal Forms の `debounce()` と Angular の `httpResource()` を組み合わせ、入力に応じた候補をリアクティブに取得・表示する。

## 学習ポイント

- `debounce()` によるスキーマレベルの入力遅延制御
- `httpResource()` によるシグナルベースの HTTP リクエスト自動発行
- `httpResource` に `undefined` を返してリクエストをスキップするパターン
- 前のリクエストの自動キャンセル（switchMap 相当）

## フォーム構造

| フィールド | 型       | バリデーション               |
| ---------- | -------- | ---------------------------- |
| `city`     | `string` | `required` (City is required) |

スキーマレベルの設定: `debounce(schema.city, 300)` (300ms)

## 実装の要点

### フォーム定義

`required()` と `debounce()` をスキーマ関数内で同じフィールドに設定する。`debounce()` により、モデルの更新が 300ms 遅延する。

```typescript
readonly searchModel = signal({
  city: '',
});

readonly searchForm = form(this.searchModel, (schema) => {
  required(schema.city, { message: 'City is required' });
  // スキーマレベルの debounce: モデル更新を 300ms 遅延
  debounce(schema.city, 300);
});
```

### httpResource による候補取得

`httpResource()` はシグナルの変更を自動追跡し、値が変わるたびに HTTP リクエストを発行する。前のリクエストは自動でキャンセルされる（switchMap 相当）。`undefined` を返すとリクエスト自体をスキップできる。

```typescript
readonly suggestions = httpResource<string[]>(() => {
  const q = this.searchModel().city;
  // 2文字未満は undefined を返してリクエストをスキップ
  if (q.length < 2) {
    return undefined;
  }
  return `/api/cities?q=${encodeURIComponent(q)}`;
});
```

`debounce()` と `httpResource()` の連携:

1. ユーザーがキー入力
2. `debounce(300)` により 300ms 後に `searchModel` が更新
3. `httpResource` が `searchModel().city` の変更を検知し、リクエストを発行
4. 前のリクエストがまだ完了していなければ自動キャンセル

### テンプレート

`httpResource` の状態シグナル (`hasValue()`, `value()`, `isLoading()`) を使ってUIを出し分ける。

```html
<!-- 候補リストの表示: hasValue() と value().length でガード -->
@if (showSuggestions() && suggestions.hasValue() && suggestions.value().length > 0) {
  <ul role="listbox">
    @for (city of suggestions.value(); track city) {
      <li
        role="option"
        [attr.aria-selected]="searchModel().city === city"
        (mousedown)="selectCity(city)"
      >
        {{ city }}
      </li>
    }
  </ul>
}

<!-- ローディング表示 -->
@if (suggestions.isLoading()) {
  <span>検索中...</span>
}
```

候補選択時は `mousedown` イベントを使用する。`click` だと先に `blur` が発火して候補リストが非表示になるため。

### 送信処理

```typescript
onSubmit(event: Event): void {
  event.preventDefault();
  submit(this.searchForm, async () => {
    this.submittedCity.set(this.searchModel().city);
  });

  if (this.searchForm.city().invalid()) {
    this.searchForm.city().focusBoundControl();
  }
}
```

## コード

- [ソースコード](./city-search.ts)
- [テスト](./city-search.spec.ts)
