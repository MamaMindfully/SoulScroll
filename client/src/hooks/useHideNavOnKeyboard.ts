import { useEffect } from "react";

/**
 * Hook to hide bottom navigation when keyboard appears
 * Handles input focus/blur events to manage navigation visibility
 */
export function useHideNavOnKeyboard() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const isInputElement = (element: Element | null): boolean => {
      if (!element) return false;
      const tagName = element.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || 
             element.hasAttribute('contenteditable') ||
             element.getAttribute('contenteditable') === 'true';
    };

    const hideNav = (event: FocusEvent) => {
      const target = event.target as Element;
      
      if (isInputElement(target)) {
        clearTimeout(timeoutId);
        document.body.classList.add('keyboard-active');
        
        // Also hide nav elements directly for immediate response
        const navElements = document.querySelectorAll('.bottom-nav');
        navElements.forEach(nav => {
          if (nav instanceof HTMLElement) {
            nav.style.transform = 'translateY(100%)';
          }
        });
      }
    };

    const showNav = (event: FocusEvent) => {
      const target = event.target as Element;
      
      if (isInputElement(target)) {
        // Delay showing nav to prevent flicker when switching between inputs
        timeoutId = setTimeout(() => {
          // Check if any input is still focused
          const activeElement = document.activeElement;
          if (!isInputElement(activeElement)) {
            document.body.classList.remove('keyboard-active');
            
            // Show nav elements
            const navElements = document.querySelectorAll('.bottom-nav');
            navElements.forEach(nav => {
              if (nav instanceof HTMLElement) {
                nav.style.transform = '';
              }
            });
          }
        }, 150);
      }
    };

    // Additional check for when user taps outside input areas
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!isInputElement(target) && !target.closest('.input-container, .form-field')) {
        clearTimeout(timeoutId);
        document.body.classList.remove('keyboard-active');
        
        const navElements = document.querySelectorAll('.bottom-nav');
        navElements.forEach(nav => {
          if (nav instanceof HTMLElement) {
            nav.style.transform = '';
          }
        });
      }
    };

    // Viewport change detection for keyboard appearance
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        
        if (heightDifference > 150) { // Keyboard threshold
          document.body.classList.add('keyboard-active');
        } else if (heightDifference < 50) {
          document.body.classList.remove('keyboard-active');
        }
      }
    };

    // Add event listeners
    document.addEventListener('focusin', hideNav, { passive: true });
    document.addEventListener('focusout', showNav, { passive: true });
    document.addEventListener('click', handleDocumentClick, { passive: true });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('focusin', hideNav);
      document.removeEventListener('focusout', showNav);
      document.removeEventListener('click', handleDocumentClick);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      
      // Ensure nav is visible on cleanup
      document.body.classList.remove('keyboard-active');
      const navElements = document.querySelectorAll('.bottom-nav');
      navElements.forEach(nav => {
        if (nav instanceof HTMLElement) {
          nav.style.transform = '';
        }
      });
    };
  }, []);
}

export default useHideNavOnKeyboard;