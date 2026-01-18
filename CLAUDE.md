# Signal Forms Examples

Angular 21 の Signal Forms (`@angular/forms/signals`) 実装例プロジェクト。

## Signal Forms とは

Angular 21 で導入された実験的なシグナルベースのフォーム管理機能：

- シグナルベースの状態管理: `valid()`, `touched()`, `errors()` がシグナルとして公開
- 型安全: 初期値から型が推論される
- リアクティブバリデーション: `updateValueAndValidity()` 不要
- ゼロサブスクリプション: シグナルの反応性で自動同期

## プロジェクト構造

- 各ユースケースサンプルは `app/examples/{name}.ts` に作成
- ルートで分離し、`app.routes.ts` に登録
