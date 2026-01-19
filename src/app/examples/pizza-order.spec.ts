import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PizzaOrder } from './pizza-order';

describe('PizzaOrder', () => {
  const user = userEvent.setup();

  const getOrderTypeSelect = () => screen.getByTestId('orderType') as HTMLSelectElement;
  const getPaymentMethodSelect = () => screen.queryByTestId('paymentMethod') as HTMLSelectElement;
  const getOrderButton = () => screen.getByRole('button', { name: /order/i });

  const fillRequiredFields = async () => {
    await user.type(screen.getByPlaceholderText('お名前'), '田中太郎');
  };

  describe('Conditional visibility', () => {
    it('should hide delivery address when To go is selected', async () => {
      await render(PizzaOrder);

      // デフォルトは To go
      expect(getOrderTypeSelect()).toHaveValue('togo');
      expect(screen.queryByPlaceholderText('配達先住所')).not.toBeInTheDocument();
    });

    it('should show delivery address when Delivery is selected', async () => {
      await render(PizzaOrder);

      await user.selectOptions(getOrderTypeSelect(), 'delivery');

      expect(screen.getByPlaceholderText('配達先住所')).toBeInTheDocument();
    });
  });

  describe('Conditional validation', () => {
    it('should require delivery address when Delivery is selected', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await user.selectOptions(getOrderTypeSelect(), 'delivery');
      // paymentMethod は自動で card に設定される
      await user.click(getOrderButton());

      // 住所未入力でエラー
      expect(screen.getByText('配達先住所を入力してください')).toBeInTheDocument();
    });

    it('should allow submission when To go + no address', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      // To go のまま（デフォルト）
      expect(getOrderTypeSelect()).toHaveValue('togo');
      await user.selectOptions(getPaymentMethodSelect(), 'card');
      await user.click(getOrderButton());

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

      await user.selectOptions(getOrderTypeSelect(), 'delivery');

      // select は Card のみ（effect により自動設定）
      const paymentSelect = getPaymentMethodSelect();
      expect(paymentSelect).toHaveValue('card');
      expect(paymentSelect.options).toHaveLength(1);
    });

    it('should allow cash payment when To go is selected', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await user.selectOptions(getPaymentMethodSelect(), 'cash');
      await user.click(getOrderButton());

      // 成功メッセージ
      const successMessage = screen.getByText(/thank you for your order/i);
      expect(successMessage.parentElement?.textContent).toContain('To go');
    });
  });

  describe('Full form submission', () => {
    it('should submit successfully with Delivery + Address', async () => {
      await render(PizzaOrder);

      await fillRequiredFields();
      await user.selectOptions(getOrderTypeSelect(), 'delivery');
      await user.type(screen.getByPlaceholderText('配達先住所'), '東京都渋谷区1-2-3');
      // paymentMethod は自動で card に設定される
      await user.click(getOrderButton());

      const successMessage = screen.getByText(/thank you for your order/i);
      expect(successMessage.parentElement?.textContent).toContain('Delivery');
    });
  });
});
