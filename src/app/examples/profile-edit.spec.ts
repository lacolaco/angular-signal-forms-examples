import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideHttpClient } from '@angular/common/http';
import { ProfileEdit } from './profile-edit';

describe('ProfileEdit', () => {
  const renderComponent = () =>
    render(ProfileEdit, {
      providers: [provideHttpClient()],
    });

  const getUsernameInput = () => screen.getByPlaceholderText(/john_doe123/i);
  const getDisplayNameInput = () => screen.getByPlaceholderText(/john doe/i);
  const getBioInput = () => screen.getByPlaceholderText(/tell us about yourself/i);

  it('should render the form with all fields', async () => {
    await renderComponent();

    expect(screen.getByRole('heading', { name: /profile edit/i })).toBeInTheDocument();
    expect(getUsernameInput()).toBeInTheDocument();
    expect(getDisplayNameInput()).toBeInTheDocument();
    expect(getBioInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  describe('synchronous validation', () => {
    it('should show required error for empty username', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.click(usernameInput);
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for username shorter than 3 characters', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.type(usernameInput, 'ab');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for username with invalid characters', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.type(usernameInput, 'invalid@user!');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/alphanumeric characters and underscores/i)).toBeInTheDocument();
      });
    });

    it('should show required error for empty display name', async () => {
      await renderComponent();

      const displayNameInput = getDisplayNameInput();
      await userEvent.click(displayNameInput);
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('asynchronous validation', () => {
    it('should show pending indicator while checking username', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.type(usernameInput, 'newuser123');

      await waitFor(() => {
        expect(screen.getByText(/checking/i)).toBeInTheDocument();
      });
    });

    it('should show available message for unused username', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.type(usernameInput, 'newuser123');

      await waitFor(
        () => {
          expect(screen.queryByText(/checking/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(screen.getByText(/newuser123 is available/i)).toBeInTheDocument();
      expect(screen.queryByText(/this username is already taken/i)).not.toBeInTheDocument();
    });

    it('should show error for taken username', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      await userEvent.type(usernameInput, 'admin');
      await userEvent.tab(); // Trigger touched state

      await waitFor(
        () => {
          expect(screen.getByText(/this username is already taken/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('form submission', () => {
    it('should submit successfully with valid input', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      const displayNameInput = getDisplayNameInput();
      const bioInput = getBioInput();

      await userEvent.type(usernameInput, 'newuser123');
      await userEvent.type(displayNameInput, 'New User');
      await userEvent.type(bioInput, 'Hello, I am a new user.');

      await waitFor(
        () => {
          expect(screen.queryByText(/checking/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await userEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile saved/i)).toBeInTheDocument();
      });
    });

    it('should not submit when username is taken', async () => {
      await renderComponent();

      const usernameInput = getUsernameInput();
      const displayNameInput = getDisplayNameInput();

      await userEvent.type(usernameInput, 'admin');
      await userEvent.type(displayNameInput, 'Admin User');

      await waitFor(
        () => {
          expect(screen.getByText(/this username is already taken/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await userEvent.click(screen.getByRole('button', { name: /save profile/i }));

      expect(screen.queryByText(/profile saved/i)).not.toBeInTheDocument();
    });
  });
});
