import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  model,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, FormValueControl, validate, submit } from '@angular/forms/signals';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

/**
 * ファイルサイズを人間が読める形式に変換
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ImageUploadInput Component
 *
 * Signal Forms のカスタムフォームコントロール実装例。
 * File オブジェクトを扱う FormValueControl<File | null> を実装し、
 * 画像プレビューとファイル選択UIを提供する。
 *
 * ## 学習ポイント
 * - FormValueControl<File | null> の実装（非プリミティブ値）
 * - FileReader による画像プレビュー生成
 * - 隠し input[type="file"] とカスタムUI
 * - focus() メソッドでファイルダイアログを起動
 */
@Component({
  selector: 'app-image-upload-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      隠し file input:
      accept="image/*" でブラウザのファイルダイアログを画像に制限
      (change) でファイル選択を検知
    -->
    <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileChange($event)" />

    <!--
      クリック可能なドロップゾーン:
      画像が選択されていればプレビュー表示、なければプレースホルダー
    -->
    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      (click)="openFilePicker()"
    >
      @if (previewUrl.value()) {
        <img
          [src]="previewUrl.value()"
          alt="Preview"
          class="mx-auto mb-2 max-h-32 rounded-lg object-cover"
        />
      } @else {
        <div class="text-gray-400 mb-2">
          <svg
            class="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      }

      @if (value()) {
        <p class="text-sm text-gray-700">{{ value()!.name }}</p>
        <p class="text-xs text-gray-500">{{ formatFileSize(value()!.size) }}</p>
      } @else {
        <p class="text-sm text-gray-500">Click to select an image</p>
        <p class="text-xs text-gray-400">PNG, JPG, GIF (max 2MB)</p>
      }
    </button>
  `,
})
export class ImageUploadInput implements FormValueControl<File | null> {
  /** フォームにバインドされる値（File | null） */
  readonly value = model<File | null>(null);

  /**
   * 隠し file input への参照
   *
   * viewChild.required() でテンプレート参照変数 #fileInput を取得。
   * openFilePicker() と focus() でこの要素のクリックイベントを発火し、
   * ブラウザのファイル選択ダイアログを開く。
   */
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /**
   * プレビュー画像の Data URL
   *
   * resource() で value シグナルの変更を追跡し、
   * FileReader で File を Data URL に非同期変換する。
   * value が変わるたびに自動的にプレビューを再生成。
   */
  protected readonly previewUrl = resource({
    params: () => this.value(),
    loader: async ({ params: file }) => {
      if (!file || !file.type.startsWith('image/')) {
        return null;
      }
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    },
  });

  /** ファイルサイズ表示用ヘルパー（テンプレートから参照） */
  protected readonly formatFileSize = formatFileSize;

  /**
   * ファイル選択ハンドラ
   *
   * input[type="file"] の change イベントから File を取得し、
   * value シグナルに設定する。
   */
  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.value.set(file);
  }

  /**
   * ファイル選択ダイアログを開く
   */
  protected openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  /**
   * カスタムコントロールのフォーカスメソッド
   *
   * Signal Forms の focusBoundControl() から呼び出される。
   * ファイル入力の場合、フォーカス = ファイル選択ダイアログを開く。
   */
  focus(): void {
    this.fileInput().nativeElement.click();
  }
}

/**
 * Avatar Upload Example
 *
 * Signal Forms の File 入力カスタムコントロール実装例。
 * 画像ファイルのアップロードとプレビュー表示を行う。
 *
 * ## 学習ポイント
 * - FormValueControl<File | null> によるファイル入力のフォーム統合
 * - validate() によるファイルバリデーション（形式、サイズ）
 * - カスタムコントロールの [formField] バインディング
 * - 非プリミティブ値（File オブジェクト）のフォーム管理
 */
@Component({
  selector: 'app-avatar-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppButton, AppExampleCard, ImageUploadInput],
  template: `
    <app-example-card
      title="Avatar Upload"
      topic="Custom Control"
      description="Set your profile image"
      sourcePath="examples/avatar-upload.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <div class="mb-6">
          <span class="block text-sm font-medium text-gray-700 mb-2">Avatar Image</span>
          <!--
            カスタムコントロールとの連携:
            ImageUploadInput は FormValueControl<File | null> を実装しているため、
            [formField] ディレクティブで直接バインド可能。
            File オブジェクトも Signal Forms で型安全に管理できる。
          -->
          <app-image-upload-input [formField]="avatarForm.avatar" />
          @if (avatarErrors().length > 0) {
            <ul class="mt-2 text-sm text-red-600">
              @for (message of avatarErrors(); track message) {
                <li>{{ message }}</li>
              }
            </ul>
          }
        </div>

        <app-button type="submit">Upload</app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success">Upload complete! ({{ submitted.avatar.name }})</div>
      }
    </app-example-card>
  `,
})
export class AvatarUpload {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<{ avatar: File } | null>(null);

  /**
   * フォームモデル
   *
   * avatar: File | null（null は未選択）
   * Signal Forms は非プリミティブ値（File オブジェクト）も扱える。
   */
  readonly avatarModel = signal<{ avatar: File | null }>({
    avatar: null,
  });

  /**
   * フォーム定義
   *
   * - avatar: 必須 + 画像形式 + サイズ上限（2MB）
   * - validate() のカスタムバリデータで File のプロパティを検証
   */
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

  /** エラーメッセージ */
  readonly avatarErrors = computed(() => fieldErrors(this.avatarForm.avatar()));

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.avatarForm, async () => {
      const file = this.avatarModel().avatar;
      if (file) {
        this.submittedValue.set({ avatar: file });
      }
    });

    // invalid なフィールドにフォーカス
    if (this.avatarForm.avatar().invalid()) {
      this.avatarForm.avatar().focusBoundControl();
    }
  }
}
