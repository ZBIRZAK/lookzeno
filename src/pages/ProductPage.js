import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './ProductPage.css';
import { useCart } from '../context/CartContext';
import SiteHeader from '../components/SiteHeader';
import mainImage from '../assets/pdp/main.jpg';
import { fetchProductBySlug, fetchRelatedProducts } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const fallbackSizes = ['S', 'M', 'L', 'XL', '2XL'];

function ProductPage() {
  const { slug = 'shutter-speed' } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(mainImage);
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [openInfo, setOpenInfo] = useState('');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const cartRowRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      const { data } = await fetchProductBySlug(slug);

      if (!mounted) {
        return;
      }

      if (data) {
        setProduct(data);
        setActiveImage(data.image || mainImage);
        const initialSize = Array.isArray(data.sizes) && data.sizes.length > 0 ? data.sizes[0] : 'M';
        setSize(initialSize);

        const related = await fetchRelatedProducts({
          category: data.category,
          excludeSlug: data.slug,
          limit: 4
        });
        if (mounted && related.data) {
          setRelatedProducts(related.data);
        }
      } else {
        setProduct(null);
      }

      setLoading(false);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const gallery = useMemo(() => {
    if (product?.images?.length) {
      return product.images.map((img) => ({
        src: img.image_url,
        label: img.variant_label || ''
      }));
    }

    if (product?.image) {
      return [{ src: product.image, label: 'Principal' }];
    }
    return [{ src: mainImage, label: 'Principal' }];
  }, [product]);

  const sizes = product?.sizes?.length ? product.sizes : fallbackSizes;

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image: product.image || mainImage,
      size,
      qty
    });
    setJustAdded(true);
  };

  useEffect(() => {
    const cartRow = cartRowRef.current;
    if (!cartRow) {
      return undefined;
    }

    const updateStickyState = () => {
      const isMobileViewport = window.matchMedia('(max-width: 920px)').matches;
      setIsMobileViewport(isMobileViewport);
      if (!isMobileViewport) {
        setShowStickyCart(false);
        return;
      }

      const { bottom } = cartRow.getBoundingClientRect();
      setShowStickyCart(bottom <= 0);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        updateStickyState();
        ticking = false;
      });
    };

    updateStickyState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateStickyState);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateStickyState);
    };
  }, []);

  useEffect(() => {
    if (!justAdded) {
      return undefined;
    }

    const timer = window.setTimeout(() => setJustAdded(false), 1300);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const infoSections = useMemo(() => {
    if (Array.isArray(product?.info_sections) && product.info_sections.length > 0) {
      return product.info_sections;
    }

    return [
      {
        id: 'care',
        title: 'Instructions de lavage et d’entretien',
        content: 'Lavage en machine à froid. Retourner le vêtement. Sécher à l’air libre pour préserver l’impression.'
      },
      {
        id: 'details',
        title: 'Plus de détails',
        content: '100% coton. Coupe intermédiaire. Impression sérigraphique avec encres premium pour un usage quotidien.'
      },
      {
        id: 'returns',
        title: 'Garantie qualité et retours',
        content: 'Retour sous 30 jours pour les articles non portés. Échanges possibles pour un changement de taille.'
      }
    ];
  }, [product]);

  useEffect(() => {
    if (infoSections.length === 0) {
      setOpenInfo('');
      return;
    }

    setOpenInfo((current) => {
      const stillExists = infoSections.some((section) => section.id === current);
      return stillExists ? current : infoSections[0].id;
    });
  }, [infoSections]);

  if (loading) {
    return (
      <div className="pdp-page" id="top">
        <div className="pdp-promo">Livraison offerte à partir de 80 MAD</div>
        <SiteHeader />
        <main className="pdp-main">
          <section className="product-hero">
            <div className="breadcrumb">
              <span className="skeleton pdp-breadcrumb-skeleton" />
            </div>

            <div className="hero-grid">
              <aside className="thumbs">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`thumb-skeleton-${idx}`} className="thumb">
                    <div className="skeleton pdp-thumb-skeleton" />
                  </div>
                ))}
              </aside>

              <div className="main-photo">
                <div className="skeleton pdp-main-photo-skeleton" />
              </div>

              <article className="product-info">
                <div className="skeleton pdp-eyebrow-skeleton" />
                <div className="skeleton pdp-title-skeleton" />
                <div className="skeleton pdp-price-skeleton" />
                <div className="skeleton pdp-desc-skeleton" />
                <div className="skeleton pdp-desc-skeleton short" />
                <div className="skeleton pdp-size-row-skeleton" />
                <div className="skeleton pdp-cart-row-skeleton" />
              </article>
            </div>
          </section>

          <section className="related" id="related">
            <div className="related-head">
              <h2>Vous aimerez aussi</h2>
            </div>
            <div className="related-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <article key={`related-skeleton-${idx}`} className="related-card related-card-skeleton">
                  <div className="skeleton related-image-skeleton" />
                  <div className="skeleton related-title-skeleton" />
                  <div className="skeleton related-price-skeleton" />
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-page" id="top">
        <SiteHeader />
        <main className="pdp-main">
          <section className="details">
            <h2>Produit introuvable</h2>
            <p>Ce produit n’est pas encore disponible. Vous pouvez parcourir le catalogue complet.</p>
            <Link to="/products">Voir les produits</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`pdp-page ${showStickyCart ? 'has-sticky-cart' : ''}`} id="top">
      <div className="pdp-promo">Livraison offerte à partir de 80 MAD</div>
      <SiteHeader />

      <main className="pdp-main">
        <section className="product-hero">
          <div className="breadcrumb">
            <Link to="/">Accueil</Link>
            <span>›</span>
            <span>Boutique</span>
            <span>›</span>
            <strong>{product.name}</strong>
          </div>

          <div className="hero-grid">
            <aside className="thumbs">
              {gallery.map((image, idx) => (
                <button
                  type="button"
                  key={`${image.src}-${idx}`}
                  className={`thumb ${activeImage === image.src ? 'active' : ''}`}
                  onClick={() => setActiveImage(image.src)}
                  aria-label={`Voir l’image ${idx + 1}`}
                >
                  <img src={image.src} alt={image.label || `${product.name} vue ${idx + 1}`} />
                </button>
              ))}
            </aside>

            <div className="main-photo">
              <img src={activeImage} alt={product.name} />
            </div>

            <article className="product-info">
              <p className="eyebrow">{product.badge || 'Nouvelle arrivée'}</p>
              <h1>{product.name}</h1>
              <p className="price">{formatMAD(product.price)}</p>
              <p className="description">{product.description}</p>

              <p className="label">Choisir la taille</p>
              <div className="size-row">
                {sizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`size-btn ${size === item ? 'selected' : ''}`}
                    onClick={() => setSize(item)}
                    aria-pressed={size === item}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="cart-row" ref={cartRowRef}>
                <div className="qty-stepper" aria-label="quantité">
                  <button type="button" onClick={() => setQty((current) => Math.max(1, current - 1))}>
                    -
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty((current) => Math.min(20, current + 1))}>
                    +
                  </button>
                </div>
                <button type="button" className={`add-cart ${justAdded ? 'added' : ''}`} onClick={handleAddToCart}>
                  {justAdded ? 'Ajouté' : 'Ajouter au panier'}
                </button>
              </div>

              <p className="shipping-note">Livraison estimée : 1 à 2 jours ouvrés.</p>

              <div className="info-list">
                {infoSections.map((section) => {
                  const isOpen = openInfo === section.id;
                  return (
                    <div key={section.id} className={`info-item ${isOpen ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="info-trigger"
                        onClick={() => setOpenInfo((current) => (current === section.id ? '' : section.id))}
                      >
                        <span>{section.title}</span>
                        <strong>{isOpen ? '−' : '+'}</strong>
                      </button>
                      {isOpen ? <p className="info-content">{section.content}</p> : null}
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </section>

        {product.media_video_url ? (
          <section className="media-strip">
            <video src={product.media_video_url} controls preload="metadata" playsInline />
          </section>
        ) : null}

        {product.detail_image_url ? (
          <section className="details">
            <h2>Chaque détail compte</h2>
            <p>
              Les mêmes touches subtiles et détails cachés que nous aimons dans nos vidéos
              se retrouvent ici. Design réfléchi, meilleurs matériaux et finitions soignées.
            </p>
            <div className="detail-photo-wrap">
              <img src={product.detail_image_url} alt="Détail du produit" />
              {/* <div className="badge">
                <span />
              </div> */}
            </div>
          </section>
        ) : null}

        <section className="related" id="related">
          <div className="related-head">
            <h2>Vous aimerez aussi</h2>
            <Link to="/">Retour à l’accueil</Link>
          </div>
          <div className="related-grid">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((item) => (
                <article key={item.slug || item.name} className="related-card">
                  <Link to={item.to || `/product/${item.slug}`}>
                    <img src={item.image || mainImage} alt={item.name} />
                  </Link>
                  <h3>{item.name}</h3>
                  <p>{formatMAD(item.price)}</p>
                </article>
              ))
            ) : (
              <article className="related-empty" aria-live="polite">
                <p>Aucun produit associé pour le moment.</p>
              </article>
            )}
          </div>
        </section>
      </main>

      {isMobileViewport ? (
        <div className={`sticky-add-cart ${showStickyCart ? 'show' : ''}`}>
          <div className="sticky-add-cart-inner">
            <p>
              <strong>{formatMAD(product.price)}</strong>
              <span>
                Taille {size} · Qté {qty}
              </span>
            </p>
            <button type="button" className={`sticky-add-btn ${justAdded ? 'added' : ''}`} onClick={handleAddToCart}>
              {justAdded ? 'Ajouté' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      ) : null}

      <footer className="pdp-footer">
        <p>Politique de confidentialité · Conditions d’utilisation · Retours & FAQ · Contact</p>
        <span>© 2026 LookZeno</span>
      </footer>
    </div>
  );
}

export default ProductPage;
