import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './WhyLookZenoPage.css';

function upsertMetaByName(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertMetaByProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function WhyLookZenoPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Pourquoi LookZeno | Streetwear premium au Maroc';

    upsertMetaByName(
      'description',
      'Découvrez pourquoi LookZeno est votre marque streetwear de confiance: qualité premium, design moderne, personnalisation, livraison rapide au Maroc et service client réactif.'
    );
    upsertMetaByName(
      'keywords',
      'Pourquoi LookZeno, streetwear maroc, t-shirt personnalisé maroc, hoodie maroc, qualité premium, impression textile'
    );
    upsertMetaByProperty('og:title', 'Pourquoi LookZeno | Streetwear premium au Maroc');
    upsertMetaByProperty(
      'og:description',
      'Qualité, design et personnalisation: découvrez ce qui fait la différence LookZeno.'
    );
    upsertCanonical('https://lookzeno.com/pourquoi-lookzeno');

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="why-page">
      <SiteHeader />

      <main className="why-main">
        <header className="why-hero">
          <p>Notre différence</p>
          <h1>Pourquoi LookZeno ?</h1>
          <span>Une marque streetwear pensée pour la qualité, le style et la durabilité.</span>
        </header>

        <section className="why-grid">
          <article>
            <h2>Des matières premium, pensées pour durer</h2>
            <p>
              Chez LookZeno, nous sélectionnons des textiles confortables et résistants pour un usage quotidien. Nos
              pièces sont conçues pour garder leur tenue, leur couleur et leur style après plusieurs lavages.
            </p>
          </article>

          <article>
            <h2>Un design streetwear moderne et intemporel</h2>
            <p>
              Nos collections mélangent lignes minimalistes et identité forte. Le résultat: des vêtements faciles à
              porter, qui s’intègrent à votre style sans suivre les tendances éphémères.
            </p>
          </article>

          <article>
            <h2>Personnalisation simple et professionnelle</h2>
            <p>
              Vous pouvez personnaliser vos pièces avec votre logo ou votre visuel. Notre studio de personnalisation
              permet une mise en place claire, avec un rendu propre et un suivi rapide de votre demande.
            </p>
          </article>

          <article>
            <h2>Service local et livraison rapide au Maroc</h2>
            <p>
              Nous privilégions une expérience fluide: commande claire, communication rapide, et livraison dans des
              délais maîtrisés. Notre objectif est simple: vous faire gagner du temps avec une qualité constante.
            </p>
          </article>
        </section>

        <section className="why-faq">
          <h2>Questions fréquentes</h2>
          <div className="why-faq-list">
            <article>
              <h3>LookZeno propose-t-il des vêtements personnalisés ?</h3>
              <p>
                Oui. Vous pouvez personnaliser t-shirts, hoodies et autres pièces via la section Impression
                personnalisée.
              </p>
            </article>
            <article>
              <h3>Quels types de produits puis-je commander ?</h3>
              <p>
                Principalement des t-shirts, hoodies et casquettes, avec des variations de tailles, couleurs et visuels
                selon les collections.
              </p>
            </article>
            <article>
              <h3>La qualité des impressions est-elle durable ?</h3>
              <p>
                Oui. Nous utilisons des techniques adaptées au textile pour préserver la tenue des impressions dans le
                temps.
              </p>
            </article>
          </div>
        </section>

        <section className="why-cta">
          <h2>Prêt à découvrir la collection ?</h2>
          <div className="why-cta-actions">
            <Link to="/products">Voir la boutique</Link>
            <Link to="/custom-print" className="ghost">
              Créer une pièce personnalisée
            </Link>
          </div>
        </section>

        <footer className="why-footer">
          <p>
            <Link to="/politique-confidentialite">Politique de confidentialité</Link> ·{' '}
            <Link to="/conditions-generales">Conditions générales</Link> ·{' '}
            <Link to="/politique-cookies">Politique de cookies</Link> ·{' '}
            <Link to="/mentions-legales">Mentions légales</Link>
          </p>
          <span>© 2026 LookZeno · lookzeno.com</span>
        </footer>
      </main>
    </div>
  );
}

export default WhyLookZenoPage;
