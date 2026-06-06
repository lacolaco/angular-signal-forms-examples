# City Search

## 概要

都市名のオートコンプリート検索を実装するサンプル。`@angular/aria` の Combobox ディレクティブと `httpResource()` を組み合わせ、WAI-ARIA 準拠のアクセシブルなオートコンプリートを提供する。

## 学習ポイント

- `@angular/aria` の Combobox/Listbox ディレクティブによるアクセシブルなオートコンプリート
- キーボード操作（Arrow Up/Down, Enter, Escape）の自動提供
- `httpResource()` によるシグナルベースの HTTP リクエスト自動発行
- `httpResource` に `undefined` を返してリクエストをスキップするパターン
- Signal Forms との統合パターン（`[formField]` を使わないケース）

## フォーム構造

| フィールド | 型       | バリデーション               |
| ---------- | -------- | ---------------------------- |
| `city`     | `string` | `required` (City is required) |

## 実装の要点

### @angular/aria による Combobox パターン

`@angular/aria` の Combobox ディレクティブは WAI-ARIA Combobox パターンを実装する。キーボード操作と ARIA 属性が自動提供される。

```html
<div ngCombobox [filterMode]="'manual'">
  <input ngComboboxInput [(value)]="cityInputValue" />
  <ng-template ngComboboxPopupContainer>
    <ul ngListbox [(values)]="selectedCities">
      @for (city of suggestionItems(); track city) {
        <li ngOption [value]="city" [label]="city">{{ city }}</li>
      }
    </ul>
  </ng-template>
</div>
```

**キーボード操作**（自動提供）:
- Arrow Down/Up: 候補間の移動
- Enter: 候補の選択
- Escape: ポップアップを閉じる

`filterMode="manual"` はサーバーサイドフィルタリング（httpResource）用。クライアントサイドフィルタリングには `auto-select` を使う。

### Signal Forms との統合

`ngComboboxInput` は `[(value)]` model signal で入力値を管理するため、Signal Forms の `[formField]` と同じ input に適用できない。代わりに effect で同期する。

```typescript
readonly cityInputValue = signal('');    // combobox が管理
readonly selectedCities = signal<string[]>([]); // listbox が管理

constructor() {
  // 入力値を 300ms debounce して form model に反映
  effect(() => {
    const city = this.cityInputValue();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
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
```

### httpResource による候補取得

`httpResource()` はシグナルの変更を自動追跡し、値が変わるたびに HTTP リクエストを発行する。前のリクエストは自動でキャンセルされる（switchMap 相当）。

```typescript
readonly suggestions = httpResource<string[]>(() => {
  const q = this.searchModel().city;
  if (q.length < 2) return undefined;
  return `/api/cities?q=${encodeURIComponent(q)}`;
});
```

候補リストは、入力値と完全一致する1件のみの場合は表示しない:

```typescript
readonly suggestionItems = computed(() => {
  if (!this.suggestions.hasValue()) return [];
  const items = this.suggestions.value();
  const input = this.cityInputValue();
  if (items.length === 1 && items[0] === input) return [];
  return items;
});
```

## コード

- [ソースコード](./city-search.ts)
- [テスト](./city-search.spec.ts)
