# Account Settings

## 概要

`{ profile: {...}, settings: {...} }` のネストオブジェクトをモデルに持つアカウント編集フォーム。Signal Forms がネスト構造をどう表現し、親フィールドが子の状態をどう集約するかを学ぶ。

## 学習ポイント

- ネストモデルの `form()` 定義とパス到達 (`userForm.profile.firstName`)
- `schema()` + `apply()` による部分スキーマの切り出しと適用
- グループフィールドでの `valid()` / `dirty()` の集約
- サブツリー単位の `reset()`
- インラインのエラーメッセージ表示

## フォーム構造

| パス | 型 | バリデーション |
|---|---|---|
| `profile.firstName` | `string` | `required`, `maxLength(50)` |
| `profile.lastName` | `string` | `required`, `maxLength(50)` |
| `settings.theme` | `'light' \| 'dark' \| 'auto'` | 型レベル制約のみ |
| `settings.notifications` | `boolean` | なし |

## 実装の要点

### ネストモデルとパス到達

モデルがネストされていれば、`form()` が生成する `FieldTree` も同じ階層になる。`userForm.profile.firstName` のように TypeScript の型補完が効いた状態で末端まで辿れる。

```typescript
readonly userModel = signal<UserData>({
  profile: { firstName: 'Alice', lastName: 'Tanaka' },
  settings: { theme: 'light', notifications: true },
});

readonly userForm = form(this.userModel, (s) => {
  apply(s.profile, profileSchema);
});
```

```html
<input [formField]="userForm.profile.firstName" />
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

### グループフィールドの valid() / dirty()

親フィールド (`userForm.profile()`, `userForm.settings()`, 根の `userForm()`) は子フィールドの状態を集約する。

- ひとつでも子が `invalid` なら親も `invalid`
- ひとつでも子が `dirty` なら親も `dirty`

```html
<!-- セクション単位の dirty(): Unsaved 表示と Reset section の活性化 -->
@if (userForm.profile().dirty()) {
  <span class="badge" role="status">Unsaved</span>
}
<button [disabled]="!userForm.profile().dirty()" (click)="onResetProfile()">
  Reset section
</button>

<!-- 根の valid() + dirty(): Save ボタンの活性化制御 -->
<app-button [disabled]="!userForm().dirty() || !userForm().valid()">
  Save all changes
</app-button>
```

フィールドレベルのエラーメッセージは `fieldErrors()` ヘルパー + `app-form-field` で該当フィールド直下にインライン表示する。

```html
<app-form-field label="First name" [errorMessages]="firstNameErrors()">
  <input
    type="text"
    [formField]="userForm.profile.firstName"
    [aria-invalid]="userForm.profile.firstName().touched() && userForm.profile.firstName().invalid()"
  />
</app-form-field>
```

### サブツリー単位の reset()

`FieldTree` のどのノードでも `.reset(value)` を呼べる。指定パスのサブツリーだけが初期化され、他のサブツリーは影響を受けない。

```typescript
onResetProfile() {
  // profile サブツリー（firstName, lastName）だけ初期化、settings は維持
  this.userForm.profile().reset({ firstName: 'Alice', lastName: 'Tanaka' });
}

onResetSettings() {
  this.userForm.settings().reset({ theme: 'light', notifications: true });
}
```

## コード

- [ソースコード](./account-settings.ts)
- [テスト](./account-settings.spec.ts)
