import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import './LegalPage.css';

function PrivacyPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <main className="legal-main">
        <header className="legal-header">
          <p>Informations légales</p>
          <h1>Politique de confidentialité</h1>
          <span>Dernière mise à jour : 23 avril 2026</span>
        </header>

        <article className="legal-content">
          <section>
            <h2>1. Responsable du traitement</h2>
            <p>
              Le site <strong>lookzeno.com</strong> est exploité par LookZeno. Pour toute question relative à la vie
              privée, vous pouvez nous contacter via le formulaire de contact du site.
            </p>
          </section>

          <section>
            <h2>2. Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au traitement des commandes et demandes:</p>
            <ul className="legal-list">
              <li>Nom et numéro de téléphone fournis lors de la commande.</li>
              <li>Contenu de la commande (produits, tailles, quantités, prix).</li>
              <li>Demandes d’impression personnalisée et informations associées.</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalités</h2>
            <ul className="legal-list">
              <li>Traiter et suivre vos commandes.</li>
              <li>Vous contacter à propos de votre commande ou de votre demande personnalisée.</li>
              <li>Améliorer la qualité de nos services et la gestion du catalogue.</li>
            </ul>
          </section>

          <section>
            <h2>4. Base légale</h2>
            <p>
              Le traitement est nécessaire à l’exécution de votre demande (commande ou service personnalisé) et à
              l’intérêt légitime de LookZeno pour la gestion de son activité.
            </p>
          </section>

          <section>
            <h2>5. Durée de conservation</h2>
            <p>
              Les données sont conservées pendant la durée nécessaire au suivi commercial et administratif des
              commandes, puis archivées ou supprimées selon les obligations applicables.
            </p>
          </section>

          <section>
            <h2>6. Partage des données</h2>
            <p>
              Vos données ne sont pas vendues. Elles peuvent être traitées par nos prestataires techniques (hébergement
              et base de données) uniquement pour faire fonctionner le service.
            </p>
          </section>

          <section>
            <h2>7. Sécurité</h2>
            <p>
              Nous mettons en place des mesures techniques et organisationnelles raisonnables pour protéger les données
              contre l’accès non autorisé, la perte ou l’altération.
            </p>
          </section>

          <section>
            <h2>8. Vos droits</h2>
            <p>
              Vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles, sous réserve
              des obligations légales de conservation.
            </p>
          </section>

          <section>
            <h2>9. Cookies et mesures d’audience</h2>
            <p>
              Le site peut utiliser des cookies techniques nécessaires à son fonctionnement. Toute activation d’outils
              analytiques ou marketing sera encadrée par des informations complémentaires.
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

export default PrivacyPage;
