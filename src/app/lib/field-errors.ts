import type { FieldState } from '@angular/forms/signals';

/**
 * FieldState からエラーメッセージを抽出する純粋関数
 *
 * ## 使い方
 * ```typescript
 * // computed() と組み合わせて使用
 * readonly emailErrors = computed(() => fieldErrors(this.form.email()));
 * ```
 *
 * ## 動作
 * - touched() && invalid() の場合のみエラーメッセージを返す
 * - errors() 配列から message または kind を抽出して文字列配列に変換
 * - touched でない、または valid な場合は空配列を返す
 */
export function fieldErrors(fieldState: FieldState<unknown>): string[] {
  if (fieldState.touched() && fieldState.invalid()) {
    return fieldState.errors().map((e) => e.message ?? e.kind);
  }
  return [];
}
