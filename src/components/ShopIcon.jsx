import { ArrowUpRight, Check, Heart, ShoppingBag, X } from 'lucide-react';
import '../styles/ShopIcon.css';

const icons = {
  bag: ShoppingBag,
  heart: Heart,
  'arrow-up-right': ArrowUpRight,
  check: Check,
  close: X,
};

export function ShopIcon({ name, className = '', ...props }) {
  if (!Object.hasOwn(icons, name)) return null;
  const Icon = icons[name];

  return <Icon className={`shop-icon ${className}`.trim()} aria-hidden="true" {...props} />;
}
