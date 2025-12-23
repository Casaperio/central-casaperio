import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import PlatformIcon from '../../components/PlatformIcon';
import MarqueeText from '../../components/MarqueeText';
import LogsPanel from '../../components/LogsPanel';
import SkeletonLoading from '../../components/SkeletonLoading';
import GuestCMS from '../../components/GuestCMS';
import CalendarView from '../../components/CalendarView';
import ProfilePanel from '../../components/ProfilePanel';
import LandingPage from '../../components/LandingPage';
import { createMockUser } from '../fixtures/users';

describe('Simple Components - Batch Render Tests', () => {
  describe('PlatformIcon', () => {
    it('should render Airbnb icon', () => {
      const { container } = renderWithProviders(<PlatformIcon platform="Airbnb" />);
      expect(container).toBeTruthy();
    });

    it('should render Booking.com icon', () => {
      const { container } = renderWithProviders(<PlatformIcon platform="Booking.com" />);
      expect(container).toBeTruthy();
    });

    it('should render Direto icon', () => {
      const { container } = renderWithProviders(<PlatformIcon platform="Direto" />);
      expect(container).toBeTruthy();
    });

    it('should render unknown platform', () => {
      const { container } = renderWithProviders(<PlatformIcon platform="Unknown" />);
      expect(container).toBeTruthy();
    });
  });

  describe('MarqueeText', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<MarqueeText text="Test Message" speed={50} />);
      expect(container).toBeTruthy();
    });

    it('should render with custom speed', () => {
      const { container } = renderWithProviders(<MarqueeText text="Fast" speed={10} />);
      expect(container).toBeTruthy();
    });

    it('should render empty text', () => {
      const { container } = renderWithProviders(<MarqueeText text="" speed={50} />);
      expect(container).toBeTruthy();
    });
  });

  describe('LogsPanel', () => {
    it('should render without logs', () => {
      const { container } = renderWithProviders(<LogsPanel logs={[]} />);
      expect(container).toBeTruthy();
    });

    it('should render with logs', () => {
      const logs = [
        {
          id: 'log-1',
          action: 'CREATE' as const,
          entityType: 'ticket',
          entityId: 'ticket-1',
          userId: 'user-1',
          userName: 'Test User',
          timestamp: Date.now(),
          details: 'Created ticket'
        }
      ];

      const { container } = renderWithProviders(<LogsPanel logs={logs} />);
      expect(container).toBeTruthy();
    });
  });


  describe('CalendarView', () => {
    it('should render without events', () => {
      const { container } = renderWithProviders(
        <CalendarView
          mode="month"
          tickets={[]}
          reservations={[]}
          currentDate={new Date('2025-12-20')}
          onDateChange={() => {}}
          onItemClick={() => {}}
        />
      );
      expect(container).toBeTruthy();
    });

    it('should render with reservations', () => {
      const reservations = [{
        id: 'res-1',
        guestName: 'Test',
        checkInDate: '2025-12-20',
        checkOutDate: '2025-12-22',
        propertyCode: '501A'
      }];

      const { container } = renderWithProviders(
        <CalendarView
          mode="month"
          tickets={[]}
          reservations={reservations as any}
          currentDate={new Date('2025-12-20')}
          onDateChange={() => {}}
          onItemClick={() => {}}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('ProfilePanel', () => {
    it('should render user profile', () => {
      const user = createMockUser();

      const { container } = renderWithProviders(
        <ProfilePanel
          user={user}
          onUpdate={() => {}}
          onChangePassword={() => {}}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('LandingPage', () => {
    it('should render without crashing', () => {
      const user = createMockUser();

      const { container } = renderWithProviders(
        <LandingPage user={user} onSelectModule={() => {}} />
      );

      expect(container).toBeTruthy();
    });
  });
});
