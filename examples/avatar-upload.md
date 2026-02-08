# Avatar Upload

## 概要

プロフィール画像のアップロードフォームを実装するサンプル。`FormValueControl<File | null>` によるカスタムコントロールで非プリミティブ値（File オブジェクト）をフォームに統合し、`resource()` で非同期プレビュー生成を行う。

## 学習ポイント

- `FormValueControl<File | null>` の実装（非プリミティブ値のフォーム統合）
- `validate()` によるカスタムバリデーション（必須・ファイル形式・サイズ上限）
- `resource()` による File → Data URL の非同期変換
- カスタムコントロールの `focus()` メソッド実装

## フォーム構造

| フィールド | 型             | バリデーション                          |
| ---------- | -------------- | --------------------------------------- |
| `avatar`   | `File \| null` | 必須 / image/* のみ / 2MB 以下 |

## 実装の要点

### カスタムコントロール（ImageUploadInput）

`FormValueControl<File | null>` インターフェースを実装し、`model()` で `value` を公開する。`[formField]` ディレクティブがこの `value` を通じてフォームと双方向バインドする。

```typescript
export class ImageUploadInput implements FormValueControl<File | null> {
  // FormValueControl の value: model() で双方向バインド
  readonly value = model<File | null>(null);

  // 隠し file input への参照
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // ファイル選択時にモデルを更新
  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.value.set(file);
  }

  // focusBoundControl() から呼び出される focus メソッド
  // ファイル入力の場合、ファイル選択ダイアログを開く
  focus(): void {
    this.fileInput().nativeElement.click();
  }
}
```

### resource() による非同期プレビュー生成

`resource()` の `params` に `value` シグナルを渡し、`loader` で FileReader による Data URL 変換を行う。`value` が変わるたびに自動的にプレビューが再生成される。

```typescript
protected readonly previewUrl = resource({
  // value シグナルの変更を追跡
  params: () => this.value(),
  loader: async ({ params: file }) => {
    if (!file || !file.type.startsWith('image/')) {
      return null;
    }
    // FileReader で File → Data URL に非同期変換
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },
});
```

### フォーム定義

`File | null` には `required()` が使えないため、`validate()` で null チェックする。ファイル形式とサイズのバリデーションも `validate()` で実装する。

```typescript
readonly avatarForm = form(this.avatarModel, (schema) => {
  // 必須: null でないこと
  validate(schema.avatar, ({ value }) => {
    if (value() === null) {
      return { kind: 'required', message: 'Please select an image' };
    }
    return undefined;
  });

  // ファイル形式: image/* のみ
  validate(schema.avatar, ({ value }) => {
    const file = value();
    if (file && !file.type.startsWith('image/')) {
      return { kind: 'fileType', message: 'Please select an image file' };
    }
    return undefined;
  });

  // サイズ上限: 2MB
  validate(schema.avatar, ({ value }) => {
    const file = value();
    if (file && file.size > 2 * 1024 * 1024) {
      return { kind: 'fileSize', message: 'File size must be 2MB or less' };
    }
    return undefined;
  });
});
```

### テンプレート

カスタムコントロールは `[formField]` ディレクティブで通常のフォーム要素と同様にバインドする。

```html
<!-- FormValueControl を実装しているため [formField] で直接バインド可能 -->
<app-image-upload-input [formField]="avatarForm.avatar" />

<!-- エラー表示 -->
@if (avatarErrors().length > 0) {
  <ul>
    @for (message of avatarErrors(); track message) {
      <li>{{ message }}</li>
    }
  </ul>
}
```

### 送信処理

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.avatarForm, async () => {
    const file = this.avatarModel().avatar;
    if (file) {
      this.submittedValue.set({ avatar: file });
    }
  });

  // 無効時にフォーカス → カスタムコントロールの focus() が呼ばれる
  if (this.avatarForm.avatar().invalid()) {
    this.avatarForm.avatar().focusBoundControl();
  }
}
```

## コード

- [ソースコード](../src/app/examples/avatar-upload.ts)
- [テスト](../src/app/examples/avatar-upload.spec.ts)
