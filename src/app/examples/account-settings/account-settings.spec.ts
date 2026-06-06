import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from './account-settings';

describe('AccountSettings', () => {
  const getFirstNameInput = () => screen.getByLabelText(/first name/i) as HTMLInputElement;
  const getLastNameInput = () => screen.getByLabelText(/last name/i) as HTMLInputElement;
  const getThemeSelect = () => screen.getByLabelText(/theme/i) as HTMLSelectElement;
  const getNotificationsCheckbox = () =>
    screen.getByLabelText(/email notifications/i) as HTMLInputElement;
  const getSaveButton = () => screen.getByRole('button', { name: /save all changes/i });

  describe('Initial state', () => {
    it('ネストパス経由でフォームと入力要素がバインドされている', async () => {
      await render(AccountSettings);

      expect(getFirstNameInput()).toHaveValue('Alice');
      expect(getLastNameInput()).toHaveValue('Tanaka');
      expect(getThemeSelect()).toHaveValue('light');
      expect(getNotificationsCheckbox()).toBeChecked();
    });

    it('初期状態ではエラーメッセージは表示されていない', async () => {
      await render(AccountSettings);

      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/last name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('インラインのバリデーションエラー表示', () => {
    it('First name を空にしてフォーカスを外すとエラーメッセージが表示される', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());
      await userEvent.tab();

      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });

    it('Last name を空にしてフォーカスを外すとエラーメッセージが表示される', async () => {
      await render(AccountSettings);

      await userEvent.clear(getLastNameInput());
      await userEvent.tab();

      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('valid な状態で送信すると submit 時点のスナップショットが全フィールド表示される', async () => {
      await render(AccountSettings);

      await userEvent.type(getFirstNameInput(), 'X');
      await userEvent.selectOptions(getThemeSelect(), 'dark');
      await userEvent.click(getNotificationsCheckbox()); // ON → OFF
      await userEvent.click(getSaveButton());

      expect(screen.getByText(/account updated/i)).toBeInTheDocument();
      expect(screen.getByText(/first name: AliceX/i)).toBeInTheDocument();
      expect(screen.getByText(/last name: Tanaka/i)).toBeInTheDocument();
      expect(screen.getByText(/theme: dark/i)).toBeInTheDocument();
      expect(screen.getByText(/email notifications: off/i)).toBeInTheDocument();
    });

    it('First name が空のまま送信しようとしても結果は表示されない', async () => {
      await render(AccountSettings);

      await userEvent.clear(getFirstNameInput());
      await userEvent.click(getSaveButton());

      expect(screen.queryByText(/account updated/i)).not.toBeInTheDocument();
    });
  });
});
