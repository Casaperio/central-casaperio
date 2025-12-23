/**
 * MarqueeText
 * Componente de texto que rola horizontalmente quando excede o container
 * Baseado no stays-observator/src/components/ui/MarqueeText.tsx
 */

import { useRef, useState, useEffect, ReactNode } from 'react';

interface MarqueeTextProps {
 children?: ReactNode;
 className?: string;
 speed?: number; // Duração da animação em segundos
}

export default function MarqueeText({
 children,
 className = '',
 speed = 8
}: MarqueeTextProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const contentRef = useRef<HTMLDivElement>(null);
 const [shouldScroll, setShouldScroll] = useState(false);

 useEffect(() => {
  const checkOverflow = () => {
   if (containerRef.current && contentRef.current) {
    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = contentRef.current.scrollWidth;
    setShouldScroll(contentWidth > containerWidth);
   }
  };

  // Check on mount
  checkOverflow();

  // Check on resize
  window.addEventListener('resize', checkOverflow);

  // Observe size changes
  const resizeObserver = new ResizeObserver(checkOverflow);
  if (containerRef.current) {
   resizeObserver.observe(containerRef.current);
  }

  return () => {
   window.removeEventListener('resize', checkOverflow);
   resizeObserver.disconnect();
  };
 }, [children]);

 return (
  <div
   ref={containerRef}
   className={`overflow-hidden ${className}`}
  >
   <div
    ref={contentRef}
    className={`flex items-center whitespace-nowrap ${shouldScroll ? 'animate-marquee' : ''}`}
    style={shouldScroll ? { animationDuration: `${speed}s` } : undefined}
   >
    {children}
   </div>
  </div>
 );
}