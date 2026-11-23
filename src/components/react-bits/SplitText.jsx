import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './SplitText.css';

export function SplitText({ text, className = '', id }) {
  const headingRef = useRef(null);
  const completedText = useRef(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(function revealHeading() {
    const heading = headingRef.current;
    if (reducedMotion || completedText.current === text) {
      completedText.current = text;
      heading.dataset.reveal = 'complete';
      return;
    }

    let cancelled = false;
    let context;
    let split;

    async function prepareText() {
      try {
        const [, module] = await Promise.all([document.fonts.ready, import('gsap/SplitText')]);
        if (cancelled) return;
        const GSAPSplitText = module.SplitText;
        gsap.registerPlugin(GSAPSplitText);
        context = gsap.context(() => {
          split = new GSAPSplitText(heading.querySelectorAll('.split-text__row'), {
            type: 'words,chars',
            smartWrap: true,
            mask: 'words',
            wordsClass: 'split-text__word',
            charsClass: 'split-text__char',
            reduceWhiteSpace: false,
            aria: 'none',
          });
          heading.dataset.reveal = 'ready';
          gsap.fromTo(split.chars, { opacity: 0, yPercent: 110 }, {
            opacity: 1,
            yPercent: 0,
            duration: 0.65,
            ease: 'power3.out',
            stagger: 0.018,
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true, fastScrollEnd: true },
            onStart: () => { heading.dataset.reveal = 'playing'; },
            onComplete: () => {
              completedText.current = text;
              heading.dataset.reveal = 'complete';
              gsap.set(split.chars, { clearProps: 'transform,opacity' });
            },
          });
        }, heading);
      } catch {
        context?.revert();
        split?.revert();
        heading.dataset.reveal = 'complete';
      }
    }

    prepareText();
    return function restoreText() {
      cancelled = true;
      context?.revert();
      split?.revert();
    };
  }, [reducedMotion, text]);

  return (
    <h2 ref={headingRef} id={id} className={`split-text ${className}`} aria-label={text.replaceAll('\n', ' ')}>
      {text.split('\n').map(line => <span key={line} className="split-text__row" aria-hidden="true">{line}</span>)}
    </h2>
  );
}
