import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './LegalPage.css';

function LegalNoticePage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <main className="legal-main">
        <header className="legal-header">
          <p>Informations légales</p>
          <h1>Mentions légales</h1>
          <span>Dernière mise à jour : 23 avril 2026</span>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Éditeur du site</h2>
            <p>
              Le site <strong>lookzeno.com</strong> est édité par <strong>LookZeno</strong>.
            </p>
            <ul className="legal-list">
              <li>Raison sociale: LookZeno (à compléter)</li>
              <li>Forme juridique: (à compléter)</li>
              <li>Siège social: (à compléter)</li>
              <li>Identifiant fiscal/RC/ICE: (à compléter)</li>
              <li>E-mail de contact: contact@lookzeno.com</li>
            </ul>
          </section>

          <section>
            <h2>2. Directeur de publication</h2>
            <p>Le directeur de publication est le représentant légal de LookZeno.</p>
          </section>

          <section>
            <h2>3. Hébergement</h2>
            <p>Le site est hébergé par des prestataires cloud (Vercel et Supabase).</p>
            <ul className="legal-list">
              <li>Hébergement front-end: Vercel Inc.</li>
              <li>Base de données et stockage: Supabase</li>
            </ul>
          </section>

          <section>
            <h2>4. Propriété intellectuelle</h2>
            <p>
              Tous les contenus du site (textes, images, vidéos, éléments graphiques, logo, marque) sont protégés par
              le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée
              est interdite.
            </p>
          </section>

          <section>
            <h2>5. Responsabilité</h2>
            <p>
              LookZeno met en œuvre des efforts raisonnables pour assurer l’exactitude des informations publiées.
              Toutefois, le site peut contenir des erreurs ou omissions. L’utilisateur reste responsable de l’usage des
              informations fournies.
            </p>
          </section>

          <section>
            <h2>6. Liens externes</h2>
            <p>
              Le site peut contenir des liens vers des services tiers. LookZeno n’exerce pas de contrôle sur ces
              services et décline toute responsabilité quant à leur contenu ou leur politique de confidentialité.
            </p>
          </section>

          <section>
            <h2>7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit marocain. En cas de litige, une résolution amiable
              est privilégiée avant toute action contentieuse.
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

export default LegalNoticePage;
