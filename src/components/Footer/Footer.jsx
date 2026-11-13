import './Footer.css';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { AnchorLink } from '../AnchorLink';
import { FlameCanvas } from './FlameCanvas';
import { contactEmail } from '../../data/site';

const footerLinks = [
  { href: '#good-insides', label: 'The good stuff' },
  { href: '#flavours', label: 'Our flavours' },
  { href: '#pick-your-pulp', label: 'Build your mix' },
];
const clockFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});

export function Footer() {
  const [now, setNow] = useState(() => new Date());
  const formattedTime = clockFormatter.format(now).toLowerCase().replace(' ', '\u00a0');

  useEffect(function synchronizeClock() {
    let timer;

    function scheduleTick() {
      timer = window.setTimeout(function tick() {
        setNow(new Date());
        scheduleTick();
      }, 60000 - (Date.now() % 60000));
    }

    scheduleTick();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <footer className="flame-footer">
      <FlameCanvas />
      <div className="footer-top">
        <AnchorLink className="wordmark footer-logo" href="#top" aria-label="PULP home">
          PULP<span>®</span>
        </AnchorLink>
        <nav className="footer-nav" aria-label="Footer navigation">
          {footerLinks.map(({ href, label }) => (
            <AnchorLink key={href} href={href}>
              {label} <ArrowUpRight aria-hidden="true" />
            </AnchorLink>
          ))}
        </nav>
        <AnchorLink className="footer-cta" href="#pick-your-pulp">
          Choose your flavour <ArrowUpRight aria-hidden="true" />
        </AnchorLink>
      </div>
      <div className="footer-rule" aria-hidden="true" />
      <div className="footer-mid">
        <a className="footer-headline" href={`mailto:${contactEmail}`} aria-label="Get in touch">
          <span>Get in Touch</span>
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {now.getFullYear()} PULP</span>
        <span>Enjoy responsibly.</span>
        <span className="footer-clock">
          Pulp o’clock
          <time dateTime={now.toISOString()} aria-label={`Your local time: ${formattedTime}`}>
            {formattedTime}
          </time>
        </span>
        <AnchorLink className="text-link footer-up" href="#top">
          Back to top <ArrowUp aria-hidden="true" />
        </AnchorLink>
      </div>
    </footer>
  );
}
