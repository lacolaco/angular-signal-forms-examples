# Signal Forms Examples

Angular 21 の **Signal Forms** (`@angular/forms/signals`) を学ぶための実装例集。

## Signal Forms とは

Angular 21 で導入された実験的なシグナルベースのフォーム管理機能。従来の Reactive Forms / Template-driven Forms とは異なるアプローチでフォームを構築する。

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

| # | Example | Topic | 学習ポイント | 詳細 |
|---|---------|-------|-------------|------|
| 1 | Simple Signup | Basic Form | `form()`, `validate()`, `required()`, `submit()` の基本パターン | [解説](src/app/examples/simple-signup.md) |
| 2 | Book Review | Custom Control | `FormValueControl<number>` で星評価コントロールを実装 | [解説](src/app/examples/book-review.md) |
| 3 | Profile Edit | Async Validation | `validateHttp()` でユーザー名重複チェック、`pending()` 状態表示 | [解説](src/app/examples/profile-edit.md) |
| 4 | Pizza Order | Conditional Form | `applyWhen()`, `hidden()` で配達方法に応じた動的フィールド | [解説](src/app/examples/pizza-order.md) |
| 5 | Event Registration | Array Form | `applyEach()` で参加者リストの動的追加・削除 | [解説](src/app/examples/event-registration.md) |
| 6 | Checkout | Custom Control | `FormValueControl<string>` + `linkedSignal()` で有効期限入力 | [解説](src/app/examples/checkout.md) |
| 7 | Location Select | Cascade Select | `computed()` で地域→国→都市の連鎖選択肢 | [解説](src/app/examples/location-select.md) |
| 8 | City Search | Autocomplete | `debounce()` + `httpResource()` でインクリメンタルサーチ | [解説](src/app/examples/city-search.md) |
| 9 | Avatar Upload | Custom Control | `FormValueControl<File \| null>` + `resource()` で画像プレビュー | [解説](src/app/examples/avatar-upload.md) |

### 推奨学習順序

1. **入門**: Simple Signup で Signal Forms の基本を理解
2. **バリデーション応用**: Profile Edit（非同期）、Pizza Order（条件付き）、Event Registration（配列）
3. **カスタムコントロール**: Book Review → Checkout → Avatar Upload と段階的に
4. **外部データ連携**: Location Select、City Search

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
| `debounce()` | スキーマレベルの入力遅延 | City Search |
| `valueOf()` | 他フィールドの値参照 | Pizza Order |
| `pending()` | 非同期バリデーション進行中状態 | Profile Edit |
| `focusBoundControl()` | バリデーションエラー時のフォーカス制御 | 全 Example |
| `FormValueControl<T>` | カスタムコントロールインターフェース | Book Review, Checkout, Avatar Upload |

## プロジェクト構造

```
src/app/
├── app.ts              # ルートコンポーネント（ナビゲーション）
├── app.routes.ts       # ルーティング定義（lazy loading）
├── examples/           # 各 Example の実装
│   ├── simple-signup.ts
│   ├── simple-signup.spec.ts
│   ├── book-review.ts
│   ├── ...
│   └── avatar-upload.ts
├── lib/
│   ├── ui/             # 共有 UI コンポーネント
│   │   ├── button.ts
│   │   ├── form-field.ts
│   │   └── example-card.ts
│   └── field-errors.ts # エラーメッセージ抽出ヘルパー
└── mocks/              # MSW モック（テスト・開発用）
```
