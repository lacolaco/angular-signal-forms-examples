import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SimpleSignup } from './simple-signup';

describe('SimpleSignup', () => {
  const getEmailInput = () => screen.getByLabelText(/email/i) as HTMLInputElement;
  const getPasswordInput = () => screen.getByLabelText(/^password$/i) as HTMLInputElement;
  const getConfirmPasswordInput = () =>
    screen.getByLabelText(/confirm password/i) as HTMLInputElement;
  const getSignUpButton = () => screen.getByRole('button', { name: /sign up/i });

  const fillAllFields = async () => {
    await userEvent.type(getEmailInput(), 'test@example.com');
    await userEvent.type(getPasswordInput(), 'password123');
    await userEvent.type(getConfirmPasswordInput(), 'password123');
  };

  describe('Initial state', () => {
    it('should render the form', async () => {
      await render(SimpleSignup);

      expect(screen.getByRole('heading', { name: /simple signup/i })).toBeInTheDocument();
      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
      expect(getSignUpButton()).toBeInTheDocument();
    });

    it('should have empty inputs initially', async () => {
      await render(SimpleSignup);

      expect(getEmailInput()).toHaveValue('');
      expect(getPasswordInput()).toHaveValue('');
      expect(getConfirmPasswordInput()).toHaveValue('');
    });
  });

  describe('Validation', () => {
    it('should show error when email is empty', async () => {
      await render(SimpleSignup);

      await userEvent.type(getPasswordInput(), 'password123');
      await userEvent.type(getConfirmPasswordInput(), 'password123');
      await userEvent.click(getSignUpButton());

      expect(screen.queryByText(/sign up successful/i)).not.toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('should show error when email is invalid', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'invalid-email');
      await userEvent.type(getPasswordInput(), 'password123');
      await userEvent.type(getConfirmPasswordInput(), 'password123');
      await userEvent.click(getSignUpButton());

      expect(screen.queryByText(/sign up successful/i)).not.toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('should show error when password is empty', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getConfirmPasswordInput(), 'password123');
      await userEvent.click(getSignUpButton());

      expect(screen.queryByText(/sign up successful/i)).not.toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('should show error when confirmPassword is empty', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'password123');
      await userEvent.click(getSignUpButton());

      expect(screen.queryByText(/sign up successful/i)).not.toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });

    it('should show error when passwords do not match', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'password123');
      await userEvent.type(getConfirmPasswordInput(), 'different-password');
      await userEvent.click(getSignUpButton());

      expect(screen.queryByText(/sign up successful/i)).not.toBeInTheDocument();
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('Focus control', () => {
    it('should focus email input when email is invalid', async () => {
      await render(SimpleSignup);

      await userEvent.click(getSignUpButton());

      expect(document.activeElement).toBe(getEmailInput());
    });

    it('should focus password input when only password is invalid', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.click(getSignUpButton());

      expect(document.activeElement).toBe(getPasswordInput());
    });

    it('should focus confirmPassword input when passwords do not match', async () => {
      await render(SimpleSignup);

      await userEvent.type(getEmailInput(), 'test@example.com');
      await userEvent.type(getPasswordInput(), 'password123');
      await userEvent.type(getConfirmPasswordInput(), 'different');
      await userEvent.click(getSignUpButton());

      expect(document.activeElement).toBe(getConfirmPasswordInput());
    });
  });

  describe('Successful submission', () => {
    it('should submit successfully with all fields valid', async () => {
      await render(SimpleSignup);

      await fillAllFields();
      await userEvent.click(getSignUpButton());

      expect(screen.getByText(/sign up successful/i)).toBeInTheDocument();
    });

    it('should not focus any field on successful submission', async () => {
      await render(SimpleSignup);

      await fillAllFields();
      await userEvent.click(getSignUpButton());

      // 送信成功時は invalid なフィールドがないためフォーカス移動なし
      expect(document.activeElement).not.toBe(getEmailInput());
      expect(document.activeElement).not.toBe(getPasswordInput());
      expect(document.activeElement).not.toBe(getConfirmPasswordInput());
    });
  });
});
