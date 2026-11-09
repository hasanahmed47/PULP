import '../styles/Header.css'
import { AnchorLink } from './AnchorLink';

export function Header() {
  return (
    <header className="site-header page-padding flex items-center justify-between">
      <AnchorLink className="wordmark header-logo" href="#top" aria-label="PULP home">
        PULP<span>®</span>
      </AnchorLink>
      <nav aria-label="Main navigation" className="flex items-center gap-8">
        <AnchorLink className="header-flavours text-link" href="#good-stuff">
          The good stuff <span aria-hidden="true">↗</span>
        </AnchorLink>
        <AnchorLink className="pill header-shop" href="#pick-your-pulp">
          Pick your Pulp <span aria-hidden="true">↗</span>
        </AnchorLink>
      </nav>
    </header>
  );
}
