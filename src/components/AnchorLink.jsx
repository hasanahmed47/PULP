import '../styles/AnchorLink.css'
import { useScroll } from '../context/ScrollContext';

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function opensElsewhere(link) {
  if (link.hasAttribute('download')) return true;

  const target = link.target.toLowerCase();
  return target !== '' && target !== '_self';
}

function decodeId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function findDestination(link) {
  const isSamePage =
    link.origin === window.location.origin &&
    link.pathname === window.location.pathname &&
    link.search === window.location.search;

  if (!isSamePage || link.hash.length < 2) return null;
  return document.getElementById(decodeId(link.hash.slice(1)));
}

function focusDestination(element) {
  element.focus({ preventScroll: true });
  if (document.activeElement === element || element.hasAttribute('tabindex')) return;

  element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });

  function restoreTabIndex() {
    if (element.getAttribute('tabindex') === '-1') element.removeAttribute('tabindex');
  }

  if (document.activeElement !== element) {
    restoreTabIndex();
    return;
  }

  element.addEventListener('blur', restoreTabIndex, { once: true });
}

export function AnchorLink({ href, children, onClick, onNavigate, ...props }) {
  const { scrollTo } = useScroll();

  function handleClick(event) {
    onClick?.(event);

    if (event.defaultPrevented) return;
    if (event.button !== 0 || isModifiedClick(event)) return;
    const link = event.currentTarget;
    if (opensElsewhere(link)) return;

    const destination = findDestination(link);
    if (!destination) return;

    event.preventDefault();
    onNavigate?.();
    if (link.href !== window.location.href) {
      window.history.pushState(window.history.state, '', link.href);
    }
    scrollTo(destination);

    const triggeredByKeyboard = event.detail === 0;
    if (triggeredByKeyboard) focusDestination(destination);
  }

  return (
    <a href={href} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
