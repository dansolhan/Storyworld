import { useState, useEffect, useRef } from 'react';

export const useTicker = (
  text: string,
  secondsToRender: number,
  isTicking: boolean = true,
  skip: boolean = false,
  onComplete?: () => void
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state
    setDisplayedText('');
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (skip || secondsToRender <= 0) {
      setDisplayedText(text);
      setIsComplete(true);
      onCompleteRef.current?.();
      return;
    }

    if (!isTicking) {
      return;
    }

    let i = 0;
    let currentHtml = '';

    // Calculate speed. We strip HTML to find the 'visual' length so timing is consistent.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const visibleLength = (tempDiv.textContent || tempDiv.innerText || '').length || 1;

    // Calculate interval milliseconds
    const totalMs = secondsToRender * 1000;
    const speed = Math.max(10, totalMs / visibleLength);

    const interval = setInterval(() => {
      if (i >= text.length) {
        clearInterval(interval);
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }

      let char = text[i];
      currentHtml += char;

      // Fast-forward through HTML tags so they render instantly
      if (char === '<') {
        while (i < text.length - 1) {
          i++;
          char = text[i];
          currentHtml += char;
          if (char === '>') break;
        }
      }

      // Fast-forward through HTML entities (like &copy;)
      if (char === '&') {
        while (i < text.length - 1) {
          i++;
          char = text[i];
          currentHtml += char;
          if (char === ';') break;
        }
      }

      setDisplayedText(currentHtml);
      i++;
    }, speed);

    return () => clearInterval(interval);
  }, [text, secondsToRender, isTicking, skip]);

  return { displayedText, isComplete };
};
