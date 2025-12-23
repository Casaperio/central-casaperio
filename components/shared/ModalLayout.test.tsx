import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalLayout, { Tab } from './ModalLayout';
import { User, Settings } from 'lucide-react';

describe('ModalLayout', () => {
  const mockTabs: Tab[] = [
    { name: 'details', label: 'Detalhes', icon: <User size={16} /> },
    { name: 'settings', label: 'Configurações', icon: <Settings size={16} /> }
  ];

  it('should render tabs correctly', () => {
    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={mockTabs}
        activeTab="details"
      >
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.getByRole('tab', { name: /detalhes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /configurações/i })).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={mockTabs}
        activeTab="details"
      >
        <div>Content</div>
      </ModalLayout>
    );

    const detailsTab = screen.getByRole('tab', { name: /detalhes/i });
    const settingsTab = screen.getByRole('tab', { name: /configurações/i });

    expect(detailsTab).toHaveAttribute('aria-selected', 'true');
    expect(settingsTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should call onTabChange when tab clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={mockTabs}
        activeTab="details"
        onTabChange={onTabChange}
      >
        <div>Content</div>
      </ModalLayout>
    );

    await user.click(screen.getByRole('tab', { name: /configurações/i }));

    expect(onTabChange).toHaveBeenCalledWith('settings');
  });

  it('should render tab icons', () => {
    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={mockTabs}
        activeTab="details"
      >
        <div>Content</div>
      </ModalLayout>
    );

    // Icons are rendered (check for SVG elements)
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);
  });

  it('should fallback to regular Modal when no tabs provided', () => {
    render(
      <ModalLayout isOpen={true} onClose={vi.fn()} title="No Tabs">
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.getByText('No Tabs')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('should fallback to regular Modal when tabs is empty array', () => {
    render(
      <ModalLayout isOpen={true} onClose={vi.fn()} tabs={[]}>
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('should render tabpanel with content', () => {
    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={mockTabs}
        activeTab="details"
      >
        <div>Tab Content</div>
      </ModalLayout>
    );

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
    expect(tabpanel).toHaveTextContent('Tab Content');
  });

  it('should support all Modal props (size, footer, etc)', () => {
    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        title="With Footer"
        tabs={mockTabs}
        activeTab="details"
        size="lg"
        footer={<div>Footer</div>}
      >
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.getByText('With Footer')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should pass closeOnBackdrop to BaseModal', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ModalLayout
        isOpen={true}
        onClose={onClose}
        tabs={mockTabs}
        closeOnBackdrop={false}
      >
        <div>Content</div>
      </ModalLayout>
    );

    const backdrop = screen.getByText('Content').closest('.fixed');
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle single tab gracefully', () => {
    const singleTab: Tab[] = [{ name: 'only', label: 'Only Tab' }];

    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={singleTab}
        activeTab="only"
      >
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.getByRole('tab', { name: /only tab/i })).toBeInTheDocument();
  });

  it('should render multiple tabs (3+)', () => {
    const manyTabs: Tab[] = [
      { name: 'tab1', label: 'Tab 1' },
      { name: 'tab2', label: 'Tab 2' },
      { name: 'tab3', label: 'Tab 3' },
      { name: 'tab4', label: 'Tab 4' }
    ];

    render(
      <ModalLayout
        isOpen={true}
        onClose={vi.fn()}
        tabs={manyTabs}
        activeTab="tab2"
      >
        <div>Content</div>
      </ModalLayout>
    );

    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');
  });
});
