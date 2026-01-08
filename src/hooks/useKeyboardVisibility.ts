import { useState, useEffect, useCallback } from 'react';
import { Keyboard, KeyboardEventListener } from 'react-native';

interface KeyboardVisibilityState {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

interface KeyboardVisibilityReturn extends KeyboardVisibilityState {
  dismissKeyboard: () => void;
}

/**
 * Hook to track keyboard visibility and height.
 * Provides a dismissKeyboard callback and keyboard state.
 *
 * @example
 * const { isKeyboardVisible, keyboardHeight, dismissKeyboard } = useKeyboardVisibility();
 */
export const useKeyboardVisibility = (): KeyboardVisibilityReturn => {
  const [state, setState] = useState<KeyboardVisibilityState>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const handleKeyboardShow: KeyboardEventListener = (e) => {
      setState({
        isKeyboardVisible: true,
        keyboardHeight: e.endCoordinates.height,
      });
    };

    const handleKeyboardHide: KeyboardEventListener = () => {
      setState({
        isKeyboardVisible: false,
        keyboardHeight: 0,
      });
    };

    const showSubscriptions = [
      Keyboard.addListener('keyboardWillShow', handleKeyboardShow),
      Keyboard.addListener('keyboardDidShow', handleKeyboardShow),
    ];

    const hideSubscriptions = [
      Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
      Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
    ];

    return () => {
      [...showSubscriptions, ...hideSubscriptions].forEach((sub) => sub.remove());
    };
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    ...state,
    dismissKeyboard,
  };
};
