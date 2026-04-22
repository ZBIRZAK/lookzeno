import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SiteHeader from '../components/SiteHeader';
import './CartPage.css';
import { createOrderRecord, isSupabaseConfigured } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const STORE_WHATSAPP_NUMBER = (process.env.REACT_APP_STORE_WHATSAPP_NUMBER || '').trim();
const BLOCKED_WHATSAPP_NUMBERS = new Set(['212600000000']);

function CartPage() {
  const { items, subtotal, totalCount, updateQty, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [backendNote, setBackendNote] = useState('');

  const handleOrderOnWhatsApp = async () => {
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setFormError('Veuillez ajouter votre nom et votre numéro de téléphone.');
      return;
    }

    const whatsappTarget = STORE_WHATSAPP_NUMBER.replace(/\D/g, '').replace(/^00/, '');
    if (!/^[1-9]\d{7,14}$/.test(whatsappTarget) || BLOCKED_WHATSAPP_NUMBERS.has(whatsappTarget)) {
      setFormError("Le numéro WhatsApp de la boutique n'est pas configuré correctement.");
      return;
    }

    setIsSubmittingOrder(true);
    setBackendNote('');

    try {
      const { error } = await createOrderRecord({
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        items,
        subtotal
      });

      if (error) {
        setBackendNote("Commande envoyée sur WhatsApp, mais l'enregistrement en base a échoué.");
      } else if (isSupabaseConfigured) {
        setBackendNote('Commande également enregistrée dans le backend.');
      } else {
        setBackendNote('Commande envoyée sur WhatsApp. Configuration backend en attente.');
      }
    } finally {
      setIsSubmittingOrder(false);
    }

    const lines = [
      'Nouvelle commande LookZeno',
      '',
      `Nom : ${trimmedName}`,
      `Téléphone : ${trimmedPhone}`,
      '',
      'Articles :'
    ];

    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.name}`,
        `   Taille : ${item.size}`,
        `   Qté : ${item.qty}`,
        `   Prix : ${formatMAD(item.price * item.qty)}`
      );
    });

    lines.push('', `Sous-total : ${formatMAD(subtotal)}`);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${whatsappTarget}?text=${text}`, '_blank', 'noopener,noreferrer');
    setFormError('');
  };

  return (
    <div className="cart-page">
      <SiteHeader />

      <main className="cart-main">
        <section className="cart-head">
          <h1>Votre panier</h1>
          <p>{totalCount} article(s)</p>
        </section>

        {items.length === 0 ? (
          <section className="cart-empty">
            <h2>Votre panier est vide</h2>
            <p>Ajoutez votre premier article pour commencer.</p>
            <Link to="/products">Voir les produits</Link>
          </section>
        ) : (
          <section className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <article key={`${item.id}-${item.size}`} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-content">
                    <h3>{item.name}</h3>
                    <p>Taille : {item.size}</p>
                    <strong>{formatMAD(item.price * item.qty)}</strong>
                  </div>
                  <div className="cart-item-controls">
                    <div className="qty-stepper" aria-label="quantité">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="remove"
                      onClick={() => removeItem(item.id, item.size)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Détails de la commande</h2>
              <div>
                <span>Sous-total</span>
                <strong>{formatMAD(subtotal)}</strong>
              </div>
              <p>Remplissez vos informations puis confirmez la commande sur WhatsApp.</p>

              <label className="field" htmlFor="orderName">
                Nom
                <input
                  id="orderName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </label>

              <label className="field" htmlFor="orderPhone">
                Numéro de téléphone
                <input
                  id="orderPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+212..."
                />
              </label>

              {formError ? <p className="form-error">{formError}</p> : null}
              {backendNote ? <p className="backend-note">{backendNote}</p> : null}

              <button
                type="button"
                className="whatsapp-order"
                onClick={handleOrderOnWhatsApp}
                disabled={isSubmittingOrder}
              >
                {isSubmittingOrder ? 'Envoi...' : 'Commander sur WhatsApp'}
              </button>
              <button type="button" className="clear" onClick={clearCart}>
                Vider le panier
              </button>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

export default CartPage;
