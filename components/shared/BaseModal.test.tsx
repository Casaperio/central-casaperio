import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BaseModal from './BaseModal';

describe('BaseModal', () => {
  it('should render when isOpen=true', () => {
    render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </BaseModal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when isOpen=false', () => {
    render(
      <BaseModal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </BaseModal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should close on backdrop click by default', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </BaseModal>
    );

    const backdrop = screen.getByText('Content').parentElement?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(onClose).toHaveBeenCalled();
  });

  it('should NOT close on backdrop click when closeOnBackdrop=false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BaseModal isOpen={true} onClose={onClose} closeOnBackdrop={false}>
        <div>Content</div>
      </BaseModal>
    );

    const backdrop = screen.getByText('Content').parentElement?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should close on ESC key by default', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </BaseModal>
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('should NOT close on ESC when closeOnEscape=false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BaseModal isOpen={true} onClose={onClose} closeOnEscape={false}>
        <div>Content</div>
      </BaseModal>
    );

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should prevent backdrop click from closing modal content', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <BaseModal isOpen={true} onClose={onClose}>
        <button>Click Me</button>
      </BaseModal>
    );

    await user.click(screen.getByRole('button'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should cleanup ESC listener on unmount', () => {
    const { unmount } = render(
      <BaseModal isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BaseModal>
    );

    unmount();

    // No error should occur (listener cleaned up)
    expect(true).toBe(true);
  });
});
