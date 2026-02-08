import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Settings } from './settings';

describe('Settings', () => {
  const getLanguageSelect = () => screen.getByLabelText(/language/i) as HTMLSelectElement;
  const getEmailNotificationsCheckbox = () =>
    screen.getByLabelText(/email notifications/i) as HTMLInputElement;
  const getPageSizeSelect = () => screen.getByLabelText(/page size/i) as HTMLSelectElement;
  const getSaveButton = () => screen.getByRole('button', { name: /save/i });
  const getResetButton = () => screen.getByRole('button', { name: /reset to default/i });

  describe('Initial state', () => {
    it('should render the form with default values', async () => {
      await render(Settings);

      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      expect(getLanguageSelect()).toHaveValue('ja');
      expect(getEmailNotificationsCheckbox()).toBeChecked();
      expect(getPageSizeSelect()).toHaveValue('25');
    });

    it('should have reset button disabled initially', async () => {
      await render(Settings);

      expect(getResetButton()).toBeDisabled();
    });
  });

  describe('Dirty state', () => {
    it('should enable reset button when a field is modified', async () => {
      await render(Settings);

      await userEvent.selectOptions(getLanguageSelect(), 'en');

      expect(getResetButton()).toBeEnabled();
    });

    it('should show visual indicator on modified field', async () => {
      await render(Settings);

      const languageField = getLanguageSelect().closest('[data-field]')!;
      expect(languageField).not.toHaveClass('field-modified');

      await userEvent.selectOptions(getLanguageSelect(), 'en');

      expect(languageField).toHaveClass('field-modified');
    });

    it('should show unsaved changes message when form is dirty', async () => {
      await render(Settings);

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();

      await userEvent.selectOptions(getLanguageSelect(), 'en');

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Reset', () => {
    it('should restore all fields to default values', async () => {
      await render(Settings);

      await userEvent.selectOptions(getLanguageSelect(), 'en');
      await userEvent.click(getEmailNotificationsCheckbox());
      await userEvent.selectOptions(getPageSizeSelect(), '50');

      await userEvent.click(getResetButton());

      expect(getLanguageSelect()).toHaveValue('ja');
      expect(getEmailNotificationsCheckbox()).toBeChecked();
      expect(getPageSizeSelect()).toHaveValue('25');
    });

    it('should disable reset button after reset', async () => {
      await render(Settings);

      await userEvent.selectOptions(getLanguageSelect(), 'en');
      await userEvent.click(getResetButton());

      expect(getResetButton()).toBeDisabled();
    });

    it('should remove visual indicators after reset', async () => {
      await render(Settings);

      await userEvent.selectOptions(getLanguageSelect(), 'en');
      const languageField = getLanguageSelect().closest('[data-field]')!;
      expect(languageField).toHaveClass('field-modified');

      await userEvent.click(getResetButton());

      expect(languageField).not.toHaveClass('field-modified');
    });

    it('should hide unsaved changes message after reset', async () => {
      await render(Settings);

      await userEvent.selectOptions(getLanguageSelect(), 'en');
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

      await userEvent.click(getResetButton());

      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('should show success message on submit', async () => {
      await render(Settings);

      await userEvent.click(getSaveButton());

      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });
  });
});
