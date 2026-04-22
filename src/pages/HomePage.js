import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import SiteHeader from '../components/SiteHeader';
import heroImg from '../assets/site/hero.avif';
import heroImgAlt from '../assets/site/hero.png';
import heroImgThird from '../assets/pdp/main.jpg';
import placeholder2 from '../assets/site/product-imgs/placeholder-2.avif';
import capPlaceholder from '../assets/site/product-imgs/Casquettes.webp';
import { fetchStorefrontData } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const fallbackFeatured = [
  { name: 'Shutter Speed T-Shirt', price: 29, image: placeholder2, slug: 'shutter-speed', to: '/product/shutter-speed' },
  { name: 'Production Tee', price: 29, image: placeholder2, slug: 'production-tee', to: '/product/production-tee' },
  { name: 'Reverb Tee', price: 29, image: placeholder2, slug: 'reverb-tee', to: '/product/reverb-tee' },
  { name: 'Sticker Pack', price: 8, image: placeholder2, slug: 'sticker-pack', to: '/product/sticker-pack' }
];

const fallbackCaps = [
  { name: 'LookZeno Classic Casquette', price: 24, image: capPlaceholder, slug: 'classic-casquette', to: '/product/classic-casquette' },
  { name: 'Studio Black Casquette', price: 24, image: capPlaceholder, slug: 'studio-black-casquette', to: '/product/studio-black-casquette' }
];

const fallbackHoodies = [
  { name: 'LookZeno Core Hoodie', price: 59, image: placeholder2, slug: 'core-hoodie', to: '/product/core-hoodie' },
  { name: 'LookZeno Studio Hoodie', price: 64, image: placeholder2, slug: 'studio-hoodie', to: '/product/studio-hoodie' }
];

const fallbackCategories = [
  { name: 'T-Shirts', desc: 'T-shirts graphiques et brodés les plus vendus' },
  { name: 'Hoodies', desc: 'Coupes oversize et molleton premium' },
  { name: 'Casquettes', desc: 'Casquettes minimalistes avec broderie premium' }
];

const fallbackHeroSlides = [
  { image: heroImg, alt: 'Look principal LookZeno 1' },
  { image: heroImgAlt, alt: 'Look principal LookZeno 2' },
  { image: heroImgThird, alt: 'Look principal LookZeno 3' }
];

function currency(price) {
  return formatMAD(price);
}

function isCapProduct(item) {
  const category = String(item?.category || '').toLowerCase();
  const name = String(item?.name || '').toLowerCase();
  const tags = Array.isArray(item?.tags) ? item.tags.join(' ').toLowerCase() : '';
  const haystack = `${category} ${name} ${tags}`.trim();
  return /(casquette|casquettes|cap|caps|hat|hats)/i.test(haystack);
}

