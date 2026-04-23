import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './LegalPage.css';

function CookiesPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <main className="legal-main">
        <header className="legal-header">
          <p>Informations légales</p>
          <h1>Politique de cookies</h1>
          <span>Dernière mise à jour : 23 avril 2026</span>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Qu’est-ce qu’un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil lors de la consultation d’un site. Il
              permet de mémoriser certaines informations de navigation.
            </p>
          </section>

          <section>
            <h2>2. Cookies utilisés sur lookzeno.com</h2>
            <ul className="legal-list">
              <li>Cookies strictement nécessaires au fonctionnement technique du site.</li>
              <li>Cookies de préférence (si activés) pour améliorer l’expérience utilisateur.</li>
              <li>Cookies de mesure d’audience (si activés), pour statistiques anonymisées.</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalités</h2>
            <ul className="legal-list">
              <li>Assurer le bon fonctionnement des pages et du panier.</li>
              <li>Conserver vos préférences d’affichage lorsque nécessaire.</li>
              <li>Mesurer la fréquentation pour améliorer le site.</li>
            </ul>
          </section>

          <section>
            <h2>4. Durée de conservation</h2>
            <p>
              Les cookies sont conservés pour une durée limitée et proportionnée à leur finalité. Les durées exactes
              peuvent varier selon la catégorie de cookie et le prestataire concerné.
            </p>
          </section>

          <section>
            <h2>5. Gestion de vos préférences</h2>
            <p>
              Vous pouvez configurer votre navigateur pour bloquer, supprimer ou limiter les cookies. Le blocage des
              cookies techniques peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2>6. Cookies tiers</h2>
            <p>
              Certains services externes intégrés au site peuvent déposer leurs propres cookies. Dans ce cas, leurs
              politiques respectives s’appliquent en complément de la présente politique.
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              Pour toute question liée aux cookies ou à vos données personnelles, contactez-nous à
              <a href="mailto:contact@lookzeno.com"> contact@lookzeno.com</a>.
            </p>
          </section>
        </article>

        <footer className="legal-footer">
          <p>
            <Link to="/politique-confidentialite">Politique de confidentialité</Link> ·{' '}
            <Link to="/conditions-generales">Conditions générales</Link> ·{' '}
            <Link to="/politique-cookies">Politique de cookies</Link> ·{' '}
            <Link to="/mentions-legales">Mentions légales</Link>
          </p>
          <p>© 2026 LookZeno · lookzeno.com</p>
        </footer>
      </main>
    </div>
  );
}

export default CookiesPage;
