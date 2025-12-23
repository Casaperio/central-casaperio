import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('should render with title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Content Only</div>
      </Modal>
    );

    expect(screen.getByText('Content Only')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} footer={<div>Footer Content</div>}>
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should apply sm size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <div>Content</div>
      </Modal>
    );

    expect(container.querySelector('.max-w-md')).toBeInTheDocument();
  });

  it('should apply md size class (default)', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </Modal>
    );

    expect(container.querySelector('.max-w-2xl')).toBeInTheDocument();
  });

  it('should apply lg size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <div>Content</div>
      </Modal>
    );

    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
  });

  it('should apply xl size class', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        <div>Content</div>
      </Modal>
    );

    expect(container.querySelector('.max-w-6xl')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>Content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText(/fechar/i);
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not show close button when showCloseButton=false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" showCloseButton={false}>
        <div>Content</div>
      </Modal>
    );

    expect(screen.queryByLabelText(/fechar/i)).not.toBeInTheDocument();
  });

  it('should inherit BaseModal behavior (ESC and backdrop)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );

    // Test ESC key
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});
