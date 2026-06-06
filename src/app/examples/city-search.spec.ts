import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestKey } from '@angular/cdk/testing';
import { ComboboxHarness } from '@angular/aria/combobox/testing';
import { CitySearch } from './city-search';

describe('CitySearch', () => {
  const getSearchInput = () => screen.getByLabelText(/city/i) as HTMLInputElement;
  const getSubmitButton = () => screen.getByRole('button', { name: /search/i });

  const renderComponent = () =>
    render(CitySearch, {
      providers: [provideHttpClient(withFetch())],
    });

  describe('Initial state', () => {
    it('should render the form', async () => {
      await renderComponent();

      expect(screen.getByRole('heading', { name: /city search/i })).toBeInTheDocument();
      expect(getSearchInput()).toBeInTheDocument();
      expect(getSubmitButton()).toBeInTheDocument();
    });

    it('should not show suggestions initially', async () => {
      await renderComponent();

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Autocomplete suggestions', () => {
    it('should not show suggestions for single character input', async () => {
      await renderComponent();

      await userEvent.type(getSearchInput(), 'T');

      // 2文字未満はAPIが空配列を返す
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should show suggestions when typing 2+ characters', async () => {
      await renderComponent();

      const input = getSearchInput();
      await userEvent.click(input); // focus
      await userEvent.type(input, 'To');

      await waitFor(
        () => {
          expect(screen.getByRole('listbox')).toBeInTheDocument();
          expect(screen.getByRole('option', { name: /Tokyo/i })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: /Toronto/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('should filter suggestions based on input', async () => {
      await renderComponent();

      const input = getSearchInput();
      await userEvent.click(input);
      await userEvent.type(input, 'Pa');

      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: /Paris/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      expect(screen.queryByRole('option', { name: /Tokyo/i })).not.toBeInTheDocument();
    });

    it('should select a suggestion and fill the input', async () => {
      await renderComponent();

      const input = getSearchInput();
      await userEvent.click(input);
      await userEvent.type(input, 'To');

      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: /Tokyo/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await userEvent.click(screen.getByRole('option', { name: /Tokyo/i }));

      expect(getSearchInput()).toHaveValue('Tokyo');
      // 選択後は候補リストが非表示
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    // userEvent.keyboard 経由の Enter/ArrowDown は、@angular/aria v22 の
    // keyboardEventRelay (afterRenderEffect 内で同期 dispatchEvent) と
    // @testing-library の safeDetectChanges が衝突して NG0101 を発生させる。
    // 公式の ComboboxHarness は CDK の TestbedHarnessEnvironment 経由で
    // sendKeys するためそのラッパーを通らず、CD 衝突を回避できる。
    // v22 では popup 展開時に listbox の先頭 option が自動 active になるため、
    // Enter のみで先頭が選択される。
    it('should select the first suggestion with Enter', async () => {
      const { fixture } = await renderComponent();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const combobox = await loader.getHarness(ComboboxHarness);

      await combobox.setValue('To');
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: /Tokyo/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const host = await combobox.host();
      await host.sendKeys(TestKey.ENTER);

      await waitFor(() => {
        expect(getSearchInput()).toHaveValue('Tokyo');
      });
    });

    it('should navigate between suggestions with Arrow keys', async () => {
      const { fixture } = await renderComponent();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const combobox = await loader.getHarness(ComboboxHarness);

      await combobox.setValue('To');
      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: /Tokyo/i })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: /Toronto/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const host = await combobox.host();
      // 先頭 Tokyo が auto active。Arrow Down 1 回で Toronto に進める。
      // 複数キーを 1 度に渡すと keyboardEventRelay signal が同一 tick で
      // 上書きされ、最後の 1 個しか listbox に届かないので、1 key ずつ送る。
      await host.sendKeys(TestKey.DOWN_ARROW);
      await host.sendKeys(TestKey.ENTER);

      await waitFor(() => {
        expect(getSearchInput()).toHaveValue('Toronto');
      });
    });

    it('should close suggestions with Escape', async () => {
      await renderComponent();

      const input = getSearchInput();
      await userEvent.click(input);
      await userEvent.type(input, 'To');

      await waitFor(
        () => {
          expect(screen.getByRole('listbox')).toBeInTheDocument();
          expect(input).toHaveAttribute('aria-expanded', 'true');
        },
        { timeout: 2000 },
      );

      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Form submission', () => {
    it('should not submit when input is empty', async () => {
      await renderComponent();

      await userEvent.click(getSubmitButton());

      expect(screen.queryByText(/you selected/i)).not.toBeInTheDocument();
    });

    it('should submit with selected city', async () => {
      await renderComponent();

      const input = getSearchInput();
      await userEvent.click(input);
      await userEvent.type(input, 'To');

      await waitFor(
        () => {
          expect(screen.getByRole('option', { name: /Tokyo/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await userEvent.click(screen.getByRole('option', { name: /Tokyo/i }));
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/You selected: Tokyo/)).toBeInTheDocument();
    });
  });
});
