import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { signal, twoWayBinding } from '@angular/core';
import { ImageUploadInput, AvatarUpload } from './avatar-upload';

/**
 * テスト用のファイルを作成するヘルパー
 */
function createFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe('ImageUploadInput', () => {
  it('should render drop zone with placeholder', async () => {
    await render(ImageUploadInput);

    expect(screen.getByText(/click to select/i)).toBeInTheDocument();
  });

  it('should update value when file is selected', async () => {
    const value = signal<File | null>(null);
    await render(ImageUploadInput, {
      bindings: [twoWayBinding('value', value)],
    });

    const file = createFile('avatar.png', 1024, 'image/png');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(value()).not.toBeNull();
    expect(value()!.name).toBe('avatar.png');
  });

  it('should show file name and size after selection', async () => {
    await render(ImageUploadInput);

    const file = createFile('photo.jpg', 1500, 'image/jpeg');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
  });

  it('should sync value from external signal', async () => {
    const value = signal<File | null>(null);
    const { fixture } = await render(ImageUploadInput, {
      bindings: [twoWayBinding('value', value)],
    });

    // 初期状態: プレースホルダー
    expect(screen.getByText(/click to select/i)).toBeInTheDocument();

    // 外部からファイルセット
    value.set(createFile('external.png', 500, 'image/png'));
    fixture.detectChanges();

    expect(screen.getByText(/external\.png/)).toBeInTheDocument();
  });
});

describe('AvatarUpload', () => {
  it('should render the form', async () => {
    await render(AvatarUpload);

    expect(screen.getByRole('heading', { name: /avatar upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('should show required error when submitting without file', async () => {
    await render(AvatarUpload);

    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/please select an image/i)).toBeInTheDocument();
  });

  it('should show file type error for non-image file', async () => {
    const { fixture } = await render(AvatarUpload);

    // accept="image/*" をバイパスして非画像ファイルを直接セット
    const component = fixture.componentInstance;
    component.avatarModel.update((m) => ({
      ...m,
      avatar: createFile('document.pdf', 1024, 'application/pdf'),
    }));
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
  });

  it('should show file size error for files over 2MB', async () => {
    await render(AvatarUpload);

    const file = createFile('large.png', 3 * 1024 * 1024, 'image/png');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/2mb or less/i)).toBeInTheDocument();
  });

  it('should submit successfully with valid image', async () => {
    await render(AvatarUpload);

    const file = createFile('avatar.png', 1024, 'image/png');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/upload complete.*avatar\.png/i)).toBeInTheDocument();
  });
});
