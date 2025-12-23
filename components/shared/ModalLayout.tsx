import React, { ReactNode } from 'react';
import Modal from './Modal';

export interface Tab {
  name: string;
  label: string;
  icon?: ReactNode;
}

interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export default function ModalLayout({
  isOpen,
  onClose,
  title,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  size,
  showCloseButton,
  closeOnBackdrop,
  closeOnEscape
}: ModalLayoutProps) {
  // If no tabs provided, just use regular Modal
  if (!tabs || tabs.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footer={footer}
        size={size}
        showCloseButton={showCloseButton}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
      >
        {children}
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size={size}
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
    >
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 -mt-6 pt-6">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => onTabChange?.(tab.name)}
            className={`
              flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors
              border-b-2 -mb-px
              ${
                activeTab === tab.name
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.name}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {children}
      </div>
    </Modal>
  );
}
