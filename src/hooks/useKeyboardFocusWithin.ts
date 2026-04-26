import {
  type FocusEvent,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type FocusWithinProps<T extends HTMLElement> = Pick<
  HTMLAttributes<T>,
  "onFocusCapture" | "onBlurCapture"
>;

export function useKeyboardFocusWithin<T extends HTMLElement>() {
  const [isKeyboardFocusWithin, setIsKeyboardFocusWithin] = useState(false);
  const lastInteractionWasKeyboard = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        lastInteractionWasKeyboard.current = true;
      }
    };

    const handlePointerDown = () => {
      lastInteractionWasKeyboard.current = false;
      setIsKeyboardFocusWithin(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  const onFocusCapture = useCallback(() => {
    if (lastInteractionWasKeyboard.current) {
      setIsKeyboardFocusWithin(true);
    }
  }, []);

  const onBlurCapture = useCallback((event: FocusEvent<T>) => {
    const nextFocusedElement = event.relatedTarget;
    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    setIsKeyboardFocusWithin(false);
  }, []);

  const focusWithinProps: FocusWithinProps<T> = {
    onFocusCapture,
    onBlurCapture,
  };

  return { isKeyboardFocusWithin, focusWithinProps };
}
