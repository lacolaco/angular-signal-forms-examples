import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { EventRegistration } from './event-registration';

describe('EventRegistration', () => {
  const getSubmitButton = () => screen.getByRole('button', { name: /register/i });
  const getAddButton = () => screen.getByRole('button', { name: /add participant/i });
  const getParticipantRows = () => screen.getAllByTestId('participant-row');
  const getParticipantInputs = () => screen.getAllByPlaceholderText('Participant name');
  const getRemoveButtons = () => screen.queryAllByRole('button', { name: /remove/i });

  describe('Initial state', () => {
    it('should show one participant row by default', async () => {
      await render(EventRegistration);

      expect(getParticipantRows()).toHaveLength(1);
    });

    it('should not show remove button when only one participant', async () => {
      await render(EventRegistration);

      expect(getRemoveButtons()).toHaveLength(0);
    });
  });

  describe('Add/Remove participants', () => {
    it('should add participant row when clicking add button', async () => {
      await render(EventRegistration);

      await userEvent.click(getAddButton());

      expect(getParticipantRows()).toHaveLength(2);
    });

    it('should show remove buttons when multiple participants exist', async () => {
      await render(EventRegistration);

      await userEvent.click(getAddButton());

      expect(getRemoveButtons()).toHaveLength(2);
    });

    it('should remove participant row when clicking remove button', async () => {
      await render(EventRegistration);

      await userEvent.click(getAddButton());
      expect(getParticipantRows()).toHaveLength(2);

      const removeButtons = getRemoveButtons();
      await userEvent.click(removeButtons[0]);

      expect(getParticipantRows()).toHaveLength(1);
    });

    it('should keep at least one participant', async () => {
      await render(EventRegistration);

      // 1人の時は削除ボタンが表示されない
      expect(getRemoveButtons()).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should show error when participant name is empty', async () => {
      await render(EventRegistration);

      await userEvent.click(getSubmitButton());

      expect(screen.getByText('Participant name is required')).toBeInTheDocument();
    });

    it('should validate all participants independently', async () => {
      await render(EventRegistration);

      // 1人目は入力
      const inputs = getParticipantInputs();
      await userEvent.type(inputs[0], 'John Smith');

      // 2人目を追加（空のまま）
      await userEvent.click(getAddButton());
      await userEvent.click(getSubmitButton());

      // 2人目のバリデーションエラー
      expect(screen.getByText('Participant name is required')).toBeInTheDocument();
    });
  });

  describe('Successful submission', () => {
    it('should submit successfully with valid data', async () => {
      await render(EventRegistration);

      const input = getParticipantInputs()[0];
      await userEvent.type(input, 'John Smith');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/registration complete/i)).toBeInTheDocument();
      expect(screen.getByText(/1 participant/)).toBeInTheDocument();
    });

    it('should submit successfully with multiple participants', async () => {
      await render(EventRegistration);

      // 1人目
      await userEvent.type(getParticipantInputs()[0], 'John Smith');

      // 2人目を追加
      await userEvent.click(getAddButton());
      const inputs = getParticipantInputs();
      await userEvent.type(inputs[1], 'Jane Doe');

      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/registration complete/i)).toBeInTheDocument();
      expect(screen.getByText(/2 participant/)).toBeInTheDocument();
    });
  });
});
