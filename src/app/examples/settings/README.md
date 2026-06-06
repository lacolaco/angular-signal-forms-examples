# Settings

## 概要

アプリケーション設定フォームを通じて、フォームのリセットと初期値復元のパターンを学ぶサンプル。`reset()` メソッドで値と状態（touched/dirty）を同時にリセットし、`dirty()` シグナルで変更の有無を検知する。

## 学習ポイント

- `FieldState.reset(value)` による値と状態の同時リセット
- `dirty()` シグナルによるフィールド単位・フォーム全体の変更検知
- 変更されたフィールドの視覚的フィードバック

## フォーム構造

| フィールド | 型 | バリデーション |
| ---------- | -------- | -------------- |
| `language` | `string` | `required` |
| `emailNotifications` | `boolean` | なし |
| `pageSize` | `string` | なし |

## 実装の要点

### フォーム定義

デフォルト設定値を定数として定義し、`signal()` の初期値に渡す。リセット時にもこの定数を使用する。

```typescript
const DEFAULT_SETTINGS: SettingsData = {
  language: 'ja',
  emailNotifications: true,
  pageSize: '25',
};

readonly settingsModel = signal<SettingsData>({ ...DEFAULT_SETTINGS });

readonly settingsForm = form(this.settingsModel, (schema) => {
  required(schema.language, { message: 'Language is required' });
});
```

### dirty() による変更検知

`dirty()` シグナルはフィールド単位とフォーム全体の両方で利用できる。フィールドの値が初期値から変更されると `true` になる。

```html
<!-- フィールド単位: 変更されたフィールドにスタイルを適用 -->
<div [class.field-modified]="settingsForm.language().dirty()">
  ...
</div>

<!-- フォーム全体: いずれかのフィールドが変更されていれば表示 -->
@if (settingsForm().dirty()) {
  <p role="status">Unsaved changes</p>
}

<!-- Reset ボタンの有効/無効制御 -->
<button [disabled]="!settingsForm().dirty()" (click)="onReset()">
  Reset to Default
</button>
```

### reset() によるフォームリセット

`reset(value)` は値の復元と状態（touched/dirty）のクリアを同時に行う。

```typescript
onReset() {
  // デフォルト値で全フィールドをリセット
  // dirty() と touched() が false に戻る
  this.settingsForm().reset({ ...DEFAULT_SETTINGS });
  this.submitted.set(false);
}
```

## コード

- [ソースコード](./settings.ts)
- [テスト](./settings.spec.ts)
