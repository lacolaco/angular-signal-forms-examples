import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { fieldErrors } from '../../lib/field-errors';
import { AppButton } from '../../lib/ui/button';
import { AppExamplePage } from '../../lib/ui/example-page';
import { AppFormField } from '../../lib/ui/form-field';
import readme from './README.md';

interface CommentValue {
  nickname: string;
  comment: string;
}

/**
 * Comment Post Example
 *
 * 非同期フォーム送信中の UI フィードバックを示すコメント投稿フォーム。
 *
 * ## 学習ポイント
 * - form().submitting() シグナルによる送信中状態の取得
 * - submitting() を使ったボタンの無効化とラベル切り替え
 * - submit() の非同期アクション内での HTTP リクエスト
 */
@Component({
  selector: 'app-comment-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExamplePage],
  template: `
    <app-example-page [readme]="readme" sourcePath="examples/comment-post/comment-post.ts">
      <form novalidate (submit)="onSubmit(); $event.preventDefault()">
        <app-form-field class="mb-4" label="ニックネーム" [errorMessages]="nicknameErrors()">
          <input
            type="text"
            [formField]="commentForm.nickname"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="commentForm.nickname().touched() && commentForm.nickname().invalid()"
          />
        </app-form-field>

        <app-form-field class="mb-6" label="コメント" [errorMessages]="commentErrors()">
          <textarea
            [formField]="commentForm.comment"
            class="form-input aria-invalid:border-red-500"
            rows="4"
            [aria-invalid]="commentForm.comment().touched() && commentForm.comment().invalid()"
          ></textarea>
        </app-form-field>

        <app-button type="submit" [disabled]="commentForm().submitting()">
          {{ commentForm().submitting() ? '投稿中...' : '投稿する' }}
        </app-button>
      </form>

      @if (submittedValue(); as value) {
        <div class="form-success">
          コメントが投稿されました。({{ value.nickname }}: {{ value.comment }})
        </div>
      }
    </app-example-page>
  `,
})
export class CommentPost {
  protected readonly readme = readme;
  private readonly http = inject(HttpClient);

  /** 送信済みの値。null は未送信を表す */
  readonly submittedValue = signal<CommentValue | null>(null);

  /** フォームモデル: ニックネームとコメントの2フィールド */
  readonly commentModel = signal<CommentValue>({
    nickname: '',
    comment: '',
  });

  /**
   * フォーム定義
   *
   * submit() の非同期アクション中、form().submitting() が true になる。
   * テンプレートでこのシグナルを参照してボタンの状態を制御する。
   */
  readonly commentForm = form(this.commentModel, (schema) => {
    required(schema.nickname, { message: 'ニックネームは必須です' });
    required(schema.comment, { message: 'コメントは必須です' });
  });

  readonly nicknameErrors = computed(() => fieldErrors(this.commentForm.nickname()));
  readonly commentErrors = computed(() => fieldErrors(this.commentForm.comment()));

  /**
   * フォーム送信処理
   *
   * submit() に渡した非同期コールバックの実行中、
   * form().submitting() が true になりボタンが無効化される。
   */
  onSubmit() {
    submit(this.commentForm, async () => {
      const value = this.commentModel();
      await firstValueFrom(this.http.post('/api/comments', value));
      this.submittedValue.set({ ...value });
    });
  }
}
