# Account Settings

## 概要

`{ profile: {...}, settings: {...} }` のネストオブジェクトをモデルに持つアカウント編集フォーム。Signal Forms がネスト構造をどう表現し、親フィールドが子の状態をどう集約するか、そして保存後の baseline をどう更新するかを学ぶ。

## 学習ポイント

- ネストモデルの `form()` 定義とパス到達 (`userForm.profile.firstName`)
- `schema()` + `apply()` による部分スキーマの切り出しと適用
- グループフィールドでの `valid()` / `dirty()` の集約
- サブツリー単位の `reset()`
- 送信時のスナップショット保存と、`linkedSignal` による baseline の自動更新
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
const INITIAL_USER: UserData = {
  profile: { firstName: 'Alice', lastName: 'Tanaka' },
  settings: { theme: 'light', notifications: true },
};

readonly userModel = signal<UserData>({ ...INITIAL_USER });

readonly userForm = form(this.userModel, (s) => {
  apply(s.profile, profileSchema);
});
```

テンプレート側ではセクションごとに `@let` で path を別名化すると、`userForm.profile.foo` の繰り返しを避けられる。

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

### グループフィールドの valid() / dirty()

親フィールド (`userForm.profile()`, `userForm.settings()`, 根の `userForm()`) は子フィールドの状態を集約する。

- ひとつでも子が `invalid` なら親も `invalid`
- ひとつでも子が `dirty` なら親も `dirty`

```html
<fieldset>
  @let profile = userForm.profile;

  <!-- セクション単位の dirty(): Unsaved 表示と Reset section の活性化 -->
  @if (profile().dirty()) {
    <span role="status">Unsaved</span>
  }
  <button [disabled]="!profile().dirty()" (click)="onResetProfile()">Reset section</button>
</fieldset>

<!-- 根の valid() + dirty(): Save ボタンの活性化制御 -->
<app-button [disabled]="!userForm().dirty() || !userForm().valid()">Save all changes</app-button>
```

フィールドレベルのエラーメッセージは `fieldErrors()` ヘルパー + `app-form-field` で該当フィールド直下にインライン表示する。

```html
<app-form-field label="First name" [errorMessages]="firstNameErrors()">
  <input
    type="text"
    [formField]="profile.firstName"
    [aria-invalid]="profile.firstName().touched() && profile.firstName().invalid()"
  />
</app-form-field>
```

### サブツリー単位の reset()

`FieldTree` のどのノードでも `.reset(value)` を呼べる。指定パスのサブツリーだけが初期化され、他のサブツリーは影響を受けない。戻り先は「現在の baseline」（後述）を使う。

```typescript
onResetProfile() {
  // profile サブツリーだけ baseline に戻す、settings は維持
  this.userForm.profile().reset({ ...this.currentBaseline().profile });
}

onResetSettings() {
  this.userForm.settings().reset({ ...this.currentBaseline().settings });
}
```

### 送信時のスナップショット保存と baseline の自動更新

送信が成功したら 2 つのことを行う。

1. **スナップショットを `submittedValue` に格納**: 送信した値の凍結コピー。結果表示はこの snapshot を参照する（live モデルではない）
2. **`form().reset(snapshot)` で dirty / touched をクリア**: 値は維持したまま「clean 状態」に戻し、Unsaved 表示と Save ボタンを落ち着かせる

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.userForm, async () => {
    const snapshot = { ...this.userModel() };
    this.submittedValue.set(snapshot);
    this.userForm().reset(snapshot);
  });
}
```

Reset section の戻り先は「直前の保存値」になってほしい。これを手書きの状態管理で書くと「submit のたびに baseline を更新する」副作用が増えるが、`linkedSignal` で `submittedValue` から派生させると同じ意味を宣言的に表現できる。

```typescript
readonly submittedValue = signal<UserData | null>(null);

// 未送信なら初期値、送信済みなら最新の送信値が baseline
readonly currentBaseline = linkedSignal<UserData>(
  () => this.submittedValue() ?? INITIAL_USER,
);
```

これにより「`AliceX` で保存 → 再編集して `AliceXYZ` → Reset section」を行うと、初期値の `Alice` ではなく直前の保存値 `AliceX` に戻る。

## コード

- [ソースコード](./account-settings.ts)
- [テスト](./account-settings.spec.ts)
