import React from 'react';

interface PlatformIconProps {
 channel?: string;
 className?: string;
}

// Simple static mapping - no complex objects
const getIconPath = (channel?: string): string => {
 if (!channel) return '/images/platforms/default.png';

 const lower = channel.toLowerCase();

 if (lower.includes('airbnb')) return '/images/platforms/airbnb.png';
 if (lower.includes('booking')) return '/images/platforms/booking.png';
 if (lower.includes('expedia')) return '/images/platforms/expedia.png';
 if (lower.includes('vrbo')) return '/images/platforms/vrbo.png';
 if (lower.includes('website') || lower.includes('site')) return '/images/platforms/website.png';
 if (lower.includes('direto') || lower.includes('direct')) return '/images/platforms/direct.png';

 return '/images/platforms/default.png';
};

const PlatformIcon: React.FC<PlatformIconProps> = ({ channel, className = "w-5 h-5" }) => {
 const iconPath = getIconPath(channel);

 return (
  <img
   src={'/images/platforms/airbnb.png'}
   alt={channel || 'Platform'}
   title={channel || 'Platform'}
   className={`object-contain rounded ${className}`}
   onError={(e) => {
    e.currentTarget.src = '/images/platforms/default.png';
   }}
  />
 );
};

export default React.memo(PlatformIcon);
