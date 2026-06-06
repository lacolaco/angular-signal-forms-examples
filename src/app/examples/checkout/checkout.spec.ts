import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal, twoWayBinding } from '@angular/core';
import { ExpiryDateInput, Checkout } from './checkout';

describe('ExpiryDateInput', () => {
  const getMonthInput = () => screen.getByPlaceholderText('MM') as HTMLInputElement;
  const getYearInput = () => screen.getByPlaceholderText('YY') as HTMLInputElement;

  describe('Initial state', () => {
    it('should render month and year inputs', async () => {
      await render(ExpiryDateInput);

      expect(getMonthInput()).toBeInTheDocument();
      expect(getYearInput()).toBeInTheDocument();
    });

    it('should reflect initial value from binding', async () => {
      const expiryDate = signal('12/25');
      await render(ExpiryDateInput, {
        bindings: [twoWayBinding('value', expiryDate)],
      });

      expect(getMonthInput()).toHaveValue('12');
      expect(getYearInput()).toHaveValue('25');
    });
  });

  describe('Value synchronization', () => {
    it('should update expiryDate when month is entered', async () => {
      const expiryDate = signal('');
      const { fixture } = await render(ExpiryDateInput, {
        bindings: [twoWayBinding('value', expiryDate)],
      });

      await userEvent.type(getMonthInput(), '03');
      fixture.detectChanges();

      expect(expiryDate()).toBe('03/');
    });

    it('should update expiryDate when year is entered', async () => {
      const expiryDate = signal('03/');
      const { fixture } = await render(ExpiryDateInput, {
        bindings: [twoWayBinding('value', expiryDate)],
      });

      await userEvent.type(getYearInput(), '26');
      fixture.detectChanges();

      expect(expiryDate()).toBe('03/26');
    });

    it('should sync value bidirectionally', async () => {
      const expiryDate = signal('');
      const { fixture } = await render(ExpiryDateInput, {
        bindings: [twoWayBinding('value', expiryDate)],
      });

      // UI -> Model
      await userEvent.type(getMonthInput(), '06');
      await userEvent.type(getYearInput(), '27');
      fixture.detectChanges();

      expect(expiryDate()).toBe('06/27');

      // Model -> UI
      expiryDate.set('12/30');
      fixture.detectChanges();

      expect(getMonthInput()).toHaveValue('12');
      expect(getYearInput()).toHaveValue('30');
    });
  });
});

describe('Checkout', () => {
  const getCardNumberInput = () => screen.getByLabelText(/card number/i) as HTMLInputElement;
  const getMonthInput = () => screen.getByPlaceholderText('MM') as HTMLInputElement;
  const getYearInput = () => screen.getByPlaceholderText('YY') as HTMLInputElement;
  const getSecurityCodeInput = () => screen.getByLabelText(/security code/i) as HTMLInputElement;
  const getCardholderNameInput = () =>
    screen.getByLabelText(/cardholder name/i) as HTMLInputElement;
  const getPayButton = () => screen.getByRole('button', { name: /pay/i });

  const fillAllFields = async () => {
    await userEvent.type(getCardNumberInput(), '4111111111111111');
    await userEvent.type(getMonthInput(), '12');
    await userEvent.type(getYearInput(), '25');
    await userEvent.type(getSecurityCodeInput(), '123');
    await userEvent.type(getCardholderNameInput(), 'John Doe');
  };

  describe('Initial state', () => {
    it('should render the form', async () => {
      await render(Checkout);

      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
      expect(getCardNumberInput()).toBeInTheDocument();
      expect(getMonthInput()).toBeInTheDocument();
      expect(getYearInput()).toBeInTheDocument();
      expect(getSecurityCodeInput()).toBeInTheDocument();
      expect(getCardholderNameInput()).toBeInTheDocument();
      expect(getPayButton()).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when cardNumber is empty', async () => {
      await render(Checkout);

      await userEvent.type(getMonthInput(), '12');
      await userEvent.type(getYearInput(), '25');
      await userEvent.type(getSecurityCodeInput(), '123');
      await userEvent.type(getCardholderNameInput(), 'John Doe');
      await userEvent.click(getPayButton());

      expect(screen.queryByText(/payment complete/i)).not.toBeInTheDocument();
      expect(screen.getByText(/card number is required/i)).toBeInTheDocument();
    });

    it('should show error when expiryDate is empty', async () => {
      await render(Checkout);

      await userEvent.type(getCardNumberInput(), '4111111111111111');
      await userEvent.type(getSecurityCodeInput(), '123');
      await userEvent.type(getCardholderNameInput(), 'John Doe');
      await userEvent.click(getPayButton());

      expect(screen.queryByText(/payment complete/i)).not.toBeInTheDocument();
      expect(screen.getByText(/expiry date is required/i)).toBeInTheDocument();
    });

    it('should focus month input via focusBoundControl when expiryDate is invalid', async () => {
      await render(Checkout);

      await userEvent.type(getCardNumberInput(), '4111111111111111');
      await userEvent.click(getPayButton());

      // focusBoundControl() 経由で ExpiryDateInput.focus() が呼ばれ、月入力にフォーカス
      expect(document.activeElement).toBe(getMonthInput());
    });

    it('should show error when securityCode is empty', async () => {
      await render(Checkout);

      await userEvent.type(getCardNumberInput(), '4111111111111111');
      await userEvent.type(getMonthInput(), '12');
      await userEvent.type(getYearInput(), '25');
      await userEvent.type(getCardholderNameInput(), 'John Doe');
      await userEvent.click(getPayButton());

      expect(screen.queryByText(/payment complete/i)).not.toBeInTheDocument();
      expect(screen.getByText(/security code is required/i)).toBeInTheDocument();
    });

    it('should show error when cardholderName is empty', async () => {
      await render(Checkout);

      await userEvent.type(getCardNumberInput(), '4111111111111111');
      await userEvent.type(getMonthInput(), '12');
      await userEvent.type(getYearInput(), '25');
      await userEvent.type(getSecurityCodeInput(), '123');
      await userEvent.click(getPayButton());

      expect(screen.queryByText(/payment complete/i)).not.toBeInTheDocument();
      expect(screen.getByText(/cardholder name is required/i)).toBeInTheDocument();
    });
  });

  describe('Successful submission', () => {
    it('should submit successfully with all fields filled', async () => {
      await render(Checkout);

      await fillAllFields();
      await userEvent.click(getPayButton());

      expect(screen.getByText(/payment complete/i)).toBeInTheDocument();
    });

    it('should preserve submitted expiryDate format', async () => {
      await render(Checkout);

      await userEvent.type(getCardNumberInput(), '4111111111111111');
      await userEvent.type(getMonthInput(), '06');
      await userEvent.type(getYearInput(), '27');
      await userEvent.type(getSecurityCodeInput(), '456');
      await userEvent.type(getCardholderNameInput(), 'Jane Smith');
      await userEvent.click(getPayButton());

      expect(screen.getByText(/06\/27/)).toBeInTheDocument();
    });
  });
});
