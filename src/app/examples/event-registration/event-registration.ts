import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { form, FormField, required, applyEach, submit } from '@angular/forms/signals';
import { AppButton } from '../../lib/ui/button';
import { AppExampleCard } from '../../lib/ui/example-card';
import { fieldErrors } from '../../lib/field-errors';

interface EventRegistrationData {
  participants: string[];
}

/**
 * Event Registration Example
 *
 * Signal Forms の配列サポートを活用した動的フォームのサンプル実装。
 * 参加者を動的に追加/削除できる。
 *
 * ## 学習ポイント
 * - applyEach(): 配列要素への共通バリデーション適用
 * - @for + $index: 配列要素の動的レンダリング
 * - モデル信号操作: update() による要素追加/削除
 * - schema.items[index]: 配列要素へのフォームフィールドバインディング
 */
@Component({
  selector: 'app-event-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppButton, AppExampleCard],
  template: `
    <app-example-card
      title="Event Registration"
      topic="Array Form"
      description="Register participants"
      sourcePath="examples/event-registration/event-registration.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-2">Participants</span>
          @for (participant of registrationModel().participants; track $index) {
            @let field = registrationForm.participants[$index];
            <div data-testid="participant-row" class="flex gap-2 mb-2">
              <input
                type="text"
                [formField]="field"
                class="form-input flex-1 aria-invalid:border-red-500"
                [aria-invalid]="field().touched() && field().invalid()"
                placeholder="Participant name"
              />
              @if (registrationModel().participants.length > 1) {
                <button
                  type="button"
                  class="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  (click)="removeParticipant($index)"
                >
                  Remove
                </button>
              }
            </div>
            @if (participantErrors()[$index].length > 0) {
              <ul class="mb-2 text-sm text-red-600">
                @for (message of participantErrors()[$index]; track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            }
          }
          <button
            type="button"
            class="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-300"
            (click)="addParticipant()"
          >
            + Add participant
          </button>
        </div>

        <app-button class="mt-6" type="submit">Register</app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success">
          Registration complete! ({{ submitted.participants.length }} participants)
        </div>
      }
    </app-example-card>
  `,
})
export class EventRegistration {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<EventRegistrationData | null>(null);

  /** フォームモデル */
  readonly registrationModel = signal<EventRegistrationData>({
    participants: [''],
  });

  /**
   * フォーム定義
   *
   * participants[]: 各要素が必須
   */
  readonly registrationForm = form(this.registrationModel, (schema) => {
    applyEach(schema.participants, (participant) => {
      required(participant, { message: 'Participant name is required' });
    });
  });

  /** 各参加者のエラーメッセージ */
  readonly participantErrors = computed(() => {
    return this.registrationModel().participants.map((_, index) => {
      return fieldErrors(this.registrationForm.participants[index]());
    });
  });

  /**
   * 参加者を追加
   */
  addParticipant() {
    this.registrationModel.update((current) => ({
      ...current,
      participants: [...current.participants, ''],
    }));
  }

  /**
   * 参加者を削除
   */
  removeParticipant(index: number) {
    this.registrationModel.update((current) => ({
      ...current,
      participants: current.participants.filter((_, i) => i !== index),
    }));
  }

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.registrationForm, async () => {
      this.submittedValue.set({ ...this.registrationModel() });
    });

    // invalid なフィールドにフォーカス
    const participants = this.registrationModel().participants;
    for (let i = 0; i < participants.length; i++) {
      const field = this.registrationForm.participants[i];
      if (field().invalid()) {
        field().focusBoundControl();
        return;
      }
    }
  }
}
