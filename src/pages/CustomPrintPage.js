import { useMemo, useRef, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import './CustomPrintPage.css';
import hoodieImg from '../assets/pdp/rec-2.jpg';
import { createCustomPrintRequest, isSupabaseConfigured } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const sides = [
  { id: 'front', label: 'Avant' },
  { id: 'back', label: 'Arrière' },
  { id: 'left', label: 'Manche gauche' },
  { id: 'right', label: 'Manche droite' }
];

const tshirtMockups = {
  front: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Wikipedia_25_Tshirt_white_%28front%29.png',
  back: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Wikipedia_25_Tshirt_white_%28back%29.png',
  sleeve: 'https://upload.wikimedia.org/wikipedia/commons/5/55/T-shirt.png'
};

const products = {
  tshirt: {
    id: 'tshirt',
    name: 'T-shirt personnalisé',
    basePrice: 34,
    sides: {
      front: { image: tshirtMockups.front, zone: { xMin: 22, xMax: 78, yMin: 24, yMax: 82 } },
      back: { image: tshirtMockups.back, zone: { xMin: 22, xMax: 78, yMin: 22, yMax: 82 } },
      left: { image: tshirtMockups.sleeve, zone: { xMin: 7, xMax: 30, yMin: 28, yMax: 56 } },
      right: { image: tshirtMockups.sleeve, zone: { xMin: 70, xMax: 93, yMin: 28, yMax: 56 } }
    }
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie personnalisé',
    basePrice: 68,
    sides: {
      front: { image: hoodieImg, zone: { xMin: 22, xMax: 78, yMin: 24, yMax: 86 } },
      back: { image: hoodieImg, zone: { xMin: 22, xMax: 78, yMin: 24, yMax: 86 } },
      left: { image: hoodieImg, zone: { xMin: 10, xMax: 38, yMin: 22, yMax: 80 } },
      right: { image: hoodieImg, zone: { xMin: 62, xMax: 90, yMin: 22, yMax: 80 } }
    }
  }
};

const defaultSideDesign = {
  x: 50,
  y: 42,
  width: 24,
  rotation: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildSideDesigns() {
  return sides.reduce((acc, side) => {
    acc[side.id] = { ...defaultSideDesign };
    return acc;
  }, {});
}

function CustomPrintPage() {
  const previewRef = useRef(null);
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });

  const [productType, setProductType] = useState('tshirt');
  const [activeSide, setActiveSide] = useState('front');
  const [logoSrc, setLogoSrc] = useState('');
  const [logoName, setLogoName] = useState('');
  const [designBySide, setDesignBySide] = useState(buildSideDesigns);
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [submitError, setSubmitError] = useState('');

  const activeProduct = products[productType];
  const activeSideData = activeProduct.sides[activeSide];
  const activeDesign = designBySide[activeSide];
  const activeZone = activeSideData.zone;

  const totalPrice = useMemo(() => activeProduct.basePrice * qty, [activeProduct.basePrice, qty]);

  const updateActiveDesign = (patch) => {
    setDesignBySide((current) => ({
      ...current,
      [activeSide]: {
        ...current[activeSide],
        ...patch
      }
    }));
  };

  const normalizeInsideZone = (nextX, nextY, nextWidth) => {
    const half = nextWidth / 2;
    const xMin = activeZone.xMin + half;
    const xMax = activeZone.xMax - half;
    const yMin = activeZone.yMin + half;
    const yMax = activeZone.yMax - half;

    return {
      x: clamp(nextX, xMin, xMax),
      y: clamp(nextY, yMin, yMax)
    };
  };

  const onUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoSrc(String(reader.result));
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const startDrag = (event) => {
    if (!logoSrc || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    const logoCenterX = rect.left + (activeDesign.x / 100) * rect.width;
    const logoCenterY = rect.top + (activeDesign.y / 100) * rect.height;

    dragRef.current = {
      active: true,
      offsetX: event.clientX - logoCenterX,
      offsetY: event.clientY - logoCenterY
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const duringDrag = (event) => {
    if (!dragRef.current.active || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    const rawX = ((event.clientX - dragRef.current.offsetX - rect.left) / rect.width) * 100;
    const rawY = ((event.clientY - dragRef.current.offsetY - rect.top) / rect.height) * 100;
    const normalized = normalizeInsideZone(rawX, rawY, activeDesign.width);

    updateActiveDesign({ x: normalized.x, y: normalized.y });
  };

  const stopDrag = () => {
    dragRef.current.active = false;
  };

  const onWidthChange = (nextWidth) => {
    const normalized = normalizeInsideZone(activeDesign.x, activeDesign.y, nextWidth);
    updateActiveDesign({ width: nextWidth, x: normalized.x, y: normalized.y });
  };

  const resetActiveSide = () => {
    setDesignBySide((current) => ({
      ...current,
      [activeSide]: { ...defaultSideDesign }
    }));
  };

  const submitDesignRequest = async () => {
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setSubmitError('Veuillez ajouter votre nom et votre numéro de téléphone.');
      return;
    }

    setSubmitError('');
    setSubmitNote('');
    setIsSubmitting(true);

    const { error } = await createCustomPrintRequest({
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      productType,
      quantity: qty,
      logoName,
      designBySide: {
        ...designBySide,
        hasLogo: Boolean(logoSrc)
      }
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError("Impossible d'enregistrer votre demande. Réessayez.");
      return;
    }

    setSubmitNote(
      isSupabaseConfigured
        ? 'Demande personnalisée enregistrée. Nous vous contacterons bientôt.'
        : 'Demande prête. Ajoutez les clés Supabase pour activer la sauvegarde backend.'
    );
  };

  return (
    <div className="custom-print-page" id="top">
      <SiteHeader />

      <main className="custom-main">
        <section className="custom-intro">
          <p>Studio personnalisé</p>
          <h1>Imprimez sur chaque côté</h1>
          <span>Choisissez un côté, importez votre logo et placez-le dans les zones imprimables.</span>
        </section>

        <section className="custom-layout">
          <aside className="custom-controls">
            <h2>Contrôles du design</h2>

            <label htmlFor="productType">
              Produit
              <select
                id="productType"
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  setActiveSide('front');
                }}
              >
                <option value="tshirt">T-shirt</option>
                <option value="hoodie">Hoodie</option>
              </select>
            </label>

            <div className="side-switcher" role="tablist" aria-label="Côté du produit">
              {sides.map((side) => (
                <button
                  key={side.id}
                  type="button"
                  className={activeSide === side.id ? 'active' : ''}
                  onClick={() => setActiveSide(side.id)}
                  aria-pressed={activeSide === side.id}
                >
                  {side.label}
                </button>
              ))}
            </div>

            <label htmlFor="logoUpload" className="upload-field">
              Importer le logo
              <input id="logoUpload" type="file" accept="image/*" onChange={onUpload} />
              <small>{logoName || 'PNG recommandé avec fond transparent.'}</small>
            </label>

            <label htmlFor="logoWidth">
              Taille du logo : {activeDesign.width}%
              <input
                id="logoWidth"
                type="range"
                min="10"
                max="60"
                step="1"
                value={activeDesign.width}
                onChange={(e) => onWidthChange(Number(e.target.value))}
              />
            </label>

            <label htmlFor="logoRotation">
              Rotation : {activeDesign.rotation}°
              <input
                id="logoRotation"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={activeDesign.rotation}
                onChange={(e) => updateActiveDesign({ rotation: Number(e.target.value) })}
              />
            </label>

            <label htmlFor="customQty">
              Quantité
              <input
                id="customQty"
                type="number"
                min="1"
                max="30"
                value={qty}
                onChange={(e) => setQty(clamp(Number(e.target.value) || 1, 1, 30))}
              />
            </label>

            <label htmlFor="customerName">
              Nom du client
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Votre nom complet"
              />
            </label>

            <label htmlFor="customerPhone">
              Numéro de téléphone
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+212..."
              />
            </label>

            <div className="control-row">
              <button
                type="button"
                className="remove-logo"
                onClick={() => {
                  setLogoSrc('');
                  setLogoName('');
                }}
                disabled={!logoSrc}
              >
                Supprimer le logo
              </button>
              <button type="button" className="reset-side" onClick={resetActiveSide}>
                Réinitialiser le côté
              </button>
            </div>

            <div className="custom-summary">
              <p>{activeProduct.name}</p>
              <strong>{formatMAD(totalPrice)}</strong>
            </div>

            <button
              type="button"
              className="save-request"
              onClick={submitDesignRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la demande personnalisée'}
            </button>

            {submitError ? <p className="submit-error">{submitError}</p> : null}
            {submitNote ? <p className="submit-note">{submitNote}</p> : null}
          </aside>

          <section className="custom-preview-wrap">
            <h2>Aperçu en direct - {sides.find((s) => s.id === activeSide)?.label}</h2>
            <div
              className="custom-preview"
              ref={previewRef}
              onPointerMove={duringDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onPointerLeave={stopDrag}
            >
              <img
                src={activeSideData.image}
                alt={`${activeProduct.name} ${activeSide}`}
                className={`base-product side-${activeSide}`}
              />

              <div
                className="print-zone"
                style={{
                  left: `${activeZone.xMin}%`,
                  top: `${activeZone.yMin}%`,
                  width: `${activeZone.xMax - activeZone.xMin}%`,
                  height: `${activeZone.yMax - activeZone.yMin}%`
                }}
                aria-hidden="true"
              />

              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo importé"
                  className="logo-layer"
                  style={{
                    left: `${activeDesign.x}%`,
                    top: `${activeDesign.y}%`,
                    width: `${activeDesign.width}%`,
                    transform: `translate(-50%, -50%) rotate(${activeDesign.rotation}deg)`
                  }}
                  onPointerDown={startDrag}
                />
              ) : (
                <div className="empty-logo-hint">Importez un logo pour commencer.</div>
              )}
            </div>

            <p className="drag-hint">
              Glissez votre logo dans la zone imprimable en pointillés.
            </p>
          </section>
        </section>
      </main>
    </div>
  );
}

export default CustomPrintPage;
