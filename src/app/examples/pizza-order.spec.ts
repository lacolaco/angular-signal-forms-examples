import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PizzaOrder } from './pizza-order';

describe('PizzaOrder', () => {
  const getOrderTypeSelect = () => screen.getByTestId('orderType') as HTMLSelectElement;
  const getPaymentMethodSelect = () => screen.queryByTestId('paymentMethod') as HTMLSelectElement;
  const getOrderButton = () => screen.getByRole('button', { name: /order/i });

  const fillRequiredFields = async () => {
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'John Smith');
  };

  describe('Conditional visibility', () => {
    it('should hide delivery address when To go is selected', async () => {
      await render(PizzaOrder);

      // デフォルトは To go
      expect(getOrderTypeSelect()).toHaveValue('togo');
      expect(screen.queryByPlaceholderText('Delivery address')).not.toBeInTheDocument();
    });

    it('should show delivery address when Delivery is selected', async () => {
      await render(PizzaOrder);

      await userEvent.selectOptions(getOrderTypeSelect(), 'delivery');

      expect(screen.getByPlaceholderText('Delivery address')).toBeInTheDocument();
    });
  });

  describe('Conditional validation', () => {
    it('should require delivery address when Delivery is selected', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await userEvent.selectOptions(getOrderTypeSelect(), 'delivery');
      // paymentMethod は自動で card に設定される
      await userEvent.click(getOrderButton());

      // 住所未入力でエラー
      expect(screen.getByText('Delivery address is required')).toBeInTheDocument();
    });

    it('should allow submission when To go + no address', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      // To go のまま（デフォルト）
      expect(getOrderTypeSelect()).toHaveValue('togo');
      await userEvent.selectOptions(getPaymentMethodSelect(), 'card');
      await userEvent.click(getOrderButton());

      // 成功メッセージ
      const successMessage = screen.getByText(/thank you for your order/i);
      expect(successMessage.parentElement?.textContent).toContain('To go');
    });
  });

  describe('Payment method behavior', () => {
    it('should show payment dropdown when To go is selected', async () => {
      await render(PizzaOrder);

      expect(getOrderTypeSelect()).toHaveValue('togo');
      expect(getPaymentMethodSelect()).toBeInTheDocument();
    });

    it('should show Card-only select when Delivery is selected', async () => {
      await render(PizzaOrder);

      await userEvent.selectOptions(getOrderTypeSelect(), 'delivery');

      // select は Card のみ（effect により自動設定）
      const paymentSelect = getPaymentMethodSelect();
      expect(paymentSelect).toHaveValue('card');
      expect(paymentSelect.options).toHaveLength(1);
    });

    it('should allow cash payment when To go is selected', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await userEvent.selectOptions(getPaymentMethodSelect(), 'cash');
      await userEvent.click(getOrderButton());

      // 成功メッセージ
      const successMessage = screen.getByText(/thank you for your order/i);
      expect(successMessage.parentElement?.textContent).toContain('To go');
    });
  });

  describe('Full form submission', () => {
    it('should submit successfully with Delivery + Address', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await userEvent.selectOptions(getOrderTypeSelect(), 'delivery');
      await userEvent.type(screen.getByPlaceholderText('Delivery address'), '123 Main St');
      // paymentMethod は自動で card に設定される
      await userEvent.click(getOrderButton());

      const successMessage = screen.getByText(/thank you for your order/i);
      expect(successMessage.parentElement?.textContent).toContain('Delivery');
    });
  });
});