function isHoodieProduct(item) {
  const category = String(item?.category || '').toLowerCase();
  const name = String(item?.name || '').toLowerCase();
  const tags = Array.isArray(item?.tags) ? item.tags.join(' ').toLowerCase() : '';
  const haystack = `${category} ${name} ${tags}`.trim();
  return /(hoodie|hoodies|sweat|sweatshirt)/i.test(haystack);
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState({ featured: [], products: [], categories: [], heroSlides: [] });
  const heroSlides = !isLoading
    ? storeData.heroSlides.length > 0
      ? storeData.heroSlides
      : fallbackHeroSlides
    : [];

  useEffect(() => {
    if (heroSlides.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    setActiveSlide((current) => (current >= heroSlides.length ? 0 : current));
  }, [heroSlides.length]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data } = await fetchStorefrontData();
        if (!mounted) {
          return;
        }

        if (data) {
          setStoreData(data);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const hasLiveCatalog = storeData.products.length > 0;
  const featuredProducts = hasLiveCatalog ? storeData.featured : fallbackFeatured;

  const capProducts = useMemo(() => {
    const caps = storeData.products.filter((item) => isCapProduct(item));
    return caps.slice(0, 4);
  }, [storeData.products]);

  const hoodieProducts = useMemo(() => {
    const hoodies = storeData.products.filter((item) => isHoodieProduct(item));
    return hoodies.slice(0, 4);
  }, [storeData.products]);

  const hasHoodiesCategory = useMemo(() => {
    const categoriesFromDb = (storeData.categories || []).map((cat) => String(cat?.name || '').toLowerCase());
    if (categoriesFromDb.some((name) => /hoodie|hoodies/.test(name))) {
      return true;
    }
    return storeData.products.some((item) => /hoodie|hoodies/i.test(String(item?.category || '')));
  }, [storeData.categories, storeData.products]);

  const categories =
    storeData.categories.length > 0
      ? storeData.categories.map((cat) => ({ name: cat.name, desc: cat.description || `${cat.name} collection` }))
      : fallbackCategories;

  const ctaProduct = featuredProducts[0] || fallbackFeatured[0];

  return (
    <div className="home-page" id="top">
      <section className="home-hero">
        <div className="hero-slides">
          {isLoading ? <div className="hero-slide-skeleton skeleton" /> : null}
          {!isLoading
            ? heroSlides.map((slide, idx) => (
                <div
                  key={slide.id || slide.alt || slide.image}
                  className={`hero-slide ${idx === activeSlide ? 'active' : ''}`}
                  aria-hidden={idx !== activeSlide}
                >
                  <img src={slide.image || slide.image_url} alt={slide.alt || slide.title || `Hero ${idx + 1}`} />
                </div>
              ))
            : null}
        </div>
        <div className="hero-overlay" />

        <SiteHeader overlay />

        <div className="hero-content">
          <h1>Des pièces modernes pour un streetwear du quotidien.</h1>
          <div className="hero-actions">
            <Link to="/products">Acheter maintenant</Link>
          </div>
        </div>
        <div className="hero-dots" aria-label="Diapositives du hero">
          {!isLoading
            ? heroSlides.map((slide, idx) => (
                <button
                  key={slide.id || slide.alt || slide.image}
                  type="button"
                  className={idx === activeSlide ? 'active' : ''}
                  aria-label={`Aller à la diapositive ${idx + 1}`}
                  aria-pressed={idx === activeSlide}
                  onClick={() => setActiveSlide(idx)}
                />
              ))
            : null}
        </div>
      </section>

      <section className="featured" id="featured">
        <div className="section-head">
          <h2>Produits en vedette</h2>
          <Link to="/products">Voir tout</Link>
        </div>

        <div className="product-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <article className="product-card product-card-skeleton" key={`featured-skeleton-${idx}`}>
                  <div className="skeleton product-image-skeleton" />
                  <div className="skeleton product-title-skeleton" />
                  <div className="skeleton product-price-skeleton" />
                </article>
              ))
            : featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <article className="product-card" key={product.slug || product.name}>
                    <Link to={product.to || `/product/${product.slug}`}>
                      <img src={product.image || placeholder2} alt={product.name} />
                    </Link>
                    <h3>{product.name}</h3>
                    <p>{currency(product.price)}</p>
                  </article>
                ))
              : (
                  <p>Aucun produit en vedette pour le moment.</p>
                )}
        </div>
      </section>

      {isLoading || !hasLiveCatalog || (hasHoodiesCategory && hoodieProducts.length > 0) ? (
        <section className="caps-section" id="hoodies">
          <div className="section-head">
            <h2>Hoodies</h2>
            <Link to="/products">Voir tout</Link>
          </div>
          <div className="product-grid caps-grid">
            {isLoading
              ? Array.from({ length: 2 }).map((_, idx) => (
                  <article className="product-card product-card-skeleton" key={`hoodie-skeleton-${idx}`}>
                    <div className="skeleton product-image-skeleton" />
                    <div className="skeleton product-title-skeleton" />
                    <div className="skeleton product-price-skeleton" />
                  </article>
                ))
              : (hasLiveCatalog ? hoodieProducts : fallbackHoodies).map((product) => (
                  <article className="product-card" key={product.slug || product.name}>
                    <Link to={product.to || `/product/${product.slug}`}>
                      <img src={product.image || placeholder2} alt={product.name} />
                    </Link>
                    <h3>{product.name}</h3>
                    <p>{currency(product.price)}</p>
                  </article>
                ))}
          </div>
        </section>
      ) : null}

      {isLoading || !hasLiveCatalog || capProducts.length > 0 ? (
        <section className="caps-section" id="casquettes">
          <div className="section-head">
            <h2>Casquettes</h2>
            <Link to="/products">Voir tout</Link>
          </div>
          <div className="product-grid caps-grid">
            {isLoading
              ? Array.from({ length: 2 }).map((_, idx) => (
                  <article className="product-card product-card-skeleton" key={`caps-skeleton-${idx}`}>
                    <div className="skeleton product-image-skeleton" />
                    <div className="skeleton product-title-skeleton" />
                    <div className="skeleton product-price-skeleton" />
                  </article>
                ))
              : (hasLiveCatalog ? capProducts : fallbackCaps).map((product) => (
                  <article className="product-card" key={product.slug || product.name}>
                    <Link to={product.to || `/product/${product.slug}`}>
                      <img src={product.image || capPlaceholder} alt={product.name} />
                    </Link>
                    <h3>{product.name}</h3>
                    <p>{currency(product.price)}</p>
                  </article>
                ))}
          </div>
        </section>
      ) : null}

      <section className="categories" id="categories">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <article key={`cat-skeleton-${idx}`}>
                <div className="skeleton category-title-skeleton" />
                <div className="skeleton category-desc-skeleton" />
                <div className="skeleton category-link-skeleton" />
              </article>
            ))
          : categories.map((cat) => (
              <article key={cat.name}>
                <h2>{cat.name}</h2>
                <p>{cat.desc}</p>
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>Acheter {cat.name}</Link>
              </article>
            ))}
      </section>

      <section className="benefits" id="benefits">
        <article>
          <h3>Livraison rapide</h3>
          <p>Livraison en 2 à 5 jours ouvrés avec suivi.</p>
        </article>
        <article>
          <h3>Paiement sécurisé</h3>
          <p>Paiements sécurisés et traitement fiable des commandes.</p>
        </article>
        <article>
          <h3>Retours faciles</h3>
          <p>Retours sous 30 jours pour les articles non portés.</p>
        </article>
      </section>

      <section className="cta-banner">
        <h2>Prêt à renouveler votre garde-robe ?</h2>
        <Link to={ctaProduct.to || `/product/${ctaProduct.slug}`}>Commencer avec {ctaProduct.name}</Link>
      </section>

      <footer className="footer">
        <p>Politique de confidentialité · Conditions d’utilisation · Retours & FAQ · Contact</p>
        <span>© 2026 LookZeno</span>
      </footer>
    </div>
  );
}

export default HomePage;
