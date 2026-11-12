import { useEffect, useRef } from 'react';
import { media } from '../data/media';
import { FloatingFruit } from '../components/FloatingFruit';
import { ColourRibbon } from '../components/ColourRibbon';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { useFruitParallax } from '../hooks/useFruitParallax';
import { gsap } from '../lib/animation';
import './Mascot.css';

function createEyeMotion(pupil) {
  return {
    x: gsap.quickTo(pupil, 'x', { duration: 0.8, ease: 'power2.out' }),
    y: gsap.quickTo(pupil, 'y', { duration: 0.8, ease: 'power2.out' }),
  };
}

function getPointerOffset(pointer, start, size) {
  const distanceFromCenter = pointer - start - size / 2;
  return Math.max(-1, Math.min(1, distanceFromCenter / 350));
}

export function Mascot() {
  const sectionRef = useRef(null);
  const mascotRef = useRef(null);
  const motionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);
  const parallax = useFruitParallax(sectionRef, { repel: true });

  useEffect(function createMascotMotion() {
    if (reducedMotion) return;
    const mascot = mascotRef.current;
    const pupils = Array.from(mascot.querySelectorAll('.mascot-pupil'));
    const controls = {
      head: gsap.quickTo(mascot, 'rotation', { duration: 0.5, ease: 'power2.out' }),
      eyes: pupils.map(createEyeMotion),
    };
    motionRef.current = controls;

    return function destroyMascotMotion() {
      controls.head.tween.kill();
      for (const { x, y } of controls.eyes) {
        x.tween.kill();
        y.tween.kill();
      }
      gsap.set([mascot, ...pupils], { clearProps: 'transform' });
      motionRef.current = null;
    };
  }, [reducedMotion]);

  function handlePointerMove(event) {
    parallax.onPointerMove(event);
    const controls = motionRef.current;
    if (!controls || event.pointerType === 'touch') return;

    const bounds = mascotRef.current.getBoundingClientRect();
    const x = getPointerOffset(event.clientX, bounds.left, bounds.width);
    const y = getPointerOffset(event.clientY, bounds.top, bounds.height);

    controls.head(x * 5);
    for (const eye of controls.eyes) {
      eye.x(x * 9);
      eye.y(y * 7);
    }
  }

  function handlePointerLeave() {
    parallax.onPointerLeave();
    const controls = motionRef.current;
    if (!controls) return;

    controls.head(0);
    for (const eye of controls.eyes) {
      eye.x(0);
      eye.y(0);
    }
  }

  return (
    <section
      id="good-insides"
      tabIndex="-1"
      ref={sectionRef}
      className="mascot-section page-padding"
      data-visible={visible}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-labelledby="mascot-title"
    >
      <ColourRibbon variant="mascot" />
      <h2 id="mascot-title" className="headline text-center">
        WE'VE GOT<br />GOOD INSIDES.
      </h2>
      <div className="mascot-stage">
        <div
          className="mascot-character"
          ref={mascotRef}
          role="img"
          aria-label="A smiling orange-wedge mascot with little arms and feet"
        >
          <img src={media.mascot} alt="" width="700" height="700" loading="lazy" draggable="false" />
          {media.mascotInteractiveEyes && (
            <>
              <span className="mascot-pupil mascot-pupil--left" />
              <span className="mascot-pupil mascot-pupil--right" />
            </>
          )}
        </div>
        <FloatingFruit flavour="blood-orange" className="mascot-orange" />
        <FloatingFruit flavour="passionfruit-yuzu" className="mascot-passionfruit" />
        <FloatingFruit flavour="blueberry" className="mascot-berries" />
        <FloatingFruit flavour="lime-basil" className="mascot-lime" />
      </div>
    </section>
  );
}
