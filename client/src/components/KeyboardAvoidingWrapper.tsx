import React, { useEffect, useState, useRef } from 'react';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  offset?: number;
}

const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps> = ({ 
  children, 
  offset = 20 
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) { // Threshold for keyboard detection
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Scroll the focused element into view with offset
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300); // Delay to account for keyboard animation
      }
    };

    const handleResize = () => {
      // Update initial height on window resize
      if (!isKeyboardOpen) {
        initialViewportHeight = window.visualViewport?.height || window.innerHeight;
      }
    };

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }
    
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isKeyboardOpen]);

  return (
    <div
      ref={wrapperRef}
      className={`keyboard-avoiding ${isKeyboardOpen ? 'keyboard-open' : ''}`}
      style={{
        transform: isKeyboardOpen 
          ? `translateY(-${Math.min(keyboardHeight / 2, offset)}px)` 
          : 'translateY(0)',
        transition: 'transform 0.3s ease',
        minHeight: '100vh',
        paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : '0'
      }}
    >
      {children}
    </div>
  );
};

export default KeyboardAvoidingWrapper;