# Account Settings

## 概要

`{ profile, settings }` の **2 階層ネストモデル** を題材に、Signal Forms がネスト構造をどう扱うかを学ぶサンプル。プロフィール（名前）と環境設定（テーマ・通知）が独立した 2 セクションに分かれた、実際のアカウント編集画面に近い UI で構成する。

ネスト構造のときだけ観察できる挙動が学習対象であり、フラットモデル中心の他サンプル（[Settings](../settings/README.md) など）と対比すると、同じ API がフィールド単位とグループ単位でどう振る舞いを変えるかが明確になる。

## 学習ポイント

- **ネストパス到達**: モデル形状と `FieldTree` の階層が 1:1 に対応する。`userForm.profile.firstName` のように構造をそのまま辿れる
- **グループ `valid()` の集約**: 根の `userForm().valid()` がツリー全体の妥当性を集約し、Save ボタンの活性化制御に直結する。子フィールドのインラインエラーと組み合わせ、「どこが invalid か」をユーザーに示しつつ送信を抑止する
- **グループ `dirty()` の集約**: セクション単位で変更を独立に検知でき、Unsaved 表示と Reset section ボタンの活性化に反映する
- **セクション `reset()`**: サブツリーごとに `.reset(value)` を呼ぶと、その部分だけ初期化されもう一方は維持される
- **`schema()` + `apply()`**: `profile` 部分のスキーマを切り出して再利用可能にし、フォーム本体は `apply(s.profile, profileSchema)` で接続する

## フォーム構造

```ts
interface Profile {
  firstName: string;
  lastName: string;
}

interface Preferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

interface UserData {
  profile: Profile;
  settings: Preferences;
}
```

| パス | 型 | バリデーション |
| ---- | -- | -------------- |
| `profile.firstName` | `string` | `required` / `maxLength(50)` |
| `profile.lastName` | `string` | `required` / `maxLength(50)` |
| `settings.theme` | `'light' \| 'dark' \| 'auto'` | 型レベル制約のみ |
| `settings.notifications` | `boolean` | なし |

## 実装の要点

### ネストモデルとパス到達

モデルがネストされていれば、`form()` が生成する `FieldTree` も同じ階層になる。**特別な API は不要で、`userForm.profile.firstName` のように TypeScript の型補完が効いた状態で末端まで辿れる**。

```typescript
readonly userModel = signal<UserData>({
  profile: { firstName: 'Alice', lastName: 'Tanaka' },
  settings: { theme: 'light', notifications: true },
});

readonly userForm = form(this.userModel, (s) => {
  apply(s.profile, profileSchema);
});

// テンプレート側
// <input [formField]="userForm.profile.firstName" />
```

### schema() + apply() による部分スキーマの分離

`schema<T>(fn)` で「ある型 T を持つ任意のパスに適用できる」再利用可能なスキーマを作る。トップレベルのフォーム定義からは `apply(s.profile, profileSchema)` で接続する。**プロジェクト内で同じ Profile 構造を扱う別フォームができたとき、`profileSchema` をそのまま使える**。

```typescript
const profileSchema = schema<Profile>((p) => {
  required(p.firstName, { message: 'First name is required' });
  maxLength(p.firstName, 50, { message: 'First name must be 50 characters or fewer' });
  required(p.lastName, { message: 'Last name is required' });
  maxLength(p.lastName, 50, { message: 'Last name must be 50 characters or fewer' });
});

readonly userForm = form(this.userModel, (s) => {
  apply(s.profile, profileSchema);
});
```

### グループフィールドでの valid() / dirty() の集約

親フィールド (`userForm.profile()`, `userForm.settings()`, そして根の `userForm()`) は子フィールドの状態を自動で集約する。**ひとつでも子が invalid なら親も invalid**、**ひとつでも子が dirty なら親も dirty**。

実際の UI では、この集約が「インラインのエラーメッセージ」「Unsaved の表示」「Save ボタンの活性化」という現実的な要素に直結する。Valid/Invalid を直接ラベル表示するのではなく、ユーザーが操作可能な要素の状態として現れる点が、フォーム UI を作るうえで本質的な観点になる。

```html
<!-- セクション単位の dirty(): 該当セクションが dirty な時だけ Unsaved を出す -->
<fieldset>
  <legend>Profile</legend>
  @if (userForm.profile().dirty()) {
    <span class="badge badge-dirty" role="status">Unsaved</span>
  }
  <button [disabled]="!userForm.profile().dirty()" (click)="onResetProfile()">
    Reset section
  </button>
  ...
</fieldset>

<!-- 根の valid() + dirty(): Save ボタンの活性化制御 -->
<app-button
  type="submit"
  [disabled]="!userForm().dirty() || !userForm().valid()"
>
  Save all changes
</app-button>
```

フィールドレベルのエラーメッセージは `fieldErrors()` ヘルパー + `app-form-field` に渡し、touched + invalid のときだけ該当フィールドの直下にインライン表示する（既存サンプル共通の書き方）。

```html
<app-form-field label="First name" [errorMessages]="firstNameErrors()">
  <input
    type="text"
    [formField]="userForm.profile.firstName"
    [aria-invalid]="userForm.profile.firstName().touched() && userForm.profile.firstName().invalid()"
  />
</app-form-field>
```

### セクション単位の reset()

`FieldTree` 上のどのノードでも `.reset(value)` を呼べる。ノードが指すサブツリーの値と状態（touched/dirty）だけがリセットされ、ツリーの他の部分は影響を受けない。**「Profile だけ元に戻して Preferences の編集はそのまま残す」を 1 行で表現できる**のがネスト構造の利点。

```typescript
onResetProfile() {
  // profile サブツリー（firstName, lastName）だけ初期化、settings は維持
  this.userForm.profile().reset({ firstName: 'Alice', lastName: 'Tanaka' });
}

onResetSettings() {
  this.userForm.settings().reset({ theme: 'light', notifications: true });
}
```

フラットな [Settings](../settings/README.md) ではフォーム全体に対する `.reset()` しかなかったが、ネスト構造では同じ API が **サブツリー単位** で機能する点が学びどころ。

## コード

- [ソースコード](./account-settings.ts)
- [テスト](./account-settings.spec.ts)
