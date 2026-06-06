# Signal Forms Examples

[English](./README.en.md)

Angular 22 の **Signal Forms** (`@angular/forms/signals`) を学ぶための実装例集。

## Signal Forms とは

Angular 22 で導入されたシグナルベースのフォーム管理機能。従来の Reactive Forms / Template-driven Forms とは異なるアプローチでフォームを構築する。

- **シグナルベースの状態管理**: `valid()`, `touched()`, `errors()` がシグナルとして公開される
- **型安全**: 初期値からフォームの型が自動推論される
- **リアクティブバリデーション**: `updateValueAndValidity()` 不要。値の変更で自動的にバリデーションが再実行される
- **ゼロサブスクリプション**: Observable の subscribe/unsubscribe が不要

## セットアップ

```bash
npm install
ng serve    # http://localhost:4200/
ng test     # Vitest でテスト実行
```

## Examples 一覧

| # | Example | Topic | 学習ポイント | 詳細 | Demo |
|---|---------|-------|-------------|------|------|
| 1 | Simple Signup | Basic Form | `form()`, `validate()`, `required()`, `submit()` の基本パターン | [解説](src/app/examples/simple-signup/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/simple-signup) |
| 2 | Account Settings | Nested Model | ネストモデルの `form()` 定義とパス到達、`schema()` + `apply()` による部分スキーマ適用 | [解説](src/app/examples/account-settings/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/account-settings) |
| 3 | Book Review | Custom Control | `FormValueControl<number>` で星評価コントロールを実装 | [解説](src/app/examples/book-review/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/book-review) |
| 4 | Profile Edit | Async Validation | `validateHttp()` でユーザー名重複チェック、`pending()` 状態表示 | [解説](src/app/examples/profile-edit/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/profile-edit) |
| 5 | Pizza Order | Conditional Form | `applyWhen()`, `hidden()` で配達方法に応じた動的フィールド | [解説](src/app/examples/pizza-order/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/pizza-order) |
| 6 | Event Registration | Array Form | `applyEach()` で参加者リストの動的追加・削除 | [解説](src/app/examples/event-registration/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/event-registration) |
| 7 | Checkout | Custom Control | `FormValueControl<string>` + `linkedSignal()` で有効期限入力 | [解説](src/app/examples/checkout/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/checkout) |
| 8 | Location Select | Cascade Select | `computed()` で地域→国→都市の連鎖選択肢 | [解説](src/app/examples/location-select/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/location-select) |
| 9 | City Search | Autocomplete | `@angular/aria` Combobox + `httpResource()` でアクセシブルなオートコンプリート | [解説](src/app/examples/city-search/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/city-search) |
| 10 | Avatar Upload | Custom Control | `FormValueControl<File \| null>` + `resource()` で画像プレビュー | [解説](src/app/examples/avatar-upload/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/avatar-upload) |
| 11 | Settings | Form Reset | `reset()` による初期値復元、`dirty()` による変更検知 | [解説](src/app/examples/settings/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/settings) |

### 推奨学習順序

1. **入門**: Simple Signup（フラットモデルの基本）→ Account Settings（ネストモデルの基本）で `form()` の構造を理解
2. **バリデーション応用**: Profile Edit（非同期）、Pizza Order（条件付き）、Event Registration（配列）
3. **カスタムコントロール**: Book Review → Checkout → Avatar Upload と段階的に
4. **外部データ連携**: Location Select、City Search
5. **フォーム状態管理**: Settings で `reset()` / `dirty()` をフィールド単位で扱う

## Signal Forms API クロスリファレンス

| API | 説明 | 使用 Example |
|-----|------|-------------|
| `form()` | フォーム定義 | 全 Example |
| `FormField` | 双方向バインディングディレクティブ | 全 Example |
| `submit()` | フォーム送信（バリデーション付き） | 全 Example |
| `required()` | 必須バリデータ | Simple Signup, Profile Edit, Event Registration, Location Select, City Search |
| `email()` | メールバリデータ | Simple Signup |
| `minLength()` / `maxLength()` | 文字数バリデータ | Profile Edit, Book Review |
| `pattern()` | 正規表現バリデータ | Profile Edit |
| `validate()` | カスタムバリデータ | Simple Signup, Pizza Order, Book Review, Avatar Upload |
| `validateHttp()` | HTTP 非同期バリデータ | Profile Edit |
| `applyWhen()` | 条件付きスキーマ適用 | Pizza Order |
| `hidden()` | 条件付きフィールド非表示 | Pizza Order |
| `applyEach()` | 配列要素への共通バリデーション | Event Registration |
| `debounce()` | スキーマレベルの入力遅延 | Profile Edit |
| `valueOf()` | 他フィールドの値参照 | Pizza Order |
| `pending()` | 非同期バリデーション進行中状態 | Profile Edit |
| `focusBoundControl()` | バリデーションエラー時のフォーカス制御 | 全 Example |
| `reset()` | フォーム値と状態のリセット | Settings |
| `dirty()` | 変更検知シグナル | Settings |
| `schema()` | 再利用可能な部分スキーマの定義 | Account Settings |
| `apply()` | 既存スキーマを特定パスに適用 | Account Settings |
| `FormValueControl<T>` | カスタムコントロールインターフェース | Book Review, Checkout, Avatar Upload |

## プロジェクト構造

```
src/app/
├── app.ts              # ルートコンポーネント（ナビゲーション）
├── app.routes.ts       # ルーティング定義（lazy loading）
├── examples/           # 各 Example の実装（feature-based）
│   ├── simple-signup/
│   │   ├── simple-signup.ts
│   │   ├── simple-signup.spec.ts
│   │   └── README.md   # 解説
│   ├── book-review/
│   │   └── ...
│   └── avatar-upload/
│       └── ...
├── lib/
│   ├── ui/             # 共有 UI コンポーネント
│   │   ├── button.ts
│   │   ├── form-field.ts
│   │   └── example-card.ts
│   └── field-errors.ts # エラーメッセージ抽出ヘルパー
└── mocks/              # MSW モック（テスト・開発用）
```
