# Account Settings

## 概要

`{ profile: {...}, settings: {...} }` のネストオブジェクトをモデルに持つアカウント編集フォーム。Signal Forms がネスト構造をどう表現し、親フィールドが子の状態をどう集約するかを学ぶ。

## 学習ポイント

- ネストモデルの `form()` 定義とパス到達 (`userForm.profile.firstName`)
- `schema()` + `apply()` による部分スキーマの切り出しと適用

## フォーム構造

| パス | 型 | バリデーション |
|---|---|---|
| `profile.firstName` | `string` | `required`, `maxLength(50)` |
| `profile.lastName` | `string` | `required`, `maxLength(50)` |
| `settings.theme` | `'light' \| 'dark' \| 'auto'` | 型レベル制約のみ |
| `settings.notifications` | `boolean` | なし |

## 実装の要点

### ネストモデルとパス到達

モデルがネストされていれば、`form()` が生成する `FieldTree` も同じ階層になる。末端まで型補完が効いた状態でパスを辿れる。

```typescript
readonly userModel = signal({
  profile: { firstName: 'Alice', lastName: 'Tanaka' },
  settings: { theme: 'light' as 'light' | 'dark' | 'auto', notifications: true },
});

readonly userForm = form(this.userModel);

// モデル形状と FieldTree の階層は 1:1 で対応する:
userForm.profile.firstName;            // : FieldTree<string>
userForm.settings.theme;               // : FieldTree<'light' | 'dark' | 'auto'>

// パス末尾を呼び出すと FieldState、その value() で現在値を読む:
userForm.profile.firstName().value();  // : string                 → 'Alice'
userForm.settings.theme().value();     // : 'light' | 'dark' | 'auto' → 'light'
```

テンプレート側でも同じパスをそのまま `[formField]` に渡す。セクションごとに `@let` で別名化すると、`userForm.profile.` の繰り返しを避けられる。

```html
<fieldset>
  @let profile = userForm.profile;
  <input [formField]="profile.firstName" />
  <input [formField]="profile.lastName" />
</fieldset>
```

### 部分スキーマの切り出し: schema() + apply()

`schema<T>(fn)` は「型 T を持つ任意のパスに適用できる」スキーマを作る。`apply(path, schema)` でフォーム内の特定パスに後付けで適用する。

```typescript
// profile の Profile 型に対する再利用可能なスキーマ
const profileSchema = schema<Profile>((p) => {
  required(p.firstName, { message: 'First name is required' });
  maxLength(p.firstName, 50, { message: 'First name must be 50 characters or fewer' });
  required(p.lastName, { message: 'Last name is required' });
  maxLength(p.lastName, 50, { message: 'Last name must be 50 characters or fewer' });
});

readonly userForm = form(this.userModel, (s) => {
  // profile サブツリーに profileSchema を適用
  apply(s.profile, profileSchema);
});
```

同じ `Profile` 型を持つ別フォーム（例: 共著者一覧の各要素）でも `profileSchema` をそのまま再利用できる。

## コード

- [ソースコード](./account-settings.ts)
- [テスト](./account-settings.spec.ts)
