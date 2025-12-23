import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import BoardList from '../../components/BoardList';

describe('Large Components - Batch Tests', () => {
  describe('BoardList', () => {
    it('should render board list', () => {
      const { container } = renderWithProviders(
        <BoardList
          boards={[]}
          onAddBoard={vi.fn()}
          onSelectBoard={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });
  });
});
