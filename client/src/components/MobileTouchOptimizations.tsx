import { useEffect } from "react";

export default function MobileTouchOptimizations() {
  useEffect(() => {
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Add touch event listeners
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    // Improve touch responsiveness
    const addTouchClass = () => document.body.classList.add('touch-device');
    const removeTouchClass = () => document.body.classList.remove('touch-device');

    window.addEventListener('touchstart', addTouchClass, { passive: true });
    window.addEventListener('mouseover', removeTouchClass, { passive: true });

    // Handle safe area insets for devices with notches
    const updateSafeAreas = () => {
      const root = document.documentElement;
      const safeAreaTop = getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0px';
      const safeAreaBottom = getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0px';
      
      root.style.setProperty('--safe-area-top', safeAreaTop);
      root.style.setProperty('--safe-area-bottom', safeAreaBottom);
    };

    updateSafeAreas();
    window.addEventListener('orientationchange', updateSafeAreas);

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      window.removeEventListener('touchstart', addTouchClass);
      window.removeEventListener('mouseover', removeTouchClass);
      window.removeEventListener('orientationchange', updateSafeAreas);
    };
  });

  return null;
}