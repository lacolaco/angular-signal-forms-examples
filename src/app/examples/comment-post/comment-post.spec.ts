import { provideHttpClient } from '@angular/common/http';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CommentPost } from './comment-post';

describe('CommentPost', () => {
  const renderComponent = () =>
    render(CommentPost, {
      providers: [provideHttpClient()],
    });

  const getNicknameInput = () => screen.getByLabelText(/ニックネーム/i) as HTMLInputElement;
  const getCommentInput = () => screen.getByLabelText(/コメント/i) as HTMLTextAreaElement;
  const getSubmitButton = () => screen.getByRole('button', { name: /投稿する|投稿中/i });

  describe('Initial state', () => {
    it('should render the form', async () => {
      await renderComponent();

      expect(await screen.findByRole('heading', { name: /comment post/i })).toBeInTheDocument();
      expect(getNicknameInput()).toBeInTheDocument();
      expect(getCommentInput()).toBeInTheDocument();
      expect(getSubmitButton()).toBeInTheDocument();
    });

    it('should have empty inputs initially', async () => {
      await renderComponent();

      expect(getNicknameInput()).toHaveValue('');
      expect(getCommentInput()).toHaveValue('');
    });

    it('should have enabled submit button initially', async () => {
      await renderComponent();

      expect(getSubmitButton()).not.toBeDisabled();
      expect(getSubmitButton()).toHaveTextContent('投稿する');
    });
  });

  describe('Validation', () => {
    it('should show error when nickname is empty', async () => {
      await renderComponent();

      await userEvent.type(getCommentInput(), 'テストコメント');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/ニックネームは必須です/)).toBeInTheDocument();
    });

    it('should show error when comment is empty', async () => {
      await renderComponent();

      await userEvent.type(getNicknameInput(), 'テストユーザー');
      await userEvent.click(getSubmitButton());

      expect(screen.getByText(/コメントは必須です/)).toBeInTheDocument();
    });
  });

  describe('Submitting state', () => {
    it('should show submitting state during async submission', async () => {
      await renderComponent();

      await userEvent.type(getNicknameInput(), 'テストユーザー');
      await userEvent.type(getCommentInput(), 'テストコメント');
      await userEvent.click(getSubmitButton());

      await waitFor(() => {
        expect(getSubmitButton()).toBeDisabled();
        expect(getSubmitButton()).toHaveTextContent('投稿中...');
      });

      await waitFor(
        () => {
          expect(screen.getByText(/コメントが投稿されました/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should restore button and show submitted values after completion', async () => {
      await renderComponent();

      await userEvent.type(getNicknameInput(), 'テストユーザー');
      await userEvent.type(getCommentInput(), 'テストコメント');
      await userEvent.click(getSubmitButton());

      await waitFor(
        () => {
          expect(screen.getByText(/コメントが投稿されました/)).toBeInTheDocument();
          expect(screen.getByText(/テストユーザー: テストコメント/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(getSubmitButton()).not.toBeDisabled();
      expect(getSubmitButton()).toHaveTextContent('投稿する');
    });
  });
});
