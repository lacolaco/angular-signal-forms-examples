import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HotelSearch } from './hotel-search';

describe('HotelSearch', () => {
  const getCheckInInput = () => screen.getByLabelText(/check-in date/i) as HTMLInputElement;
  const getCheckOutInput = () => screen.getByLabelText(/check-out date/i) as HTMLInputElement;
  const getGuestsInput = () => screen.getByLabelText(/guests/i) as HTMLInputElement;
  const getSubmitButton = () => screen.getByRole('button', { name: /search hotels/i });

  describe('factory パターン: dateAtLeast(today) を 2 field で再利用', () => {
    it('チェックイン日に過去日を入れるとエラーが表示される', async () => {
      await render(HotelSearch);

      await userEvent.type(getCheckInInput(), '2020-01-01');
      await userEvent.tab();

      expect(screen.getByText(/チェックイン日は今日以降/)).toBeInTheDocument();
    });

    it('チェックアウト日に過去日を入れるとエラーが表示される (同 factory)', async () => {
      await render(HotelSearch);

      await userEvent.type(getCheckOutInput(), '2020-01-01');
      await userEvent.tab();

      expect(screen.getByText(/チェックアウト日は今日以降/)).toBeInTheDocument();
    });
  });

  describe('validateTree(): 親パスで cross-field を宣言し fieldTreeOf でターゲット', () => {
    it('チェックイン日 >= チェックアウト日 のときチェックアウト日に invalidDateRange エラーが付く', async () => {
      await render(HotelSearch);

      await userEvent.type(getCheckInInput(), '2099-12-31');
      await userEvent.type(getCheckOutInput(), '2099-12-30');
      await userEvent.tab();

      expect(screen.getByText(/チェックアウト日はチェックイン日より後/)).toBeInTheDocument();
    });

    it('連続 30 泊を超えるときチェックイン日に stayTooLong エラーが付く', async () => {
      await render(HotelSearch);

      await userEvent.type(getCheckInInput(), '2099-01-01');
      await userEvent.type(getCheckOutInput(), '2099-02-15');
      await userEvent.tab();

      expect(screen.getByText(/連続予約は 30 泊まで/)).toBeInTheDocument();
    });
  });

  describe('Submit', () => {
    it('valid な状態で送信するとスナップショットが表示される', async () => {
      await render(HotelSearch);

      await userEvent.type(getCheckInInput(), '2099-06-01');
      await userEvent.type(getCheckOutInput(), '2099-06-05');
      await userEvent.clear(getGuestsInput());
      await userEvent.type(getGuestsInput(), '2');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/search submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/2099-06-01/)).toBeInTheDocument();
      expect(screen.getByText(/2099-06-05/)).toBeInTheDocument();
      expect(screen.getByText(/Guests: 2/)).toBeInTheDocument();
    });

    it('必須が空のまま送信しても結果は表示されない', async () => {
      await render(HotelSearch);

      await userEvent.click(getSubmitButton());

      expect(screen.queryByText(/search submitted/i)).not.toBeInTheDocument();
    });
  });
});
