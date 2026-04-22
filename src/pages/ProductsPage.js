import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './ProductsPage.css';
import placeholder from '../assets/site/product-imgs/product-placeholder.avif';
import SiteHeader from '../components/SiteHeader';
import { fetchStorefrontData } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const sorts = ['En vedette', 'Prix : croissant', 'Prix : décroissant'];

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialCategoryParam = searchParams.get('category') || 'Tous';

  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState(['Tous']);
  const [category, setCategory] = useState(initialCategoryParam);
  const [sortBy, setSortBy] = useState('En vedette');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setIsLoading(true);
      try {
        const { data } = await fetchStorefrontData();
        if (!mounted) {
          return;
        }

        if (data) {
          const nextCatalog = data.products || [];
          const catalogCategories = Array.from(new Set(nextCatalog.map((item) => item.category).filter(Boolean)));
          const nextCategories = ['Tous', ...catalogCategories];

          setCatalog(nextCatalog);
          setCategories(nextCategories);

          setCategory((current) => {
            if (initialCategoryParam !== 'Tous' && nextCategories.includes(initialCategoryParam)) {
              return initialCategoryParam;
            }
            return nextCategories.includes(current) ? current : 'Tous';
          });
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
  }, [initialCategoryParam]);

  const products = useMemo(() => {
    const byCategory =
      category === 'Tous' ? catalog : catalog.filter((product) => product.category === category);

    const query = searchQuery.trim().toLowerCase();
    const filtered = byCategory.filter((product) => {
      const hay = `${product.name} ${product.category} ${(product.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(query);
    });

    if (sortBy === 'Prix : croissant') {
      return [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortBy === 'Prix : décroissant') {
      return [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return filtered;
  }, [catalog, category, searchQuery, sortBy]);

  const hasActiveFilters = category !== 'Tous' || sortBy !== 'En vedette' || searchQuery.trim() !== '';
  const activeFiltersCount =
    (category !== 'Tous' ? 1 : 0) + (sortBy !== 'En vedette' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  return (
    <div className="products-page" id="top">
      <SiteHeader />

      <section className="products-hero">
        <p>Boutique LookZeno</p>
        <h1>Tous les produits</h1>
      </section>

      <section className="products-toolbar" id="catalog">
        <div className="products-toolbar-meta">
          <p>{isLoading ? 'Chargement des produits...' : `${products.length} résultat(s)`}</p>
          <div className="toolbar-meta-actions">
            {hasActiveFilters ? (
              <button
                type="button"
                className="clear-filters"
                onClick={() => {
                  setCategory('Tous');
                  setSortBy('En vedette');
                  setSearchQuery('');
                }}
              >
                Effacer
              </button>
            ) : null}
            <button
              type="button"
              className={`filters-toggle ${filtersOpen ? 'open' : ''} ${hasActiveFilters ? 'has-active' : ''}`}
              aria-expanded={filtersOpen}
              aria-controls="products-filters-panel"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <span className="filters-toggle-label">{filtersOpen ? 'Masquer les filtres' : 'Filtres'}</span>
              {activeFiltersCount > 0 ? <span className="filters-count">{activeFiltersCount}</span> : null}
              <span className="filters-caret" aria-hidden="true">
                ▾
              </span>
            </button>
          </div>
        </div>

        <div id="products-filters-panel" className={`products-toolbar-main ${filtersOpen ? 'open' : ''}`}>
          <div className="chips" role="tablist" aria-label="Catégories de produits">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? 'chip active' : 'chip'}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="search-wrap" htmlFor="productSearch">
            <span>Recherche</span>
            <input
              id="productSearch"
              type="search"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <label className="sort-wrap" htmlFor="sortSelect">
            Trier
            <select id="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {sorts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="products-grid-wrap">
        {isLoading ? (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <article key={`product-skeleton-${idx}`} className="shop-card shop-card-skeleton">
                <div className="skeleton product-image-skeleton" />
                <div className="shop-content">
                  <div className="skeleton product-title-skeleton" />
                  <div className="skeleton product-price-skeleton" />
                </div>
              </article>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((item) => (
              <article key={item.slug || item.id} className="shop-card">
                <Link to={item.to || `/product/${item.slug}`} className="image-link">
                  <img src={item.image || placeholder} alt={item.name} />
                  <span className="shop-badge">{item.badge}</span>
                </Link>
                <div className="shop-content">
                  <h3>
                    <Link to={item.to || `/product/${item.slug}`} className="shop-title-link">
                      {item.name}
                    </Link>
                  </h3>
                  <strong className="shop-price">{formatMAD(item.price)}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Aucun produit trouvé</h2>
            <p>Essayez une autre catégorie ou effacez les filtres pour voir tous les produits.</p>
            <button
              type="button"
              onClick={() => {
                setCategory('Tous');
                setSortBy('En vedette');
                setSearchQuery('');
              }}
            >
              Réinitialiser le catalogue
            </button>
          </div>
        )}
      </section>

      <footer className="products-footer">
        <p>Politique de confidentialité · Conditions d’utilisation · Retours & FAQ · Contact</p>
        <span>© 2026 LookZeno</span>
      </footer>
    </div>
  );
}

export default ProductsPage;
