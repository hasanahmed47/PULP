import { useLayoutEffect, useRef, useState } from 'react';
import { CanScene } from '../components/CanScene';
import { HeroFlavourPicker } from '../components/HeroFlavourPicker';
import { AnchorLink } from '../components/AnchorLink';
import { ColourRibbon } from '../components/ColourRibbon';
import { flavours } from '../data/flavours';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import { gsap } from '../lib/animation';
import { planFlavourBlend } from '../lib/flavourBlend';
import './Hero.css';

const heroMotion = {
  flavourDuration: 0.6,
  flavourEase: 'power1.inOut',
  mobileBreakpoint: 768,
  mobileTravel: 0.35,
  desktopTravel: 0.46,
  scrollDistance: 1.5,
  turn: Math.PI * 2,
  scrollDuration: 1,
  textOffset: 25,
  introExit: { duration: 0.27, at: 0.06 },
  secondEntrance: { duration: 0.25, at: 0.58 },
  controlsExit: 0.15,
};

export function Hero({ onReady }) {
  const sectionRef = useRef(null);
  const productRef = useRef(null);
  const stageRef = useRef(null);
  const controlsRef = useRef(null);
  const pickerRef = useRef(null);
  const canRef = useRef(null);
  const flavourBlend = useRef({ from: 0, to: 0, amount: 1 });
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);

  useLayoutEffect(function changeHeroFlavour() {
    const blend = flavourBlend.current;

    function updateFlavour() {
      canRef.current?.setFlavourBlend(blend.from, blend.to, blend.amount);
    }

    const { start, target } = planFlavourBlend(blend, active);
    Object.assign(blend, start);

    if (reducedMotion || blend.amount === target) {
      blend.amount = target;
      updateFlavour();
      return;
    }

    const tween = gsap.to(blend, {
      amount: target,
      duration: heroMotion.flavourDuration,
      ease: heroMotion.flavourEase,
      onUpdate: updateFlavour,
    });
    return () => tween.kill();
  }, [active, reducedMotion]);

  useLayoutEffect(function animateHeroOnScroll() {
    const can = canRef.current;
    if (reducedMotion) {
      can?.setPointer(0, 0);
      return;
    }

    const turn = { value: 0 };

    function getProductOffset() {
      const section = sectionRef.current;
      const travelRatio = window.innerWidth < heroMotion.mobileBreakpoint
        ? heroMotion.mobileTravel : heroMotion.desktopTravel;
      const gutter = parseFloat(getComputedStyle(section).paddingLeft);
      const availableTravel = Math.max(0, productRef.current.offsetLeft - gutter);
      return -Math.min(section.clientWidth * travelRatio, availableTravel);
    }

    function updateCanRotation() {
      can?.setRotation(turn.value);
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none', duration: heroMotion.scrollDuration },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * heroMotion.scrollDistance}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      timeline.to(stageRef.current, { x: getProductOffset }, 0);
      // The controls stay put while the can travels, and fade out over the start of the scroll.
      timeline.to([controlsRef.current, pickerRef.current], {
        autoAlpha: 0,
        duration: heroMotion.controlsExit,
      }, 0);
      timeline.to(turn, { value: heroMotion.turn, onUpdate: updateCanRotation }, 0);
      timeline.to('.hero-intro', {
        autoAlpha: 0,
        y: -heroMotion.textOffset,
        duration: heroMotion.introExit.duration,
      }, heroMotion.introExit.at);
      timeline.fromTo(
        '.hero-second',
        { opacity: 0, y: heroMotion.textOffset },
        { opacity: 1, y: 0, duration: heroMotion.secondEntrance.duration },
        heroMotion.secondEntrance.at,
      );
    }, sectionRef);

    return function resetHeroAnimation() {
      context.revert();
      can?.setRotation(0);
    };
  }, [reducedMotion]);

  function handlePointerMove(event) {
    if (reducedMotion || event.pointerType === 'touch') return;

    const bounds = sectionRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    canRef.current?.setPointer(x, y);
  }

  function handlePointerLeave() {
    canRef.current?.setPointer(0, 0);
  }

  return (
    <section
      id="top"
      tabIndex="-1"
      ref={sectionRef}
      className="hero page-padding"
      data-flavour={flavours[active].id}
      data-visible={visible}
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <ColourRibbon />
      <div className="hero-intro">
        <h1 id="hero-title" className="headline hero-title">
          FLAVOUR<br />PACKED IN<br />ONE CAN<span className="accent-stop">.</span>
        </h1>
        <AnchorLink className="pill hero-explore" href="#flavours">
          Explore flavours <span aria-hidden="true">↗</span>
        </AnchorLink>
      </div>
      <div className="hero-second headline" aria-hidden="true">
        SMALL CAN.<br />BIG FRUIT<br />ENERGY.
      </div>
      <div className="hero-product" ref={productRef}>
        <CanScene
          ref={canRef}
          stageRef={stageRef}
          controlsRef={controlsRef}
          interactive
          allFlavours
          onReady={onReady}
        />
        <HeroFlavourPicker ref={pickerRef} selectedIndex={active} onSelect={setActive} />
      </div>
      <div className="hero-bottom flex items-end justify-between">
        <p>Fruit-forward cocktails.<br />Full-on flavour.</p>
        <AnchorLink className="text-link" href="#good-insides">
          The juicy bit <span aria-hidden="true">↓</span>
        </AnchorLink>
      </div>
      <span className="sr-only">Small can. Big fruit energy.</span>
    </section>
  );
}
