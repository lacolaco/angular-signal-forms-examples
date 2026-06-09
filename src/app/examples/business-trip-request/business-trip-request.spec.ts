import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BusinessTripRequest } from './business-trip-request';

describe('BusinessTripRequest', () => {
  const getDepartureInput = () => screen.getByLabelText(/departure date/i) as HTMLInputElement;
  const getReturnInput = () => screen.getByLabelText(/return date/i) as HTMLInputElement;
  const getPurposeInput = () => screen.getByLabelText(/purpose/i) as HTMLInputElement;
  const getBudgetInput = () => screen.getByLabelText(/budget/i) as HTMLInputElement;
  const getSubmitButton = () => screen.getByRole('button', { name: /submit request/i });

  describe('factory パターン: dateAtLeast(today) を 2 field で再利用', () => {
    it('出発日に過去日を入れるとエラーが表示される', async () => {
      await render(BusinessTripRequest);

      await userEvent.type(getDepartureInput(), '2020-01-01');
      await userEvent.tab();

      expect(screen.getByText(/出発日は今日以降/)).toBeInTheDocument();
    });

    it('帰着日に過去日を入れるとエラーが表示される (同 factory)', async () => {
      await render(BusinessTripRequest);

      await userEvent.type(getReturnInput(), '2020-01-01');
      await userEvent.tab();

      expect(screen.getByText(/帰着日は今日以降/)).toBeInTheDocument();
    });
  });

  describe('validateTree(): 親パスで cross-field を宣言し fieldTreeOf でターゲット', () => {
    it('出発日 > 帰着日 のとき帰着日に invalidDateRange エラーが付く', async () => {
      await render(BusinessTripRequest);

      await userEvent.type(getDepartureInput(), '2099-12-31');
      await userEvent.type(getReturnInput(), '2099-12-30');
      await userEvent.tab();

      expect(screen.getByText(/帰着日は出発日以降/)).toBeInTheDocument();
    });

    it('期間が 14 日を超えるとき出発日に tripTooLong エラーが付く', async () => {
      await render(BusinessTripRequest);

      await userEvent.type(getDepartureInput(), '2099-01-01');
      await userEvent.type(getReturnInput(), '2099-01-31');
      await userEvent.tab();

      expect(screen.getByText(/14 日以内/)).toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('valid な状態で送信するとスナップショットが表示される', async () => {
      await render(BusinessTripRequest);

      await userEvent.type(getDepartureInput(), '2099-06-01');
      await userEvent.type(getReturnInput(), '2099-06-05');
      await userEvent.type(getPurposeInput(), 'Client meeting in Osaka');
      await userEvent.clear(getBudgetInput());
      await userEvent.type(getBudgetInput(), '50000');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/request submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/2099-06-01/)).toBeInTheDocument();
      expect(screen.getByText(/2099-06-05/)).toBeInTheDocument();
      expect(screen.getByText(/Client meeting in Osaka/)).toBeInTheDocument();
      expect(screen.getByText(/50000/)).toBeInTheDocument();
    });

    it('必須が空のまま送信しても結果は表示されない', async () => {
      await render(BusinessTripRequest);

      await userEvent.click(getSubmitButton());

      expect(screen.queryByText(/request submitted/i)).not.toBeInTheDocument();
    });
  });
});
