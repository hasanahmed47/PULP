import { useLayoutEffect, useRef, useState } from 'react';
import { flavours } from '../data/flavours';
import { CanScene } from '../components/CanScene';
import { FloatingFruit } from '../components/FloatingFruit';
import { useScroll } from '../context/ScrollContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { gsap } from '../lib/animation';
import './FlavourRotation.css';

function getFlavourScrollPosition(trigger, index) {
  const lastIndex = flavours.length - 1;
  const scrollRange = trigger.end - trigger.start;
  const progress = index / lastIndex;
  const destination = trigger.start + scrollRange * progress;

  if (index === 0) return destination + 1;
  if (index === lastIndex) return destination - 1;
  return destination;
}

export function FlavourRotation() {
  const sectionRef = useRef(null);
  const canRef = useRef(null);
  const triggerRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const { scrollTo } = useScroll();
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);
  const flavour = flavours[active];

  useLayoutEffect(function animateFlavoursOnScroll() {
    const can = canRef.current;
    if (reducedMotion) {
      can?.setFlavourPosition(activeRef.current);
      can?.setRotation(0);
      return;
    }

    const state = { position: 0 };
    let disposed = false;

    function updateCan() {
      if (disposed) return;
      can?.setFlavourPosition(state.position);
      can?.setRotation(state.position * Math.PI * 2);
      const index = Math.round(state.position);
      if (activeRef.current === index) return;

      activeRef.current = index;
      setActive(index);
    }

    const context = gsap.context(() => {
      const tween = gsap.to(state, {
        position: flavours.length - 1,
        ease: 'none',
        onUpdate: updateCan,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      triggerRef.current = tween.scrollTrigger;
      updateCan();
    }, sectionRef);

    return function stopFlavourAnimation() {
      disposed = true;
      triggerRef.current = null;
      context.revert();
    };
  }, [reducedMotion]);

  function chooseFlavour(index) {
    const trigger = triggerRef.current;
    if (!reducedMotion && trigger) {
      scrollTo(getFlavourScrollPosition(trigger, index));
      return;
    }

    activeRef.current = index;
    setActive(index);
    canRef.current?.setFlavourPosition(index);
    canRef.current?.setRotation(0);
  }

  return (
    <section
      ref={sectionRef}
      className="rotation-section page-padding"
      data-visible={visible}
      aria-label="Explore all four flavours"
      data-flavour={flavour.id}
    >
      <h2 className="rotation-title headline" aria-live="polite" aria-atomic="true">
        {flavour.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <p className="flavour-counter" aria-hidden="true">
        {String(active + 1).padStart(2, '0')}
        <span> / {String(flavours.length).padStart(2, '0')}</span>
      </p>
      <div className="rotation-blob organic-shape" aria-hidden="true" />
      <div className="rotation-product">
        <CanScene ref={canRef} allFlavours />
      </div>
      <FloatingFruit key={`${flavour.id}-left`} flavour={flavour.id} className="rotation-fruit--left" />
      <FloatingFruit key={`${flavour.id}-right`} flavour={flavour.id} className="rotation-fruit--right" />
      <div
        className="flavour-dots flex items-center justify-center gap-2"
        role="group"
        aria-label="Choose a flavour"
      >
        {flavours.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="flavour-dot"
            data-flavour={item.id}
            aria-label={`Show ${item.name}`}
            aria-pressed={active === index}
            onClick={() => chooseFlavour(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}
