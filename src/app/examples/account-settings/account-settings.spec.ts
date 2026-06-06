import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from './account-settings';

/**
 * Account Settings は profile / settings の 2 セクションを持つネストモデル。
 * ここではネスト構造でしか観察できない挙動を中心に検証する:
 *   - パス到達: `userForm.profile.firstName` が DOM の First name と紐づく
 *   - グループ valid() の集約: 根の `userForm().valid()` が Save ボタンの活性化に反映
 *   - グループ dirty() の集約: セクションごとに Unsaved と Reset section が独立
 *   - セクション reset(): 片方のセクションだけ初期化、もう片方は維持
 *   - インラインのエラーメッセージ表示（実際のフォーム UI として現実的か）
 */
describe('AccountSettings', () => {
  const getFirstNameInput = () => screen.getByLabelText(/first name/i) as HTMLInputElement;
  const getLastNameInput = () => screen.getByLabelText(/last name/i) as HTMLInputElement;
  const getThemeSelect = () => screen.getByLabelText(/theme/i) as HTMLSelectElement;
  const getNotificationsCheckbox = () =>
    screen.getByLabelText(/email notifications/i) as HTMLInputElement;

  const getProfileSection = () => screen.getByRole('group', { name: /profile/i }) as HTMLElement;
  const getPreferencesSection = () =>
    screen.getByRole('group', { name: /preferences/i }) as HTMLElement;

  const getProfileResetButton = () =>
    within(getProfileSection()).getByRole('button', { name: /reset section/i });
  const getPreferencesResetButton = () =>
    within(getPreferencesSection()).getByRole('button', { name: /reset section/i });

  const getSaveButton = () => screen.getByRole('button', { name: /save all changes/i });

  describe('Initial state', () => {
    it('ネストパス経由でフォームと入力要素がバインドされている', async () => {
      await render(AccountSettings);

      expect(getFirstNameInput()).toHaveValue('Alice');
      expect(getLastNameInput()).toHaveValue('Tanaka');
      expect(getThemeSelect()).toHaveValue('light');
      expect(getNotificationsCheckbox()).toBeChecked();
    });

    it('初期状態では両セクションの Reset ボタンが無効', async () => {
      await render(AccountSettings);

      expect(getProfileResetButton()).toBeDisabled();
      expect(getPreferencesResetButton()).toBeDisabled();
    });

    it('初期状態（dirty でない）では Save ボタンが無効', async () => {
      await render(AccountSettings);

      expect(getSaveButton()).toBeDisabled();
    });

    it('初期状態ではエラーメッセージは表示されていない', async () => {
      await render(AccountSettings);

      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/last name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('インラインのバリデーションエラー表示', () => {
    it('First name を空にしてフォーカスを外すとエラーメッセージが該当フィールド下に表示される', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());
      await userEvent.tab();

      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });

    it('Last name のエラーは Profile セクション内に表示される（セクション境界が崩れない）', async () => {
      await render(AccountSettings);

      await userEvent.clear(getLastNameInput());
      await userEvent.tab();

      const errorMessage = screen.getByText(/last name is required/i);
      expect(getProfileSection()).toContainElement(errorMessage);
    });
  });

  describe('グループ valid() の集約: Save ボタンに roll-up される', () => {
    it('Profile を編集すると Save ボタンが活性化する（dirty + valid）', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');

      expect(getSaveButton()).toBeEnabled();
    });

    it('First name を空にすると Save ボタンは無効（dirty だが invalid）', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());

      expect(getSaveButton()).toBeDisabled();
    });

    it('Profile が invalid な状態では Preferences を編集しても Save は無効', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());
      await userEvent.selectOptions(getThemeSelect(), 'dark');

      expect(getSaveButton()).toBeDisabled();
    });
  });

  describe('グループ dirty() の集約: セクションごとに変更を独立に検知', () => {
    it('Profile を編集すると Profile セクションだけに Unsaved が出る', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');

      expect(within(getProfileSection()).getByText(/unsaved/i)).toBeInTheDocument();
      expect(within(getPreferencesSection()).queryByText(/unsaved/i)).not.toBeInTheDocument();
    });

    it('Preferences を編集すると Preferences セクションだけに Unsaved が出る', async () => {
      await render(AccountSettings);

      await userEvent.selectOptions(getThemeSelect(), 'dark');

      expect(within(getPreferencesSection()).getByText(/unsaved/i)).toBeInTheDocument();
      expect(within(getProfileSection()).queryByText(/unsaved/i)).not.toBeInTheDocument();
    });

    it('セクションが dirty なときだけ section の Reset が活性化', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');

      expect(getProfileResetButton()).toBeEnabled();
      expect(getPreferencesResetButton()).toBeDisabled();
    });
  });

  describe('セクション単位の reset(): 片側のみ初期化', () => {
    it('両セクションを編集した後 Profile だけリセットすると Preferences の編集は残る', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');
      await userEvent.selectOptions(getThemeSelect(), 'dark');

      await userEvent.click(getProfileResetButton());

      // Profile は初期値に復帰
      expect(getFirstNameInput()).toHaveValue('Alice');
      expect(getLastNameInput()).toHaveValue('Tanaka');
      // Preferences の変更は保持
      expect(getThemeSelect()).toHaveValue('dark');
      // Profile の Unsaved は消え、Preferences の Unsaved は残る
      expect(within(getProfileSection()).queryByText(/unsaved/i)).not.toBeInTheDocument();
      expect(within(getPreferencesSection()).getByText(/unsaved/i)).toBeInTheDocument();
    });

    it('Preferences だけリセットすると Profile の編集は残る', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');
      await userEvent.selectOptions(getThemeSelect(), 'dark');
      await userEvent.click(getNotificationsCheckbox());

      await userEvent.click(getPreferencesResetButton());

      expect(getThemeSelect()).toHaveValue('light');
      expect(getNotificationsCheckbox()).toBeChecked();
      expect(getFirstNameInput()).toHaveValue('AliceX');
      expect(within(getPreferencesSection()).queryByText(/unsaved/i)).not.toBeInTheDocument();
      expect(within(getProfileSection()).getByText(/unsaved/i)).toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('valid な状態で送信すると submit 時点のスナップショットが全フィールド表示される', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');
      await userEvent.selectOptions(getThemeSelect(), 'dark');
      await userEvent.click(getNotificationsCheckbox()); // ON → OFF
      await userEvent.click(getSaveButton());

      // submittedValue は submit 時点のスナップショット。live モデルではなく
      // 送信した 4 フィールドすべてが結果ブロックに表示される。
      expect(screen.getByText(/account updated/i)).toBeInTheDocument();
      expect(screen.getByText(/first name: AliceX/i)).toBeInTheDocument();
      expect(screen.getByText(/last name: Tanaka/i)).toBeInTheDocument();
      expect(screen.getByText(/theme: dark/i)).toBeInTheDocument();
      expect(screen.getByText(/email notifications: off/i)).toBeInTheDocument();
    });

    it('First name が空のまま submit を試みても送信されない（dirty かつ invalid なら Save 自体が無効）', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());

      expect(getSaveButton()).toBeDisabled();
      expect(screen.queryByText(/account updated/i)).not.toBeInTheDocument();
    });

    it('送信後にセクション Reset を押すと送信メッセージが消える', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');
      await userEvent.click(getSaveButton());
      expect(screen.getByText(/account updated/i)).toBeInTheDocument();

      await userEvent.click(getProfileResetButton());

      expect(screen.queryByText(/account updated/i)).not.toBeInTheDocument();
    });
  });
});
