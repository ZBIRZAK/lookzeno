import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import SiteHeader from '../components/SiteHeader';
import heroImg from '../assets/reference/hero.png';
import heroImgAlt from '../assets/pdp/detail.jpg';
import heroImgThird from '../assets/images/image1-home-page.jpg';
import placeholder2 from '../assets/site/product-imgs/product-placeholder.avif';
import homeSectionImage from '../assets/images/image1-home-page.jpg';
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

function HomepageProductSection({ section, index }) {
  return (
    <section
      className={`caps-section dynamic-home-section ${index % 2 === 0 ? 'light' : 'soft'}`}
      id={`homepage-section-${section.id}`}
    >
      <div className="section-head">
        <h2>{section.title}</h2>
        <Link to="/products">Voir tout</Link>
      </div>
      <div className="product-grid caps-grid">
        {section.products.map((product) => (
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
  );
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState({
    featured: [],
    products: [],
    categories: [],
    heroSlides: [],
    homepageSections: []
  });
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

  const categories = useMemo(() => {
    const priority = ['sandals', 'jerseys'];
    return storeData.categories
      .map((cat) => ({
        name: cat.name,
        desc: cat.description || `${cat.name} collection`
      }))
      .sort((a, b) => {
        const aIndex = priority.indexOf(String(a.name || '').toLowerCase());
        const bIndex = priority.indexOf(String(b.name || '').toLowerCase());
        const aRank = aIndex === -1 ? priority.length : aIndex;
        const bRank = bIndex === -1 ? priority.length : bIndex;
        return aRank - bRank;
      });
  }, [storeData.categories]);

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

      {!isLoading
        ? storeData.homepageSections.map((section, index) => (
            <HomepageProductSection key={section.id} section={section} index={index} />
          ))
        : null}

      <section className="home-image-section" aria-label="LookZeno mise en avant">
        <img src={homeSectionImage} alt="Collection LookZeno en mise en avant" loading="lazy" />
        <div className="home-image-overlay" />
        <div className="home-image-content">
          <p>LookZeno</p>
          <h2>Des pièces visuelles fortes pour ton quotidien </h2>
          <span>Streetwear premium, détails soignés et identité moderne.</span>
          <Link to="/products">Découvrir la collection</Link>
        </div>
      </section>

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
