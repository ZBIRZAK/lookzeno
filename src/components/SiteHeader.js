import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './SiteHeader.css';
import logoBlack from '../assets/logo/logo-black.png';

function SiteHeader({ overlay = false }) {
  const { totalCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`site-header ${overlay ? 'overlay' : 'solid'}`}>
        <div className="site-left-links">
          <a
            href="https://www.instagram.com/lookzeno/"
            target="_blank"
            rel="noreferrer"
            className="site-instagram-link"
            aria-label="Instagram LookZeno"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4.25" />
              <circle className="instagram-dot" cx="17.4" cy="6.7" r="1.1" />
            </svg>
          </a>
        </div>

        <Link to="/" className="site-brand">
          <img src={logoBlack} alt="LookZeno" className="site-logo light" />
          <img src={logoBlack} alt="LookZeno" className="site-logo dark" />
        </Link>

        <button
          type="button"
          className={`site-menu-toggle ${menuOpen ? 'open' : ''}`}
          aria-label="Basculer le menu de navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="site-right-links">
          <Link to="/products">Boutique</Link>
          <Link to="/pourquoi-lookzeno">Pourquoi LookZeno</Link>
          <Link to="/cart" className="site-cart-icon" aria-label={`Panier avec ${totalCount} article(s)`}>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M6.4 8.2h11.2l-1.1 11.1H7.5L6.4 8.2Z" />
                <path d="M9.2 8.2V6.9a2.8 2.8 0 0 1 5.6 0v1.3h-1.7V6.9a1.1 1.1 0 1 0-2.2 0v1.3H9.2Z" />
              </svg>
            </span>
            {totalCount > 0 ? <em>{totalCount}</em> : null}
          </Link>
        </div>

        <Link to="/cart" className="site-mobile-cart site-cart-icon" aria-label={`Panier avec ${totalCount} article(s)`}>
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="M6.4 8.2h11.2l-1.1 11.1H7.5L6.4 8.2Z" />
              <path d="M9.2 8.2V6.9a2.8 2.8 0 0 1 5.6 0v1.3h-1.7V6.9a1.1 1.1 0 1 0-2.2 0v1.3H9.2Z" />
            </svg>
          </span>
          {totalCount > 0 ? <em>{totalCount}</em> : null}
        </Link>
      </header>

      <button
        type="button"
        aria-label="Fermer le menu mobile"
        className={`site-menu-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />

      <aside className={`site-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <p>Menu</p>
        <Link to="/products" onClick={closeMenu}>Boutique</Link>
        <Link to="/pourquoi-lookzeno" onClick={closeMenu}>Pourquoi LookZeno</Link>
        <Link to="/cart" onClick={closeMenu}>Panier ({totalCount})</Link>
      </aside>
    </>
  );
}

export default SiteHeader;
