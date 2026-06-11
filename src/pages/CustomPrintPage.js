import { useMemo, useRef, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import './CustomPrintPage.css';
import { createCustomPrintRequest, isSupabaseConfigured } from '../services/backendService';
import { formatMAD } from '../utils/currency';

const PRODUCT_OPTIONS = {
  tshirt: {
    id: 'tshirt',
    name: 'T-shirt personnalisé',
    basePrice: 34,
    placements: [
      {
        id: 'front',
        label: 'Avant',
        image: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Wikipedia_25_Tshirt_white_%28front%29.png',
        zone: { xMin: 22, xMax: 78, yMin: 24, yMax: 82 }
      },
      {
        id: 'back',
        label: 'Arrière',
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Wikipedia_25_Tshirt_white_%28back%29.png',
        zone: { xMin: 22, xMax: 78, yMin: 22, yMax: 82 }
      },
      {
        id: 'left_sleeve',
        label: 'Manche gauche',
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/55/T-shirt.png',
        zone: { xMin: 6, xMax: 32, yMin: 24, yMax: 58 }
      },
      {
        id: 'right_sleeve',
        label: 'Manche droite',
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/55/T-shirt.png',
        zone: { xMin: 68, xMax: 94, yMin: 24, yMax: 58 }
      }
    ]
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie personnalisé',
    basePrice: 68,
    placements: [
      {
        id: 'front',
        label: 'Avant',
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/WP_hoodie_FRONT_Merchandise_shots-36.jpg',
        zone: { xMin: 24, xMax: 76, yMin: 23, yMax: 84 }
      },
      {
        id: 'back',
        label: 'Arrière',
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/77/WP_hoodie_BACK_Merchandise_shots-39.jpg',
        zone: { xMin: 26, xMax: 74, yMin: 26, yMax: 82 }
      },
      {
        id: 'left_sleeve',
        label: 'Manche gauche',
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/WP_hoodie_FRONT_Merchandise_shots-36.jpg',
        zone: { xMin: 8, xMax: 30, yMin: 30, yMax: 73 }
      },
      {
        id: 'right_sleeve',
        label: 'Manche droite',
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/WP_hoodie_FRONT_Merchandise_shots-36.jpg',
        zone: { xMin: 70, xMax: 92, yMin: 30, yMax: 73 }
      }
    ]
  },
  cap: {
    id: 'cap',
    name: 'Casquette personnalisée',
    basePrice: 26,
    placements: [
      {
        id: 'front',
        label: 'Face avant',
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Baseball_cap.png',
        zone: { xMin: 34, xMax: 64, yMin: 20, yMax: 46 }
      },
      {
        id: 'left',
        label: 'Côté gauche',
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Baseball_cap_highres.png',
        zone: { xMin: 20, xMax: 44, yMin: 22, yMax: 48 }
      },
      {
        id: 'right',
        label: 'Côté droit',
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Baseball_cap_highres.png',
        zone: { xMin: 56, xMax: 80, yMin: 22, yMax: 48 }
      },
      {
        id: 'back',
        label: 'Arrière',
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Baseball_cap.png',
        zone: { xMin: 38, xMax: 62, yMin: 30, yMax: 52 }
      }
    ]
  }
};

const DEFAULT_PLACEMENT_DESIGN = {
  x: 50,
  y: 42,
  width: 24,
  rotation: 0,
  logoSrc: '',
  logoName: ''
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildPlacementDesigns(product) {
  return product.placements.reduce((acc, placement) => {
    acc[placement.id] = { ...DEFAULT_PLACEMENT_DESIGN };
    return acc;
  }, {});
}

function CustomPrintPage() {
  const previewRef = useRef(null);
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });

  const [productType, setProductType] = useState('tshirt');
  const [placementId, setPlacementId] = useState('front');
  const [placementDesigns, setPlacementDesigns] = useState(() =>
    buildPlacementDesigns(PRODUCT_OPTIONS.tshirt)
  );
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [submitError, setSubmitError] = useState('');

  const activeProduct = PRODUCT_OPTIONS[productType];
  const activePlacement =
    activeProduct.placements.find((placement) => placement.id === placementId) ||
    activeProduct.placements[0];
  const activeDesign = placementDesigns[activePlacement.id] || DEFAULT_PLACEMENT_DESIGN;
  const totalPrice = useMemo(() => activeProduct.basePrice * qty, [activeProduct.basePrice, qty]);
  const customizedCount = activeProduct.placements.filter(
    (placement) => Boolean(placementDesigns[placement.id]?.logoSrc)
  ).length;

  const updateActivePlacement = (patch) => {
    setPlacementDesigns((current) => ({
      ...current,
      [activePlacement.id]: {
        ...current[activePlacement.id],
        ...patch
      }
    }));
  };

  const normalizeInsideZone = (x, y, width) => {
    const half = width / 2;
    const xMin = activePlacement.zone.xMin + half;
    const xMax = activePlacement.zone.xMax - half;
    const yMin = activePlacement.zone.yMin + half;
    const yMax = activePlacement.zone.yMax - half;

    return {
      x: clamp(x, xMin, xMax),
      y: clamp(y, yMin, yMax)
    };
  };

  const onProductChange = (nextProductType) => {
    const nextProduct = PRODUCT_OPTIONS[nextProductType];
    setProductType(nextProductType);
    setPlacementId(nextProduct.placements[0]?.id || 'front');
    setPlacementDesigns(buildPlacementDesigns(nextProduct));
  };

  const onUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateActivePlacement({
        logoSrc: String(reader.result),
        logoName: file.name
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const startDrag = (event) => {
    if (!activeDesign.logoSrc || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    const centerX = rect.left + (activeDesign.x / 100) * rect.width;
    const centerY = rect.top + (activeDesign.y / 100) * rect.height;

    dragRef.current = {
      active: true,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY
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

    updateActivePlacement({
      x: normalized.x,
      y: normalized.y
    });
  };

  const stopDrag = () => {
    dragRef.current.active = false;
  };

  const onWidthChange = (nextWidth) => {
    const normalized = normalizeInsideZone(activeDesign.x, activeDesign.y, nextWidth);
    updateActivePlacement({
      width: nextWidth,
      x: normalized.x,
      y: normalized.y
    });
  };

  const resetPlacement = () => {
    setPlacementDesigns((current) => ({
      ...current,
      [activePlacement.id]: {
        ...DEFAULT_PLACEMENT_DESIGN,
        logoSrc: current[activePlacement.id]?.logoSrc || '',
        logoName: current[activePlacement.id]?.logoName || ''
      }
    }));
  };

  const removeDesign = () => {
    updateActivePlacement({
      logoSrc: '',
      logoName: '',
      x: DEFAULT_PLACEMENT_DESIGN.x,
      y: DEFAULT_PLACEMENT_DESIGN.y,
      width: DEFAULT_PLACEMENT_DESIGN.width,
      rotation: DEFAULT_PLACEMENT_DESIGN.rotation
    });
  };

  const submitDesignRequest = async () => {
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || !trimmedPhone) {
      setSubmitError('Veuillez ajouter votre nom et votre numéro de téléphone.');
      return;
    }

    if (customizedCount === 0) {
      setSubmitError("Ajoutez au moins un design avant d'envoyer la demande.");
      return;
    }

    setSubmitError('');
    setSubmitNote('');
    setIsSubmitting(true);

    const logoNames = activeProduct.placements
      .map((placement) => placementDesigns[placement.id]?.logoName)
      .filter(Boolean)
      .join(', ');

    const { error } = await createCustomPrintRequest({
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      productType,
      quantity: qty,
      logoName: logoNames || null,
      designBySide: {
        placements: placementDesigns,
        product: activeProduct.id
      }
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError("Impossible d'enregistrer votre demande. Réessayez.");
      return;
    }

    setSubmitNote(
      isSupabaseConfigured
        ? 'Demande personnalisée envoyée. Nous vous contacterons bientôt.'
        : 'Demande prête. Ajoutez les clés Supabase pour activer la sauvegarde backend.'
    );
  };

  return (
    <div className="custom-print-page" id="top">
      <SiteHeader />

      <main className="custom-main">
        <section className="custom-intro">
          <p>Studio personnalisé</p>
          <h1>Créez votre impression en 3 étapes</h1>
          <span>Choisissez le produit, sélectionnez la zone à imprimer, puis placez votre design en glissant.</span>
        </section>

        <section className="custom-layout">
          <aside className="custom-controls">
            <h2>Configuration</h2>

            <label htmlFor="productType">
              1. Produit
              <select
                id="productType"
                value={productType}
                onChange={(event) => onProductChange(event.target.value)}
              >
                <option value="tshirt">T-shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="cap">Casquette</option>
              </select>
            </label>

            <p className="control-subtitle">2. Emplacement d'impression</p>
            <div className="side-switcher" role="tablist" aria-label="Emplacements du produit">
              {activeProduct.placements.map((placement) => {
                const done = Boolean(placementDesigns[placement.id]?.logoSrc);
                return (
                  <button
                    key={placement.id}
                    type="button"
                    className={placement.id === activePlacement.id ? 'active' : ''}
                    onClick={() => setPlacementId(placement.id)}
                    aria-pressed={placement.id === activePlacement.id}
                  >
                    {placement.label}
                    <small>{done ? 'Ajouté' : 'Vide'}</small>
                  </button>
                );
              })}
            </div>

            <label htmlFor="logoUpload">
              3. Upload du design ({activePlacement.label})
              <input id="logoUpload" type="file" accept="image/*" onChange={onUpload} />
              <small>{activeDesign.logoName || 'PNG transparent recommandé.'}</small>
            </label>

            <label htmlFor="logoWidth">
              Taille: {activeDesign.width}%
              <input
                id="logoWidth"
                type="range"
                min="10"
                max="60"
                step="1"
                value={activeDesign.width}
                onChange={(event) => onWidthChange(Number(event.target.value))}
              />
            </label>

            <label htmlFor="logoRotation">
              Rotation: {activeDesign.rotation}°
              <input
                id="logoRotation"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={activeDesign.rotation}
                onChange={(event) => updateActivePlacement({ rotation: Number(event.target.value) })}
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
                onChange={(event) => setQty(clamp(Number(event.target.value) || 1, 1, 30))}
              />
            </label>

            <label htmlFor="customerName">
              Nom du client
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Votre nom complet"
              />
            </label>

            <label htmlFor="customerPhone">
              Numéro de téléphone
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+212..."
              />
            </label>

            <div className="control-row">
              <button
                type="button"
                className="remove-logo"
                onClick={removeDesign}
                disabled={!activeDesign.logoSrc}
              >
                Supprimer le design
              </button>
              <button type="button" className="reset-side" onClick={resetPlacement}>
                Réinitialiser la position
              </button>
            </div>

            <div className="custom-summary">
              <p>
                {activeProduct.name}
                <small>{customizedCount} zone(s) personnalisée(s)</small>
              </p>
              <strong>{formatMAD(totalPrice)}</strong>
            </div>

            <button
              type="button"
              className="save-request"
              onClick={submitDesignRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer la demande personnalisée'}
            </button>

            {submitError ? <p className="submit-error">{submitError}</p> : null}
            {submitNote ? <p className="submit-note">{submitNote}</p> : null}
          </aside>

          <section className="custom-preview-wrap">
            <h2>Aperçu: {activePlacement.label}</h2>
            <div
              className="custom-preview"
              ref={previewRef}
              onPointerMove={duringDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onPointerLeave={stopDrag}
            >
              <img
                src={activePlacement.image}
                alt={`${activeProduct.name} ${activePlacement.label}`}
                className={`base-product side-${activePlacement.id}`}
              />

              <div
                className="print-zone"
                style={{
                  left: `${activePlacement.zone.xMin}%`,
                  top: `${activePlacement.zone.yMin}%`,
                  width: `${activePlacement.zone.xMax - activePlacement.zone.xMin}%`,
                  height: `${activePlacement.zone.yMax - activePlacement.zone.yMin}%`
                }}
                aria-hidden="true"
              />

              {activeDesign.logoSrc ? (
                <img
                  src={activeDesign.logoSrc}
                  alt="Design importé"
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
                <div className="empty-logo-hint">Importez un design pour commencer.</div>
              )}
            </div>
            <p className="drag-hint">Glissez le design dans la zone en pointillés.</p>
          </section>
        </section>
      </main>
    </div>
  );
}

export default CustomPrintPage;
