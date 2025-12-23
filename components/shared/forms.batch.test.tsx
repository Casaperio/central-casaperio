import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';
import FormCheckbox from './FormCheckbox';
import { Mail } from 'lucide-react';

describe('Form Components', () => {
  describe('FormInput', () => {
    it('should render with label', () => {
      render(<FormInput label="Name" value="" onChange={vi.fn()} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should call onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormInput label="Email" value="" onChange={onChange} />);

      await user.type(screen.getByRole('textbox'), 'test@example.com');

      expect(onChange).toHaveBeenCalled();
    });

    it('should show required asterisk', () => {
      render(<FormInput label="Required Field" value="" onChange={vi.fn()} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<FormInput label="Field" value="" onChange={vi.fn()} error="Field is required" />);
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(<FormInput label="Email" value="" onChange={vi.fn()} icon={<Mail size={16} />} />);
      // Icon rendered as SVG
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

  });

  describe('FormSelect', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ];

    it('should render options', () => {
      render(
        <FormSelect label="Select" value="" onChange={vi.fn()} options={options} />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should call onChange when selecting', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <FormSelect label="Select" value="" onChange={onChange} options={options} />
      );

      await user.selectOptions(screen.getByRole('combobox'), '1');

      expect(onChange).toHaveBeenCalledWith('1');
    });

    it('should show placeholder', () => {
      render(
        <FormSelect
          label="Select"
          value=""
          onChange={vi.fn()}
          options={options}
          placeholder="Choose one"
        />
      );

      expect(screen.getByText('Choose one')).toBeInTheDocument();
    });

    it('should show required asterisk', () => {
      render(
        <FormSelect label="Required" value="" onChange={vi.fn()} options={options} required />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('FormTextarea', () => {
    it('should call onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormTextarea label="Notes" value="" onChange={onChange} />);

      await user.type(screen.getByRole('textbox'), 'Test note');

      expect(onChange).toHaveBeenCalled();
    });

    it('should show character counter', () => {
      render(
        <FormTextarea
          label="Comment"
          value="Hello"
          onChange={vi.fn()}
          maxLength={100}
          showCounter
        />
      );

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('should respect maxLength', () => {
      render(
        <FormTextarea label="Limited" value="" onChange={vi.fn()} maxLength={50} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '50');
    });

    it('should show error message', () => {
      render(
        <FormTextarea label="Field" value="" onChange={vi.fn()} error="Too short" />
      );

      expect(screen.getByText('Too short')).toBeInTheDocument();
    });
  });

  describe('FormCheckbox', () => {
    it('should render checkbox with label', () => {
      render(<FormCheckbox label="Accept terms" checked={false} onChange={vi.fn()} />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('should call onChange when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormCheckbox label="Agree" checked={false} onChange={onChange} />);

      await user.click(screen.getByRole('checkbox'));

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should show checked state', () => {
      render(<FormCheckbox label="Checked" checked={true} onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should show unchecked state', () => {
      render(<FormCheckbox label="Unchecked" checked={false} onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should render description', () => {
      render(
        <FormCheckbox
          label="Newsletter"
          checked={false}
          onChange={vi.fn()}
          description="Receive weekly updates"
        />
      );

      expect(screen.getByText('Receive weekly updates')).toBeInTheDocument();
    });
  });
});
