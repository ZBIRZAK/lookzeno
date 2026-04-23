import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './LegalPage.css';

function TermsPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <main className="legal-main">
        <header className="legal-header">
          <p>Informations légales</p>
          <h1>Conditions générales</h1>
          <span>Dernière mise à jour : 23 avril 2026</span>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Objet</h2>
            <p>
              Les présentes conditions générales régissent l’utilisation du site <strong>lookzeno.com</strong> ainsi que
              les commandes passées auprès de LookZeno.
            </p>
          </section>

          <section>
            <h2>2. Produits</h2>
            <p>
              Les produits présentés sur le site sont décrits avec la plus grande exactitude possible. Des variations
              mineures (couleur, rendu visuel, finitions) peuvent exister selon les écrans et les séries de production.
            </p>
          </section>

          <section>
            <h2>3. Prix</h2>
            <p>
              Les prix affichés sont exprimés en dirham marocain (MAD). LookZeno se réserve le droit de modifier les
              prix à tout moment; le prix applicable est celui affiché au moment de la commande.
            </p>
          </section>

          <section>
            <h2>4. Commandes</h2>
            <p>
              La commande est considérée comme validée après confirmation via les canaux proposés (notamment WhatsApp)
              et selon les informations fournies par le client.
            </p>
          </section>

          <section>
            <h2>5. Paiement</h2>
            <p>
              Les modalités de paiement sont précisées au moment de la confirmation de la commande. En cas
              d’indisponibilité ou d’anomalie, LookZeno peut annuler ou ajuster la commande après information du client.
            </p>
          </section>

          <section>
            <h2>6. Livraison</h2>
            <p>
              Les délais de livraison sont donnés à titre indicatif. Un retard raisonnable ne peut donner lieu à des
              dommages automatiques, sauf disposition légale contraire.
            </p>
          </section>

          <section>
            <h2>7. Retours et échanges</h2>
            <p>
              Les retours/échanges sont possibles selon la politique annoncée sur le site, pour les articles non portés
              et dans leur état d’origine, hors exceptions liées à la personnalisation.
            </p>
          </section>

          <section>
            <h2>8. Personnalisation</h2>
            <p>
              Le client garantit disposer des droits nécessaires sur les logos, textes ou visuels transmis. LookZeno
              peut refuser tout contenu non conforme à la loi ou aux droits de tiers.
            </p>
          </section>

          <section>
            <h2>9. Propriété intellectuelle</h2>
            <p>
              Les éléments du site (marque, visuels, textes, design) sont protégés. Toute reproduction non autorisée est
              interdite.
            </p>
          </section>

          <section>
            <h2>10. Droit applicable</h2>
            <p>
              Les présentes conditions sont soumises au droit applicable au Maroc. En cas de litige, une solution
              amiable est recherchée en priorité.
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

export default TermsPage;
