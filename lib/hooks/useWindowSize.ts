'use client';

import { useEffect, useState } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    ...size,
    isMobile:  size.width > 0 && size.width < 768,
    isTablet:  size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
  };
}
