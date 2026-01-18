import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal, twoWayBinding } from '@angular/core';
import { StarRating, BookReview } from './book-review';

describe('StarRating', () => {
  it('should render 5 star buttons', async () => {
    await render(StarRating);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(5);
  });

  it('should reflect initial value from binding', async () => {
    const rating = signal(3);
    await render(StarRating, {
      bindings: [twoWayBinding('value', rating)],
    });

    const buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[1]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[2]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[3]).toHaveAttribute('aria-checked', 'false');
    expect(buttons[4]).toHaveAttribute('aria-checked', 'false');
  });

  it('should sync value bidirectionally', async () => {
    const rating = signal(0);
    const { fixture } = await render(StarRating, {
      bindings: [twoWayBinding('value', rating)],
    });
    const buttons = screen.getAllByRole('radio');

    // UI -> Model
    await userEvent.click(buttons[2]); // 3rd star
    expect(rating()).toBe(3);

    // Model -> UI
    rating.set(5);
    fixture.detectChanges();
    expect(buttons[4]).toHaveAttribute('aria-checked', 'true');
  });

  it('should increase rating with ArrowRight key', async () => {
    await render(StarRating);
    const buttons = screen.getAllByRole('radio');

    await userEvent.click(buttons[1]); // Select 2 stars
    fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });

    expect(buttons[2]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[3]).toHaveAttribute('aria-checked', 'false');
  });

  it('should decrease rating with ArrowLeft key', async () => {
    await render(StarRating);
    const buttons = screen.getAllByRole('radio');

    await userEvent.click(buttons[2]); // Select 3 stars
    fireEvent.keyDown(buttons[2], { key: 'ArrowLeft' });

    expect(buttons[1]).toHaveAttribute('aria-checked', 'true');
    expect(buttons[2]).toHaveAttribute('aria-checked', 'false');
  });
});

describe('BookReview', () => {
  it('should render the form', async () => {
    await render(BookReview);

    expect(screen.getByRole('heading', { name: /book review/i })).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    await render(BookReview);

    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(screen.getByText(/please select a rating/i)).toBeInTheDocument();
    expect(screen.getByText(/comment is required/i)).toBeInTheDocument();
  });

  it('should submit successfully with valid input', async () => {
    await render(BookReview);
    const stars = screen.getAllByRole('radio');
    const textarea = screen.getByRole('textbox');

    await userEvent.click(stars[4]); // 5 stars
    await userEvent.type(textarea, 'Great book!');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(screen.getByText(/thank you for your review/i)).toBeInTheDocument();
    expect(screen.getByText(/rating: 5 stars/i)).toBeInTheDocument();
  });

  it('should preserve submitted rating even after changing it', async () => {
    await render(BookReview);
    const stars = screen.getAllByRole('radio');
    const textarea = screen.getByRole('textbox');

    await userEvent.click(stars[4]); // 5 stars
    await userEvent.type(textarea, 'Great book!');
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(screen.getByText(/rating: 5 stars/i)).toBeInTheDocument();

    // Change rating after submit
    await userEvent.click(stars[0]); // 1 star

    // Submitted message should still show 5 stars
    expect(screen.getByText(/rating: 5 stars/i)).toBeInTheDocument();
  });

  it('should show character count for comment', async () => {
    await render(BookReview);
    const textarea = screen.getByRole('textbox');

    expect(screen.getByText('0 / 500')).toBeInTheDocument();

    await userEvent.type(textarea, 'Hello');

    expect(screen.getByText('5 / 500')).toBeInTheDocument();
  });
});
