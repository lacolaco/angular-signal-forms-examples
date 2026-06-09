# Business Trip Request

## 概要

出発日・帰着日・目的・予算を入力する出張申請フォーム。組み込みバリデータでは表現できないルール (今日以降の日付、出発日と帰着日の整合、出張期間の上限) を、独自バリデータの 3 つの書き方 — `validate()` の戻り値 3 形、validator factory、`validateTree()` — で表現する。

## 学習ポイント

- `validate()` の戻り値: `undefined` (pass) / 単一エラー / エラー配列の使い分け
- validator factory: 引数で振る舞いを切り替え、複数 field に再利用する関数の作り方
- `validateTree()` + `fieldTreeOf()`: 親パスで cross-field を宣言し、エラーを特定の子 field にターゲットする書き方

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `departureDate` | `string` (YYYY-MM-DD) | `required`, `dateAtLeast(today, ...)` (factory) |
| `returnDate` | `string` (YYYY-MM-DD) | `required`, `dateAtLeast(today, ...)` (factory) |
| `purpose` | `string` | `required`, `maxLength(200)` |
| `budget` | `number` | `min(1)` |
| (ツリー) | — | `validateTree()` で 出発日 ≤ 帰着日 / 期間 ≤ 14日 |

## 実装の要点

### `validate()` の戻り値 3 形

`validate(path, logic)` の `logic` は次のいずれかを返す。

- `undefined` — エラーなし (pass)
- 単一の `{ kind, message }` — そのフィールドにエラーを 1 件
- 配列 `[{...}, {...}]` — 同時に複数件 (主に `validateTree()` で使う)

```typescript
// 単一エラー or undefined のパターン
validate(s.departureDate, ({ value }) => {
  if (!value()) return undefined;
  if (value() < today) {
    return { kind: 'dateAtLeast', message: '出発日は今日以降を指定してください' };
  }
  return undefined;
});
```

エラーオブジェクトの最小プロパティは `kind` (文字列) と `message` (任意)。`kind` は `getError(kind)` で取り出すときの判定キーになる。

### factory パターン: 引数で振る舞いを切り替えて再利用

同じバリデーションロジックを別フィールドにも適用したいときは、validator を返す関数 (factory) を定義する。引数で「最小日付」や「メッセージ」を差し替えられる。

```typescript
function dateAtLeast(minIsoDate: string, message: string): FieldValidator<string> {
  return ({ value }) => {
    const v = value();
    if (!v) return undefined;
    if (v < minIsoDate) {
      return { kind: 'dateAtLeast', message };
    }
    return undefined;
  };
}

// 同じ factory を 2 つの field で再利用
validate(s.departureDate, dateAtLeast(today, '出発日は今日以降を指定してください'));
validate(s.returnDate, dateAtLeast(today, '帰着日は今日以降を指定してください'));
```

戻り値の型 `FieldValidator<TValue>` を明示すると、`({ value })` の型推論がきいて補完が効く。

### `validateTree()`: 親パスで cross-field を宣言

複数フィールドを参照するルール (出発日 ≤ 帰着日、期間 ≤ 14日) は、各 field に書くよりも親パスに 1 つ書いた方が見通しが良い。`validateTree(path, logic)` は path のサブツリーを 1 回の `logic` で検査する。

エラーは配列で複数返せ、各エラーの `fieldTree` で「どの子 field に表示するか」をターゲットできる。`fieldTreeOf(path)` を使って SchemaPath を `ReadonlyFieldTree` に変換する。

```typescript
validateTree(s, ({ value, fieldTreeOf }) => {
  const v = value();
  if (!v.departureDate || !v.returnDate) return undefined;

  const errors: ValidationError.WithOptionalFieldTree[] = [];

  if (v.departureDate > v.returnDate) {
    errors.push({
      kind: 'invalidDateRange',
      message: '帰着日は出発日以降にしてください',
      fieldTree: fieldTreeOf(s.returnDate), // returnDate にエラーを付ける
    });
  }

  if (daysBetween(v.departureDate, v.returnDate) > 14) {
    errors.push({
      kind: 'tripTooLong',
      message: '出張期間は 14 日以内にしてください',
      fieldTree: fieldTreeOf(s.departureDate), // departureDate にエラーを付ける
    });
  }

  return errors.length > 0 ? errors : undefined;
});
```

`fieldTree` を省略した場合、エラーはルート (この `validateTree` を書いた path 自身) に付く。

### 戻り値の型と `ValidationError` ネームスペース

- `validate()` の logic: `ValidationResult<ValidationError.WithoutFieldTree>` — `fieldTree` は指定不可
- `validateTree()` の logic: `TreeValidationResult` (`ValidationError.WithOptionalFieldTree`) — `fieldTree` 指定可

ターゲット先を指定したいときは `validateTree()` を使う、と覚えればよい。

## コード

- [ソースコード](./business-trip-request.ts)
- [テスト](./business-trip-request.spec.ts)
