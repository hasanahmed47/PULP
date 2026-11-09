import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CanScene } from '../components/CanScene';
import { HeroFlavourPicker } from '../components/HeroFlavourPicker';
import { AnchorLink } from '../components/AnchorLink';
import { ColourRibbon } from '../components/ColourRibbon';
import { ReplayDropButton } from '../components/ReplayDropButton';
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

const heroIntro = {
  ease: 'power3.out',
  headline: {
    selector: '.hero-line__text',
    offset: 105,
    duration: 0.85,
    ease: 'power5.out',
    stagger: 0.1,
    at: 0,
  },
  risers: [
    { selector: '.hero-explore', y: 24, duration: 0.7, at: 0.55 },
    { selector: '.hero-flavour-picker__chip', y: 18, duration: 0.6, stagger: 0.08, at: 0.9 },
    { selector: '.hero-bottom', y: 14, duration: 0.7, at: 1.15 },
  ],
};

const ribbonDrift = {
  selector: '.colour-ribbon--hero',
  yPercent: -6,
};

export function Hero({ onReady, revealed = false }) {
  const sectionRef = useRef(null);
  const productRef = useRef(null);
  const stageRef = useRef(null);
  const controlsRef = useRef(null);
  const pickerRef = useRef(null);
  const canRef = useRef(null);
  const flavourBlend = useRef({ from: 0, to: 0, amount: 1 });
  const [active, setActive] = useState(0);
  // 0 = can waits above the frame, 1+ = drop played that many times (see CanScene's dropRun).
  const [dropRun, setDropRun] = useState(0);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);

  useEffect(function dropCanWhenSiteIsRevealed() {
    if (revealed) setDropRun((run) => run || 1);
  }, [revealed]);

  function replayDrop() {
    setDropRun((run) => run + 1);
  }

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
      timeline.to([controlsRef.current, pickerRef.current], {
        autoAlpha: 0,
        duration: heroMotion.controlsExit,
      }, 0);
      timeline.to(turn, { value: heroMotion.turn, onUpdate: updateCanRotation }, 0);
      timeline.to('.hero-replay--desktop', {
        autoAlpha: 0,
        duration: heroMotion.controlsExit,
      }, 0);
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

  useLayoutEffect(function playHeroIntro() {
    if (reducedMotion) return;

    const { headline, risers } = heroIntro;
    const hiddenLines = { yPercent: headline.offset };

    const context = gsap.context(function buildIntro() {
      if (!revealed) {
        gsap.set(headline.selector, hiddenLines);
        for (const riser of risers) {
          gsap.set(riser.selector, { opacity: 0, y: riser.y });
        }
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: heroIntro.ease } });

      timeline.fromTo(
        headline.selector,
        hiddenLines,
        {
          yPercent: 0,
          duration: headline.duration,
          ease: headline.ease,
          stagger: headline.stagger,
          clearProps: 'transform',
        },
        headline.at,
      );

      for (const riser of risers) {
        timeline.fromTo(
          riser.selector,
          { opacity: 0, y: riser.y },
          {
            opacity: 1,
            y: 0,
            duration: riser.duration,
            stagger: riser.stagger,
            clearProps: 'opacity,transform',
          },
          riser.at,
        );
      }
    }, sectionRef);

    return function resetIntro() {
      context.revert();
    };
  }, [revealed, reducedMotion]);

  useLayoutEffect(function driftRibbonOnScroll() {
    if (reducedMotion || !revealed) return;

    const context = gsap.context(function createDrift() {
      gsap.to(ribbonDrift.selector, {
        yPercent: ribbonDrift.yPercent,
        ease: 'none',
        scrollTrigger: {
          start: 0,
          end: () => window.innerHeight * heroMotion.scrollDistance,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return function resetRibbonDrift() {
      context.revert();
    };
  }, [revealed, reducedMotion]);

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
      {(revealed || reducedMotion) && (
        <>
          <ColourRibbon animate />
          <ColourRibbon variant="hero-mobile" animate />
        </>
      )}
      <div className="hero-intro">
        <h1 id="hero-title" className="headline hero-title">
          <span className="hero-line">
            <span className="hero-line__text">FLAVOUR</span>
          </span>
          <span className="hero-line">
            <span className="hero-line__text">PACKED IN</span>
          </span>
          <span className="hero-line">
            <span className="hero-line__text">
              ONE CAN<span className="accent-stop">.</span>
            </span>
          </span>
        </h1>
        <AnchorLink className="pill hero-explore" href="#flavours">
          Explore flavours <span aria-hidden="true">↗</span>
        </AnchorLink>
        {!reducedMotion && (
          <ReplayDropButton className="hero-replay hero-replay--mobile" round onClick={replayDrop} />
        )}
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
          dropRun={reducedMotion ? null : dropRun}
          onReady={onReady}
        />
        <HeroFlavourPicker ref={pickerRef} selectedIndex={active} onSelect={setActive} />
      </div>
      <div className="hero-bottom flex items-end justify-between">
        <p>Fruit-forward cocktails.<br />Full-on flavour.</p>
        {!reducedMotion && (
          <ReplayDropButton className="hero-replay hero-replay--desktop" onClick={replayDrop} />
        )}
        <AnchorLink className="text-link" href="#good-insides">
          The juicy bit <span aria-hidden="true">↓</span>
        </AnchorLink>
      </div>
      <span className="sr-only">Small can. Big fruit energy.</span>
    </section>
  );
}