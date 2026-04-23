import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import SiteHeader from '../components/SiteHeader';
import heroImg from '../assets/site/hero.avif';
import heroImgAlt from '../assets/site/hero.png';
import heroImgThird from '../assets/pdp/main.jpg';
import placeholder2 from '../assets/site/product-imgs/placeholder-2.avif';
import capPlaceholder from '../assets/site/product-imgs/Casquettes.webp';
import homeSectionImage from '../assets/images/image1-home-page.webp';
import { fetchStorefrontData } from '../services/backendService';
import { formatMAD } from '../utils/currency';

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

  const featuredProducts = storeData.featured;

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

  const categories = storeData.categories.map((cat) => ({
    name: cat.name,
    desc: cat.description || `${cat.name} collection`
  }));

  const ctaProduct = featuredProducts[0] || storeData.products[0] || null;

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

      {isLoading || (hasHoodiesCategory && hoodieProducts.length > 0) ? (
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
              : hoodieProducts.map((product) => (
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

      <section className="home-image-section" aria-label="LookZeno mise en avant">
        <img src={homeSectionImage} alt="Collection LookZeno en mise en avant" loading="lazy" />
        <div className="home-image-overlay" />
        <div className="home-image-content">
          <p>LookZeno</p>
          <h2>Des pièces visuelles fortes pour ton quotidien</h2>
          <span>Streetwear premium, détails soignés et identité moderne.</span>
          <Link to="/products">Découvrir la collection</Link>
        </div>
      </section>

      {isLoading || capProducts.length > 0 ? (
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
              : capProducts.map((product) => (
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
          : categories.length > 0
            ? categories.map((cat) => (
                <article key={cat.name}>
                  <h2>{cat.name}</h2>
                  <p>{cat.desc}</p>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`}>Acheter {cat.name}</Link>
                </article>
              ))
            : (
                <article>
                  <h2>Catégories à venir</h2>
                  <p>Ajoutez des catégories depuis le tableau de bord pour les afficher ici.</p>
                  <Link to="/products">Voir la boutique</Link>
                </article>
              )}
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
        <Link to={ctaProduct?.to || (ctaProduct?.slug ? `/product/${ctaProduct.slug}` : '/products')}>
          {ctaProduct ? `Commencer avec ${ctaProduct.name}` : 'Découvrir la boutique'}
        </Link>
      </section>

      <footer className="footer">
        <p>
          <Link to="/politique-confidentialite">Politique de confidentialité</Link> ·{' '}
          <Link to="/conditions-generales">Conditions générales</Link> ·{' '}
          <Link to="/politique-cookies">Politique de cookies</Link> ·{' '}
          <Link to="/mentions-legales">Mentions légales</Link> ·{' '}
          <a href="mailto:contact@lookzeno.com">Contact</a>
        </p>
        <span>© 2026 LookZeno</span>
      </footer>
    </div>
  );
}

export default HomePage;
