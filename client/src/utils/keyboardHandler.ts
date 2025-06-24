// Mobile keyboard handling utilities for SoulScroll AI
// Manages keyboard visibility and bottom navigation state

class KeyboardHandler {
  private isKeyboardVisible = false;
  private initialViewportHeight = 0;
  private keyboardThreshold = 150; // Pixels to detect keyboard

  constructor() {
    this.initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Modern approach using Visual Viewport API
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleViewportResize.bind(this));
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.handleWindowResize.bind(this));
    }

    // Input focus/blur events for immediate response
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Touch events for custom keyboard detection
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
  }

  private handleViewportResize() {
    if (!window.visualViewport) return;

    const currentHeight = window.visualViewport.height;
    const heightDifference = this.initialViewportHeight - currentHeight;
    
    if (heightDifference > this.keyboardThreshold) {
      this.showKeyboard();
    } else {
      this.hideKeyboard();
    }
  }

  private handleWindowResize() {
    const currentHeight = window.innerHeight;
    const heightDifference = this.initialViewportHeight - currentHeight;
    
    if (heightDifference > this.keyboardThreshold) {
      this.showKeyboard();
    } else {
      this.hideKeyboard();
    }
  }

  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    
    if (this.isInputElement(target)) {
      // Small delay to allow keyboard to appear
      setTimeout(() => {
        this.showKeyboard();
        this.scrollToElement(target);
      }, 100);
    }
  }

  private handleFocusOut(event: FocusEvent) {
    const target = event.target as HTMLElement;
    
    if (this.isInputElement(target)) {
      // Delay to prevent flicker when switching between inputs
      setTimeout(() => {
        if (!document.activeElement || !this.isInputElement(document.activeElement as HTMLElement)) {
          this.hideKeyboard();
        }
      }, 100);
    }
  }

  private handleTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement;
    
    // If touching outside input elements, ensure keyboard is hidden
    if (!this.isInputElement(target) && !this.isInsideInputContainer(target)) {
      this.hideKeyboard();
    }
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTypes.includes(element.tagName) ||
           element.contentEditable === 'true' ||
           element.hasAttribute('contenteditable');
  }

  private isInsideInputContainer(element: HTMLElement): boolean {
    return element.closest('.journal-editor, .mobile-form, [contenteditable]') !== null;
  }

  private showKeyboard() {
    if (this.isKeyboardVisible) return;
    
    this.isKeyboardVisible = true;
    document.body.classList.add('keyboard-active');
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('keyboard:show', {
      detail: { timestamp: Date.now() }
    }));
  }

  private hideKeyboard() {
    if (!this.isKeyboardVisible) return;
    
    this.isKeyboardVisible = false;
    document.body.classList.remove('keyboard-active');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('keyboard:hide', {
      detail: { timestamp: Date.now() }
    }));
  }

  private scrollToElement(element: HTMLElement) {
    // Ensure focused element is visible when keyboard appears
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const elementBottom = rect.bottom;
    
    if (elementBottom > viewportHeight * 0.6) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  // Public methods for manual control
  public getKeyboardState(): boolean {
    return this.isKeyboardVisible;
  }

  public forceHideKeyboard() {
    // Blur any active input
    if (document.activeElement && this.isInputElement(document.activeElement as HTMLElement)) {
      (document.activeElement as HTMLElement).blur();
    }
    this.hideKeyboard();
  }

  public destroy() {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleViewportResize.bind(this));
    } else {
      window.removeEventListener('resize', this.handleWindowResize.bind(this));
    }
    
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('focusout', this.handleFocusOut.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
  }
}

// Create global instance
export const keyboardHandler = new KeyboardHandler();

// Hook for React components
export const useKeyboardHandler = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleKeyboardShow = () => setIsKeyboardVisible(true);
    const handleKeyboardHide = () => setIsKeyboardVisible(false);

    window.addEventListener('keyboard:show', handleKeyboardShow);
    window.addEventListener('keyboard:hide', handleKeyboardHide);

    return () => {
      window.removeEventListener('keyboard:show', handleKeyboardShow);
      window.removeEventListener('keyboard:hide', handleKeyboardHide);
    };
  }, []);

  return {
    isKeyboardVisible,
    forceHideKeyboard: keyboardHandler.forceHideKeyboard.bind(keyboardHandler)
  };
};

// Import React hooks
import { useState, useEffect } from 'react';