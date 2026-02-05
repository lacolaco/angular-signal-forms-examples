import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LocationSelect } from './location-select';

describe('LocationSelect', () => {
  const getRegionSelect = () => screen.getByLabelText(/region/i) as HTMLSelectElement;
  const getCountrySelect = () => screen.getByLabelText(/country/i) as HTMLSelectElement;
  const getCitySelect = () => screen.getByLabelText(/city/i) as HTMLSelectElement;
  const getSubmitButton = () => screen.getByRole('button', { name: /submit/i });

  describe('Initial state', () => {
    it('should render the form with three selects', async () => {
      await render(LocationSelect);

      expect(screen.getByRole('heading', { name: /location select/i })).toBeInTheDocument();
      expect(getRegionSelect()).toBeInTheDocument();
      expect(getCountrySelect()).toBeInTheDocument();
      expect(getCitySelect()).toBeInTheDocument();
    });

    it('should have region options available', async () => {
      await render(LocationSelect);

      const regionSelect = getRegionSelect();
      expect(regionSelect.options.length).toBeGreaterThan(1); // placeholder + options
    });

    it('should have empty country options when no region selected', async () => {
      await render(LocationSelect);

      const countrySelect = getCountrySelect();
      // placeholder のみ
      expect(countrySelect.options.length).toBe(1);
    });

    it('should have empty city options when no country selected', async () => {
      await render(LocationSelect);

      const citySelect = getCitySelect();
      // placeholder のみ
      expect(citySelect.options.length).toBe(1);
    });
  });

  describe('Cascade selection', () => {
    it('should show country options when region is selected', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');

      const countrySelect = getCountrySelect();
      expect(countrySelect.options.length).toBeGreaterThan(1);
    });

    it('should show city options when country is selected', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.selectOptions(getCountrySelect(), 'japan');

      const citySelect = getCitySelect();
      expect(citySelect.options.length).toBeGreaterThan(1);
    });

    it('should reset country and city when region changes', async () => {
      const { fixture } = await render(LocationSelect);

      // Asia → Japan → Tokyo を選択
      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.selectOptions(getCountrySelect(), 'japan');
      await userEvent.selectOptions(getCitySelect(), 'tokyo');
      fixture.detectChanges();

      // Region を Europe に変更
      await userEvent.selectOptions(getRegionSelect(), 'europe');
      fixture.detectChanges();

      // Country と City がリセットされる
      expect(getCountrySelect().value).toBe('');
      expect(getCitySelect().value).toBe('');
    });

    it('should reset city when country changes', async () => {
      const { fixture } = await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.selectOptions(getCountrySelect(), 'japan');
      await userEvent.selectOptions(getCitySelect(), 'tokyo');
      fixture.detectChanges();

      // Country を Korea に変更
      await userEvent.selectOptions(getCountrySelect(), 'korea');
      fixture.detectChanges();

      // City がリセットされる
      expect(getCitySelect().value).toBe('');
    });
  });

  describe('Form submission', () => {
    it('should not submit when form is incomplete', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.click(getSubmitButton());

      expect(screen.queryByText(/selected location/i)).not.toBeInTheDocument();
    });

    it('should submit successfully when all fields are selected', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.selectOptions(getCountrySelect(), 'japan');
      await userEvent.selectOptions(getCitySelect(), 'tokyo');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/selected location/i)).toBeInTheDocument();
      // 結果表示には "Asia / Japan / Tokyo" の形式で表示される
      expect(screen.getByText(/Asia \/ Japan \/ Tokyo/)).toBeInTheDocument();
    });
  });

  describe('Focus control', () => {
    it('should focus country select when region is valid but country is empty', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.click(getSubmitButton());

      expect(document.activeElement).toBe(getCountrySelect());
    });

    it('should focus city select when country is valid but city is empty', async () => {
      await render(LocationSelect);

      await userEvent.selectOptions(getRegionSelect(), 'asia');
      await userEvent.selectOptions(getCountrySelect(), 'japan');
      await userEvent.click(getSubmitButton());

      expect(document.activeElement).toBe(getCitySelect());
    });
  });
});
