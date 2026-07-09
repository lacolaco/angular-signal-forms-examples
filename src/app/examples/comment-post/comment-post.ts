import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { fieldErrors } from '../../lib/field-errors';
import { AppButton } from '../../lib/ui/button';
import { AppExamplePage } from '../../lib/ui/example-page';
import { AppFormField } from '../../lib/ui/form-field';
import readme from './README.md';

@Component({
  selector: 'app-comment-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExamplePage],
  template: `
    <app-example-page [readme]="readme" sourcePath="examples/comment-post/comment-post.ts">
      <form novalidate (submit)="onSubmit($event)">
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

  readonly submittedValue = signal<{ nickname: string; comment: string } | null>(null);

  readonly commentModel = signal({
    nickname: '',
    comment: '',
  });

  readonly commentForm = form(this.commentModel, (schema) => {
    required(schema.nickname, { message: 'ニックネームは必須です' });
    required(schema.comment, { message: 'コメントは必須です' });
  });

  readonly nicknameErrors = computed(() => fieldErrors(this.commentForm.nickname()));
  readonly commentErrors = computed(() => fieldErrors(this.commentForm.comment()));

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.commentForm, async () => {
      const value = this.commentModel();
      await firstValueFrom(this.http.post('/api/comments', value));
      this.submittedValue.set({ ...value });
    });

    const fields = [this.commentForm.nickname, this.commentForm.comment];
    const firstInvalidField = fields.find((field) => field().invalid());
    firstInvalidField?.().focusBoundControl();
  }
}
