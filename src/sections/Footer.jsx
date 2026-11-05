import './Footer.css';
import { useEffect, useRef, useState } from 'react';
import { AnchorLink } from '../components/AnchorLink';
import { FloatingFruit } from '../components/FloatingFruit';
import { ColourRibbon } from '../components/ColourRibbon';
import { useVisibility } from '../hooks/useVisibility';

const minuteInMilliseconds = 60000;
const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function Footer() {
  const footerRef = useRef(null);
  const [now, setNow] = useState(() => new Date());
  const visible = useVisibility(footerRef);
  const formattedTime = clockFormatter.format(now);

  useEffect(function syncClock() {
    let timeout;

    function scheduleTick() {
      const delay = minuteInMilliseconds - (Date.now() % minuteInMilliseconds);
      timeout = window.setTimeout(function updateClock() {
        setNow(new Date());
        scheduleTick();
      }, delay);
    }

    scheduleTick();

    return function stopClock() {
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <footer ref={footerRef} className="site-footer page-padding" data-visible={visible}>
      <ColourRibbon variant="footer" />
      <div className="footer-invitation text-center">
        <h2 className="headline">
          PICK YOUR<br />FRUITY MOOD.
        </h2>
        <AnchorLink className="footer-cta" href="#pick-your-pulp">
          Choose your flavour <span aria-hidden="true">↗</span>
        </AnchorLink>
      </div>
      <div className="footer-brand">
        <div className="wordmark footer-wordmark" role="img" aria-label="PULP registered trademark">
          PULP<span>®</span>
        </div>
        <FloatingFruit flavour="blood-orange" className="footer-orange" />
        <FloatingFruit flavour="blueberry" className="footer-berries" />
      </div>
      <div className="footer-bottom">
        <p>© {now.getFullYear()} PULP</p>
        <p>Enjoy responsibly.</p>
        <p className="footer-clock">
          <span>Pulp o’clock</span>
          <time dateTime={now.toISOString()} aria-label={`Your local time: ${formattedTime}`}>
            {formattedTime}
          </time>
        </p>
        <AnchorLink className="text-link" href="#top">
          Back to top <span aria-hidden="true">↑</span>
        </AnchorLink>
      </div>
    </footer>
  );
}
