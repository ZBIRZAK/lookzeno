import { useCallback, useEffect, useMemo, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import {
  addProductImageRecord,
  bulkUpdateProducts,
  deleteCategoryRecord,
  deleteHeroSlideRecord,
  deleteProductImageRecord,
  deleteProductRecord,
  deleteTagRecord,
  fetchDashboardData,
  getDashboardSession,
  isSupabaseConfigured,
  moveProductImageToTop,
  setPrimaryProductImage,
  signInDashboard,
  signOutDashboard,
  subscribeDashboardAuth,
  toggleProductImageActive,
  toggleHeroSlideActive,
  toggleProductActive,
  updateProductImageRecord,
  uploadHeroImage,
  uploadProductImage,
  uploadProductMedia,
  upsertCategoryRecord,
  upsertHeroSlideRecord,
  upsertProductRecord,
  upsertTagRecord
} from '../services/backendService';
import { formatMAD } from '../utils/currency';
import './DashboardPage.css';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createDraftImageId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInfoSectionDraft(title = '', content = '') {
  return {
    id: `info-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    content
  };
}

const DEFAULT_INFO_SECTIONS = [
  createInfoSectionDraft('Wash and Care Instructions', 'Machine wash cold. Turn garment inside out. Hang dry for best print longevity.'),
  createInfoSectionDraft('More details', '100% cotton. Mid-weight fit. Screen print with premium inks for everyday wear.'),
  createInfoSectionDraft('Quality Guarantee & Returns', '30-day return policy on unworn items. Exchanges available for size adjustments.')
];

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDetailImage, setUploadingDetailImage] = useState(false);
  const [uploadingMediaVideo, setUploadingMediaVideo] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [error, setError] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [tagMessage, setTagMessage] = useState('');
  const [heroMessage, setHeroMessage] = useState('');
  const [productError, setProductError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [tagError, setTagError] = useState('');
  const [heroError, setHeroError] = useState('');

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [savingProductImage, setSavingProductImage] = useState(false);
  const [draftProductImages, setDraftProductImages] = useState([]);
  const [infoSectionsDraft, setInfoSectionsDraft] = useState(DEFAULT_INFO_SECTIONS);
  const [productImageForm, setProductImageForm] = useState({
    image_url: '',
    variant_label: '',
    sort_order: '',
    is_primary: false,
    is_active: true
  });

  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    slug: '',
    category: 'T-Shirts',
    price: '',
    image_url: '',
    media_video_url: '',
    detail_image_url: '',
    detail_section_title: '',
    detail_section_text: '',
    badge: '',
    description: '',
    tags: '',
    sizes: 'S,M,L,XL,2XL',
    is_featured: false,
    is_active: true
  });

  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', slug: '', description: '' });
  const [tagForm, setTagForm] = useState({ id: '', name: '', slug: '' });
  const [heroForm, setHeroForm] = useState({
    id: '',
    title: '',
    image_url: '',
    cta_text: 'Shop Now',
    cta_url: '/products',
    sort_order: 0,
    is_active: true
  });

  const [dashboard, setDashboard] = useState({
    metrics: { totalOrders: 0, totalRevenue: 0, totalCustomRequests: 0, totalProducts: 0 },
    orders: [],
    customRequests: [],
    products: [],
    categories: [],
    tags: [],
    heroSlides: []
  });

  const categoryOptions = useMemo(() => {
    const list = dashboard.categories.map((item) => item.name).filter(Boolean);
    return list.length > 0 ? list : ['T-Shirts', 'Hoodies', 'Casquettes', 'Accessories'];
  }, [dashboard.categories]);

  const clearProductForm = useCallback(() => {
    setProductForm({
      id: '',
      name: '',
      slug: '',
      category: categoryOptions[0] || 'T-Shirts',
      price: '',
      image_url: '',
      media_video_url: '',
      detail_image_url: '',
      detail_section_title: '',
      detail_section_text: '',
      badge: '',
      description: '',
      tags: '',
      sizes: 'S,M,L,XL,2XL',
      is_featured: false,
      is_active: true
    });
    setProductImageForm({
      image_url: '',
      variant_label: '',
      sort_order: '',
      is_primary: false,
      is_active: true
    });
    setInfoSectionsDraft(DEFAULT_INFO_SECTIONS.map((item) => ({ ...item })));
    setDraftProductImages([]);
  }, [categoryOptions]);

  const clearCategoryForm = () => {
    setCategoryForm({ id: '', name: '', slug: '', description: '' });
  };

  const clearTagForm = () => {
    setTagForm({ id: '', name: '', slug: '' });
  };

  const clearHeroForm = () => {
    setHeroForm({
      id: '',
      title: '',
      image_url: '',
      cta_text: 'Shop Now',
      cta_url: '/products',
      sort_order: 0,
      is_active: true
    });
  };

  const loadData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: fetchError } = await fetchDashboardData();

    if (fetchError) {
      setError(fetchError.message || 'Could not load dashboard data.');
      setLoading(false);
      return;
    }

    if (data) {
      setDashboard(data);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (productForm.id) {
      return;
    }
    setProductForm((current) => ({
      ...current,
      image_url: draftProductImages[0]?.image_url || current.image_url
    }));
  }, [draftProductImages, productForm.id]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const { data } = await getDashboardSession();
      if (mounted) {
        setSession(data || null);
        setAuthLoading(false);
      }
    };

    run();

    const unsubscribe = subscribeDashboardAuth((nextSession) => {
      setSession(nextSession);
      setSelectedProductIds([]);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, loadData]);

  const onLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);

    const { error: loginError } = await signInDashboard(loginForm.email, loginForm.password);
    setAuthBusy(false);

    if (loginError) {
      setAuthError(loginError.message || 'Could not sign in.');
    }
  };

  const onLogout = async () => {
    await signOutDashboard();
    setSession(null);
  };

  const onProductInput = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((current) => {
      if (name === 'name') {
        return {
          ...current,
          name: value,
          slug: current.id ? current.slug : slugify(value)
        };
      }

      return {
        ...current,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };

  const onCategoryInput = (event) => {
    const { name, value } = event.target;
    setCategoryForm((current) => {
      if (name === 'name') {
        return {
          ...current,
          name: value,
          slug: current.id ? current.slug : slugify(value)
        };
      }
      return { ...current, [name]: value };
    });
  };

  const onAddInfoSection = () => {
    setInfoSectionsDraft((current) => [...current, createInfoSectionDraft()]);
  };

  const onRemoveInfoSection = (id) => {
    setInfoSectionsDraft((current) => {
      if (current.length <= 1) {
        return [createInfoSectionDraft()];
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const onInfoSectionInput = (id, field, value) => {
    setInfoSectionsDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const onTagInput = (event) => {
    const { name, value } = event.target;
    setTagForm((current) => {
      if (name === 'name') {
        return {
          ...current,
          name: value,
          slug: current.id ? current.slug : slugify(value)
        };
      }
      return { ...current, [name]: value };
    });
  };

  const onProductImageInput = (event) => {
    const { name, value, type, checked } = event.target;
    setProductImageForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onHeroInput = (event) => {
    const { name, value, type, checked } = event.target;
    setHeroForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onUploadProductImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setProductError('');
    setProductMessage('');

    const { data, error: uploadError } = await uploadProductImage(file);
    setUploadingImage(false);

    if (uploadError) {
      setProductError(uploadError.message || 'Could not upload principal image.');
      return;
    }

    if (data?.publicUrl) {
      setProductForm((current) => ({ ...current, image_url: data.publicUrl }));
      setProductMessage('Principal image uploaded.');
    }

    event.target.value = '';
  };

  const onUploadVariantImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSavingProductImage(true);
    setProductError('');
    setProductMessage('');
    const { data, error: uploadError } = await uploadProductImage(file);

    if (uploadError) {
      setSavingProductImage(false);
      setProductError(uploadError.message || 'Could not upload variant image.');
      return;
    }

    if (!data?.publicUrl) {
      setSavingProductImage(false);
      return;
    }

    const variantLabel = productImageForm.variant_label || file.name.replace(/\.[^/.]+$/, '');
    const sortOrderRaw =
      String(productImageForm.sort_order).trim() === ''
        ? nextVariantSortOrder
        : Math.max(0, Number(productImageForm.sort_order || 1) - 1);

    if (!productForm.id) {
      setDraftProductImages((current) => {
        const next = [
          ...current,
          {
            id: createDraftImageId(),
            image_url: data.publicUrl,
            variant_label: variantLabel,
            sort_order: sortOrderRaw,
            is_active: productImageForm.is_active !== false
          }
        ];
        return next.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      });
      setSavingProductImage(false);
      setProductImageForm({
        image_url: '',
        variant_label: '',
        sort_order: '',
        is_primary: false,
        is_active: true
      });
      setProductMessage('Variant image added to draft. Save product to publish.');
      event.target.value = '';
      return;
    }

    const { error: addError } = await addProductImageRecord({
      product_id: productForm.id,
      image_url: data.publicUrl,
      variant_label: variantLabel,
      sort_order: sortOrderRaw,
      is_primary: false,
      is_active: productImageForm.is_active !== false
    });

    setSavingProductImage(false);

    if (addError) {
      setProductError(addError.message || 'Could not save variant image.');
      return;
    }

    setProductImageForm({
      image_url: '',
      variant_label: '',
      sort_order: '',
      is_primary: false,
      is_active: true
    });
    setProductMessage('Variant image uploaded and added.');
    loadData();
    event.target.value = '';
  };

  const onUploadDetailImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingDetailImage(true);
    setProductError('');
    setProductMessage('');

    const { data, error: uploadError } = await uploadProductImage(file);
    setUploadingDetailImage(false);

    if (uploadError) {
      setProductError(uploadError.message || 'Could not upload detail image.');
      return;
    }

    if (data?.publicUrl) {
      setProductForm((current) => ({ ...current, detail_image_url: data.publicUrl }));
      setProductMessage('Detail image uploaded.');
    }

    event.target.value = '';
  };

  const onUploadMediaVideo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingMediaVideo(true);
    setProductError('');
    setProductMessage('');

    const { data, error: uploadError } = await uploadProductMedia(file);
    setUploadingMediaVideo(false);

    if (uploadError) {
      setProductError(uploadError.message || 'Could not upload product video.');
      return;
    }

    if (data?.publicUrl) {
      setProductForm((current) => ({ ...current, media_video_url: data.publicUrl }));
      setProductMessage('Product video uploaded.');
    }

    event.target.value = '';
  };

  const onUploadHeroImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingHeroImage(true);
    setHeroError('');
    const { data, error: uploadError } = await uploadHeroImage(file);
    setUploadingHeroImage(false);

    if (uploadError) {
      setHeroError(uploadError.message || 'Could not upload hero image.');
      return;
    }

    if (data?.publicUrl) {
      setHeroForm((current) => ({ ...current, image_url: data.publicUrl }));
      setHeroMessage('Hero image uploaded.');
    }
  };

  const onEditProduct = (product) => {
    setProductMessage('');
    setProductError('');
    setProductForm({
      id: product.id,
      name: product.name || '',
      slug: product.slug || '',
      category: product.category || categoryOptions[0] || 'T-Shirts',
      price: String(product.price ?? ''),
      image_url: product.image_url || product.image || '',
      media_video_url: product.media_video_url || '',
      detail_image_url: product.detail_image_url || '',
      detail_section_title: product.detail_section_title || '',
      detail_section_text: product.detail_section_text || '',
      badge: product.badge || '',
      description: product.description || '',
      tags: (product.tags || []).join(', '),
      sizes: (product.sizes || ['S', 'M', 'L', 'XL', '2XL']).join(','),
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active)
    });
    setInfoSectionsDraft(
      Array.isArray(product.info_sections) && product.info_sections.length > 0
        ? product.info_sections.map((item) =>
            createInfoSectionDraft(String(item.title || ''), String(item.content || ''))
          )
        : DEFAULT_INFO_SECTIONS.map((item) => ({ ...item }))
    );
    setProductImageForm({
      image_url: '',
      variant_label: '',
      sort_order: '',
      is_primary: false,
      is_active: true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onEditCategory = (category) => {
    setCategoryMessage('');
    setCategoryError('');
    setCategoryForm({
      id: category.id,
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || ''
    });
  };

  const onEditTag = (tag) => {
    setTagMessage('');
    setTagError('');
    setTagForm({ id: tag.id, name: tag.name || '', slug: tag.slug || '' });
  };

  const onEditHeroSlide = (slide) => {
    setHeroMessage('');
    setHeroError('');
    setHeroForm({
      id: slide.id,
      title: slide.title || '',
      image_url: slide.image_url || '',
      cta_text: slide.cta_text || 'Shop Now',
      cta_url: slide.cta_url || '/products',
      sort_order: Number(slide.sort_order || 0),
      is_active: slide.is_active !== false
    });
  };

  const onSaveProduct = async (event) => {
    event.preventDefault();
    setProductMessage('');
    setProductError('');

    if (!productForm.name.trim() || !productForm.slug.trim() || !productForm.price) {
      setProductError('Name, slug and price are required.');
      return;
    }

    const payload = {
      ...productForm,
      info_sections: infoSectionsDraft
        .map((item, idx) => {
          const title = String(item.title || '').trim();
          const content = String(item.content || '').trim();
          if (!title || !content) {
            return null;
          }
          return {
            id: `${slugify(title) || `section-${idx + 1}`}-${idx + 1}`,
            title,
            content
          };
        })
        .filter(Boolean),
      tags: productForm.tags,
      sizes: productForm.sizes
        .split(',')
        .map((size) => size.trim().toUpperCase())
        .filter(Boolean)
    };

    setSavingProduct(true);
    const { data: savedProduct, error: saveError } = await upsertProductRecord(payload);
    setSavingProduct(false);

    if (saveError) {
      setProductError(saveError.message || 'Could not save product.');
      return;
    }

    const isNewProduct = !productForm.id;
    setProductMessage(isNewProduct ? 'Product created. You can now upload variant images below.' : 'Product updated.');
    if (isNewProduct && savedProduct?.id) {
      setProductForm((current) => ({ ...current, id: savedProduct.id }));

      if (draftProductImages.length > 0) {
        const sortedDraft = [...draftProductImages].sort(
          (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
        );

        for (let idx = 0; idx < sortedDraft.length; idx += 1) {
          const draft = sortedDraft[idx];
          await addProductImageRecord({
            product_id: savedProduct.id,
            image_url: draft.image_url,
            variant_label: draft.variant_label,
            sort_order: idx,
            is_primary: idx === 0,
            is_active: draft.is_active !== false
          });
        }
        setDraftProductImages([]);
        setProductMessage('Product created with variant images.');
      }
    }
    loadData();
  };

  const onDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) {
      return;
    }

    setProductMessage('');
    setProductError('');
    const { error: removeError } = await deleteProductRecord(productId);
    if (removeError) {
      setProductError(removeError.message || 'Could not delete product.');
      return;
    }

    setProductMessage('Product deleted.');
    setSelectedProductIds((current) => current.filter((id) => id !== productId));
    loadData();
  };

  const onAddProductImage = async (event) => {
    event.preventDefault();
    setProductMessage('');
    setProductError('');

    if (!productImageForm.image_url.trim()) {
      setProductError('Variant image URL is required.');
      return;
    }

    setSavingProductImage(true);
    if (!productForm.id) {
      const draftOrder =
        String(productImageForm.sort_order).trim() === ''
          ? nextVariantSortOrder
          : Math.max(0, Number(productImageForm.sort_order || 1) - 1);
      setDraftProductImages((current) =>
        [...current, {
          id: createDraftImageId(),
          image_url: productImageForm.image_url,
          variant_label: productImageForm.variant_label,
          sort_order: draftOrder,
          is_active: productImageForm.is_active !== false
        }].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      );
      setSavingProductImage(false);
      setProductMessage('Variant image added to draft. Save product to publish.');
    } else {
      const { error: addError } = await addProductImageRecord({
        product_id: productForm.id,
        image_url: productImageForm.image_url,
        variant_label: productImageForm.variant_label,
        sort_order:
          String(productImageForm.sort_order).trim() === ''
            ? nextVariantSortOrder
            : Math.max(0, Number(productImageForm.sort_order || 1) - 1),
        is_primary: false,
        is_active: productImageForm.is_active !== false
      });
      setSavingProductImage(false);

      if (addError) {
        setProductError(addError.message || 'Could not add product image.');
        return;
      }

      setProductMessage('Product image added.');
      loadData();
    }

    setProductImageForm({
      image_url: '',
      variant_label: '',
      sort_order: '',
      is_primary: false,
      is_active: true
    });
  };

  const onSetPrimaryImage = async (imageId) => {
    if (!productForm.id) {
      setDraftProductImages((current) => {
        const index = current.findIndex((item) => item.id === imageId);
        if (index <= 0) {
          return current;
        }
        const next = [...current];
        const [picked] = next.splice(index, 1);
        next.unshift({ ...picked, sort_order: -1 });
        return next.map((item, idx) => ({ ...item, sort_order: idx }));
      });
      setProductMessage('Draft principal image updated.');
      return;
    }
    setProductMessage('');
    setProductError('');
    const { error: setError } = await setPrimaryProductImage(productForm.id, imageId);
    if (setError) {
      setProductError(setError.message || 'Could not set principal image.');
      return;
    }
    setProductMessage('Principal image updated.');
    loadData();
  };

  const onMoveImageToTop = async (imageId) => {
    if (!productForm.id) {
      setDraftProductImages((current) => {
        const index = current.findIndex((item) => item.id === imageId);
        if (index <= 0) {
          return current;
        }
        const next = [...current];
        const [picked] = next.splice(index, 1);
        next.unshift(picked);
        return next.map((item, idx) => ({ ...item, sort_order: idx }));
      });
      setProductMessage('Draft image moved to top.');
      return;
    }

    setProductMessage('');
    setProductError('');
    const { error: moveError } = await moveProductImageToTop(productForm.id, imageId);
    if (moveError) {
      setProductError(moveError.message || 'Could not move image to top.');
      return;
    }

    setProductMessage('Image moved to top and set as principal.');
    loadData();
  };

  const onToggleProductImage = async (image) => {
    if (!productForm.id) {
      setDraftProductImages((current) =>
        current.map((item) => (item.id === image.id ? { ...item, is_active: !item.is_active } : item))
      );
      setProductMessage(image.is_active ? 'Draft image hidden.' : 'Draft image activated.');
      return;
    }

    setProductMessage('');
    setProductError('');
    const { error: toggleError } = await toggleProductImageActive(image.id, image.is_active);
    if (toggleError) {
      setProductError(toggleError.message || 'Could not update image state.');
      return;
    }
    setProductMessage(image.is_active ? 'Variant image hidden.' : 'Variant image activated.');
    loadData();
  };

  const onDeleteProductImage = async (imageId) => {
    if (!window.confirm('Delete this image variant?')) {
      return;
    }

    if (!productForm.id) {
      setDraftProductImages((current) => current.filter((item) => item.id !== imageId));
      setProductMessage('Draft image deleted.');
      return;
    }

    setProductMessage('');
    setProductError('');
    const { error: deleteError } = await deleteProductImageRecord(imageId);
    if (deleteError) {
      setProductError(deleteError.message || 'Could not delete variant image.');
      return;
    }
    setProductMessage('Variant image deleted.');
    loadData();
  };

  const onMoveVariantImageByStep = async (imageId, direction) => {
    if (!productForm.id) {
      setDraftProductImages((current) => {
        const ordered = [...current].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
        const currentIndex = ordered.findIndex((item) => item.id === imageId);
        const targetIndex = currentIndex + direction;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
          return current;
        }
        const next = [...ordered];
        const [picked] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, picked);
        return next.map((item, idx) => ({ ...item, sort_order: idx }));
      });
      setProductMessage('Draft image order updated.');
      return;
    }

    const ordered = [...currentProductImages].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    );
    const currentIndex = ordered.findIndex((item) => item.id === imageId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    const currentItem = ordered[currentIndex];
    const targetItem = ordered[targetIndex];
    const currentSort = Number(currentItem.sort_order || 0);
    const targetSort = Number(targetItem.sort_order || 0);

    setProductMessage('');
    setProductError('');
    const [updateA, updateB] = await Promise.all([
      updateProductImageRecord(currentItem.id, { sort_order: targetSort }),
      updateProductImageRecord(targetItem.id, { sort_order: currentSort })
    ]);

    if (updateA.error || updateB.error) {
      setProductError(updateA.error?.message || updateB.error?.message || 'Could not reorder images.');
      return;
    }

    setProductMessage('Variant image order updated.');
    loadData();
  };

  const onBulkAction = async (action) => {
    if (action === 'delete') {
      const ok = window.confirm(`Delete ${selectedProductIds.length} selected product(s)? This cannot be undone.`);
      if (!ok) {
        return;
      }
    }

    setProductMessage('');
    setProductError('');
    const { error: bulkError } = await bulkUpdateProducts(selectedProductIds, action);

    if (bulkError) {
      setProductError(bulkError.message || 'Bulk action failed.');
      return;
    }

    const label = action === 'activate' ? 'activated' : action === 'deactivate' ? 'deactivated' : 'deleted';
    setProductMessage(`${selectedProductIds.length} product(s) ${label}.`);
    setSelectedProductIds([]);
    loadData();
  };

  const onSaveCategory = async (event) => {
    event.preventDefault();
    setCategoryMessage('');
    setCategoryError('');

    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setCategoryError('Category name and slug are required.');
      return;
    }

    setSavingCategory(true);
    const { error: saveError } = await upsertCategoryRecord(categoryForm);
    setSavingCategory(false);

    if (saveError) {
      setCategoryError(saveError.message || 'Could not save category.');
      return;
    }

    setCategoryMessage(categoryForm.id ? 'Category updated.' : 'Category created.');
    clearCategoryForm();
    loadData();
  };

  const onSaveTag = async (event) => {
    event.preventDefault();
    setTagMessage('');
    setTagError('');

    if (!tagForm.name.trim() || !tagForm.slug.trim()) {
      setTagError('Tag name and slug are required.');
      return;
    }

    setSavingTag(true);
    const { error: saveError } = await upsertTagRecord(tagForm);
    setSavingTag(false);

    if (saveError) {
      setTagError(saveError.message || 'Could not save tag.');
      return;
    }

    setTagMessage(tagForm.id ? 'Tag updated.' : 'Tag created.');
    clearTagForm();
    loadData();
  };

  const onSaveHero = async (event) => {
    event.preventDefault();
    setHeroMessage('');
    setHeroError('');

    if (!heroForm.image_url.trim()) {
      setHeroError('Hero image URL is required.');
      return;
    }

    setSavingHero(true);
    const { error: saveError } = await upsertHeroSlideRecord(heroForm);
    setSavingHero(false);

    if (saveError) {
      setHeroError(saveError.message || 'Could not save hero slide.');
      return;
    }

    setHeroMessage(heroForm.id ? 'Hero slide updated.' : 'Hero slide created.');
    clearHeroForm();
    loadData();
  };

  const onDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) {
      return;
    }

    setCategoryMessage('');
    setCategoryError('');
    const { error: removeError } = await deleteCategoryRecord(categoryId);
    if (removeError) {
      setCategoryError(removeError.message || 'Could not delete category.');
      return;
    }
    setCategoryMessage('Category deleted.');
    loadData();
  };

  const onDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag?')) {
      return;
    }

    setTagMessage('');
    setTagError('');
    const { error: removeError } = await deleteTagRecord(tagId);
    if (removeError) {
      setTagError(removeError.message || 'Could not delete tag.');
      return;
    }
    setTagMessage('Tag deleted.');
    loadData();
  };

  const onDeleteHeroSlide = async (slideId) => {
    if (!window.confirm('Delete this hero slide?')) {
      return;
    }

    setHeroMessage('');
    setHeroError('');
    const { error: removeError } = await deleteHeroSlideRecord(slideId);
    if (removeError) {
      setHeroError(removeError.message || 'Could not delete hero slide.');
      return;
    }
    setHeroMessage('Hero slide deleted.');
    loadData();
  };

  const onToggleHeroSlide = async (slide) => {
    setHeroMessage('');
    setHeroError('');
    const { error: toggleError } = await toggleHeroSlideActive(slide.id, slide.is_active);
    if (toggleError) {
      setHeroError(toggleError.message || 'Could not update hero slide state.');
      return;
    }
    setHeroMessage(slide.is_active ? 'Hero slide deactivated.' : 'Hero slide activated.');
    loadData();
  };

  const onToggleProduct = async (product) => {
    setProductMessage('');
    setProductError('');
    const { error: toggleError } = await toggleProductActive(product.id, product.is_active);

    if (toggleError) {
      setProductError(toggleError.message || 'Could not update product status.');
      return;
    }

    setProductMessage(product.is_active ? 'Product deactivated.' : 'Product activated.');
    loadData();
  };

  const allVisibleSelected =
    dashboard.products.length > 0 && selectedProductIds.length === dashboard.products.length;

  const currentProductImages = useMemo(
    () =>
      (dashboard.productImages || []).filter((item) => item.product_id === productForm.id).sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      }),
    [dashboard.productImages, productForm.id]
  );

  const nextVariantSortOrder = useMemo(() => {
    const source = productForm.id ? currentProductImages : draftProductImages;
    if (source.length === 0) {
      return 0;
    }
    return Math.max(...source.map((img) => Number(img.sort_order || 0))) + 1;
  }, [currentProductImages, draftProductImages, productForm.id]);

  const displayedVariantImages = useMemo(() => {
    const source = productForm.id ? currentProductImages : draftProductImages;
    return [...source]
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((item, idx) => ({ ...item, is_primary: idx === 0 }));
  }, [productForm.id, currentProductImages, draftProductImages]);

  const toggleAllProducts = () => {
    if (allVisibleSelected) {
      setSelectedProductIds([]);
      return;
    }
    setSelectedProductIds(dashboard.products.map((item) => item.id));
  };

  const toggleOneProduct = (id) => {
    setSelectedProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="dashboard-page" id="top">
        <SiteHeader />
        <main className="dashboard-main">
          <section className="panel auth-panel">
            <h3>Supabase Required</h3>
            <p>Add your Supabase keys in `.env` and restart the app to use dashboard management.</p>
          </section>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="dashboard-page" id="top">
        <SiteHeader />
        <main className="dashboard-main">
          <section className="panel auth-panel">
            <h3>Loading Dashboard...</h3>
          </section>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="dashboard-page" id="top">
        <SiteHeader />
        <main className="dashboard-main">
          <section className="panel auth-panel">
            <h3>Admin Login</h3>
            <p>Sign in with your Supabase user to manage products, categories, and tags.</p>

            <form className="auth-form" onSubmit={onLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((current) => ({ ...current, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((current) => ({ ...current, password: e.target.value }))}
                  required
                />
              </label>
              <button type="submit" disabled={authBusy}>
                {authBusy ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {authError ? <p className="dashboard-error">{authError}</p> : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page" id="top">
      <SiteHeader />

      <main className="dashboard-main">
        <section className="dashboard-head">
          <div>
            <p>Admin</p>
            <h1>Dashboard</h1>
            <span>Signed in as {session.user?.email}</span>
          </div>
          <div className="dashboard-head-actions">
            <button type="button" onClick={loadData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button type="button" className="ghost-btn" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </section>
        <nav className="dashboard-quick-nav" aria-label="Dashboard sections">
          <a href="#hero-manager">Hero</a>
          <a href="#product-manager">Products</a>
          <a href="#catalog-products">Catalog</a>
          <a href="#orders">Orders</a>
          <a href="#custom-requests">Custom Requests</a>
        </nav>

        {error ? <p className="dashboard-error">{error}</p> : null}

        <section className="metric-grid">
          <article>
            <h2>Orders</h2>
            <strong>{dashboard.metrics.totalOrders}</strong>
          </article>
          <article>
            <h2>Revenue</h2>
            <strong>{formatMAD(dashboard.metrics.totalRevenue)}</strong>
          </article>
          <article>
            <h2>Custom Requests</h2>
            <strong>{dashboard.metrics.totalCustomRequests}</strong>
          </article>
          <article>
            <h2>Products</h2>
            <strong>{dashboard.metrics.totalProducts}</strong>
          </article>
        </section>

        <section className="panel" id="hero-manager">
          <h3>Manage Hero Slides</h3>
          <p className="panel-lead">Control homepage banners, call-to-actions, and display order.</p>
          <form className="product-form" onSubmit={onSaveHero}>
            <label>
              Title
              <input type="text" name="title" value={heroForm.title} onChange={onHeroInput} />
            </label>

            <label>
              Image URL
              <input type="text" name="image_url" value={heroForm.image_url} onChange={onHeroInput} required />
            </label>

            <label>
              Upload Hero Image
              <input type="file" accept="image/*" onChange={onUploadHeroImage} />
            </label>

            <label>
              CTA Text
              <input type="text" name="cta_text" value={heroForm.cta_text} onChange={onHeroInput} />
            </label>

            <label>
              CTA URL
              <input type="text" name="cta_url" value={heroForm.cta_url} onChange={onHeroInput} />
            </label>

            <label>
              Sort Order
              <input type="number" name="sort_order" value={heroForm.sort_order} onChange={onHeroInput} />
            </label>

            <label className="checkbox-field">
              <input type="checkbox" name="is_active" checked={heroForm.is_active} onChange={onHeroInput} />
              Active
            </label>

            <div className="product-form-actions">
              <button type="submit" disabled={savingHero || uploadingHeroImage}>
                {savingHero ? 'Saving...' : uploadingHeroImage ? 'Uploading...' : heroForm.id ? 'Update Slide' : 'Add Slide'}
              </button>
              {heroForm.id ? (
                <button type="button" className="ghost-btn" onClick={clearHeroForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Preview</th>
                  <th>CTA</th>
                  <th>Order</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.heroSlides.length > 0 ? (
                  dashboard.heroSlides.map((slide) => (
                    <tr key={slide.id}>
                      <td>{slide.title}</td>
                      <td>{slide.image_url ? 'Image set' : 'No image'}</td>
                      <td>{slide.cta_text} / {slide.cta_url}</td>
                      <td>{slide.sort_order}</td>
                      <td>{slide.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="product-actions">
                          <button type="button" className="small-btn" onClick={() => onEditHeroSlide(slide)}>
                            Edit
                          </button>
                          <button type="button" className="small-btn ghost-btn" onClick={() => onToggleHeroSlide(slide)}>
                            {slide.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button type="button" className="small-btn" onClick={() => onDeleteHeroSlide(slide.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>No hero slides yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {heroError ? <p className="dashboard-error">{heroError}</p> : null}
          {heroMessage ? <p className="dashboard-success">{heroMessage}</p> : null}
        </section>

        <section className="panel" id="product-manager">
          <h3>Manage Products</h3>
          <p className="panel-lead">Create products, edit tabs, and organize image variants.</p>
          <form className="product-form" onSubmit={onSaveProduct}>
            <label>
              Name
              <input type="text" name="name" value={productForm.name} onChange={onProductInput} required />
            </label>

            <label>
              Slug
              <input type="text" name="slug" value={productForm.slug} onChange={onProductInput} required />
            </label>

            <label>
              Category
              <select name="category" value={productForm.category} onChange={onProductInput}>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Price
              <input
                type="number"
                name="price"
                value={productForm.price}
                min="0"
                step="0.01"
                onChange={onProductInput}
                required
              />
            </label>

            <label>
              Image URL
              <input type="text" name="image_url" value={productForm.image_url} onChange={onProductInput} />
            </label>

            <label>
              Upload Principal Image
              <input type="file" accept="image/*" onChange={onUploadProductImage} />
            </label>

            {productForm.image_url ? (
              <div className="image-preview">
                <p>Current principal image</p>
                <img src={productForm.image_url} alt="Current product" />
              </div>
            ) : null}

            <label>
              Product Video URL
              <input type="text" name="media_video_url" value={productForm.media_video_url} onChange={onProductInput} />
            </label>

            <label>
              Upload Product Video
              <input type="file" accept="video/*" onChange={onUploadMediaVideo} />
            </label>

            <label>
              Detail Zoom Image URL
              <input type="text" name="detail_image_url" value={productForm.detail_image_url} onChange={onProductInput} />
            </label>

            <label>
              Upload Detail Image
              <input type="file" accept="image/*" onChange={onUploadDetailImage} />
            </label>

            {productForm.media_video_url ? (
              <div className="image-preview">
                <p>Current product video</p>
                <video src={productForm.media_video_url} controls preload="metadata" />
              </div>
            ) : null}

            {productForm.detail_image_url ? (
              <div className="image-preview">
                <p>Current detail image</p>
                <img src={productForm.detail_image_url} alt="Current detail" />
              </div>
            ) : null}

            <label>
              Detail Section Title
              <input
                type="text"
                name="detail_section_title"
                value={productForm.detail_section_title}
                onChange={onProductInput}
                placeholder="Chaque detail compte"
              />
            </label>

            <label className="wide-field full-row">
              Detail Section Text
              <textarea
                name="detail_section_text"
                value={productForm.detail_section_text}
                onChange={onProductInput}
                placeholder="Texte de la section detail du produit"
                rows={3}
              />
            </label>

            <label>
              Badge
              <input type="text" name="badge" value={productForm.badge} onChange={onProductInput} />
            </label>

            <label className="wide-field full-row description-field">
              Description
              <textarea
                name="description"
                value={productForm.description}
                onChange={onProductInput}
                placeholder="Product description"
                rows={5}
              />
            </label>

            <label className="wide-field full-row tabs-field">
              Product Info Tabs
              <div className="info-sections-editor">
                {infoSectionsDraft.map((section, idx) => (
                  <div key={section.id} className="info-section-item">
                    <div className="info-section-head">
                      <strong>Tab {idx + 1}</strong>
                      <button type="button" className="small-btn ghost-btn" onClick={() => onRemoveInfoSection(section.id)}>
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(event) => onInfoSectionInput(section.id, 'title', event.target.value)}
                      placeholder="Tab title"
                    />
                    <textarea
                      value={section.content}
                      onChange={(event) => onInfoSectionInput(section.id, 'content', event.target.value)}
                      placeholder="Tab content"
                      rows={3}
                    />
                  </div>
                ))}
                <button type="button" className="small-btn add-info-section-btn" onClick={onAddInfoSection}>
                  Add Tab
                </button>
              </div>
            </label>

            <label>
              Tags (comma)
              <input
                type="text"
                name="tags"
                value={productForm.tags}
                onChange={onProductInput}
                placeholder="new, cotton"
              />
            </label>

            <label>
              Sizes (comma)
              <input
                type="text"
                name="sizes"
                value={productForm.sizes}
                onChange={onProductInput}
                placeholder="S,M,L,XL"
              />
            </label>

            <label className="checkbox-field">
              <input type="checkbox" name="is_featured" checked={productForm.is_featured} onChange={onProductInput} />
              Featured
            </label>

            <label className="checkbox-field">
              <input type="checkbox" name="is_active" checked={productForm.is_active} onChange={onProductInput} />
              Active
            </label>

            <div className="product-form-actions">
              <button type="submit" disabled={savingProduct || uploadingImage || uploadingDetailImage || uploadingMediaVideo}>
                {savingProduct
                  ? 'Saving...'
                  : uploadingImage || uploadingDetailImage || uploadingMediaVideo
                    ? 'Uploading...'
                    : productForm.id
                      ? 'Update Product'
                      : 'Add Product'}
              </button>
              {productForm.id ? (
                <button type="button" className="ghost-btn" onClick={clearProductForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          {productError ? <p className="dashboard-error">{productError}</p> : null}
          {productMessage ? <p className="dashboard-success">{productMessage}</p> : null}

          <div className="variant-images-panel">
            <h4>Variant Images</h4>
            <p>
              Upload images one by one and set their display order while creating the product.
              Image #1 is principal automatically.
            </p>

            <form className="variant-form" onSubmit={onAddProductImage}>
              <label>
                Variant Image URL
                <input
                  type="text"
                  name="image_url"
                  value={productImageForm.image_url}
                  onChange={onProductImageInput}
                  placeholder="https://..."
                  required
                />
              </label>
              <label>
                Upload Variant
                <input type="file" accept="image/*" onChange={onUploadVariantImage} />
              </label>
              <label>
                Label
                <input
                  type="text"
                  name="variant_label"
                  value={productImageForm.variant_label}
                  onChange={onProductImageInput}
                  placeholder="Front / Back / Blue"
                />
              </label>
              <label>
                Display Order (1 = principal)
                <input
                  type="number"
                  name="sort_order"
                  value={productImageForm.sort_order}
                  min="1"
                  onChange={onProductImageInput}
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={productImageForm.is_active}
                  onChange={onProductImageInput}
                />
                Active
              </label>
              <div className="product-form-actions">
                <button type="submit" disabled={savingProductImage || uploadingImage}>
                  {savingProductImage ? 'Saving...' : 'Add Variant By URL'}
                </button>
              </div>
            </form>

            <div className="variant-grid">
              {displayedVariantImages.length > 0 ? (
                displayedVariantImages.map((img) => (
                  <article className={`variant-card ${img.is_primary ? 'principal' : ''}`} key={img.id}>
                    <div className="variant-thumb-wrap">
                      <img src={img.image_url} alt={img.variant_label || 'Variant image'} />
                      {img.is_primary ? <span className="variant-badge">Principal</span> : null}
                      {!img.is_active ? <span className="variant-badge muted">Hidden</span> : null}
                    </div>
                    <div className="variant-meta">
                      <strong>{img.variant_label || 'No label'}</strong>
                      <span>Order: {Number(img.sort_order || 0) + 1}</span>
                    </div>
                    <div className="variant-actions">
                      <button
                        type="button"
                        className="small-btn ghost-btn"
                        onClick={() => onMoveVariantImageByStep(img.id, -1)}
                      >
                        Move Up
                      </button>
                      <button
                        type="button"
                        className="small-btn ghost-btn"
                        onClick={() => onMoveVariantImageByStep(img.id, 1)}
                      >
                        Move Down
                      </button>
                      <button
                        type="button"
                        className="small-btn ghost-btn"
                        onClick={() => onMoveImageToTop(img.id)}
                      >
                        Move To Top
                      </button>
                      {!img.is_primary ? (
                        <button
                          type="button"
                          className="small-btn ghost-btn"
                          onClick={() => onSetPrimaryImage(img.id)}
                        >
                          Set Principal
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="small-btn ghost-btn"
                        onClick={() => onToggleProductImage(img)}
                      >
                        {img.is_active ? 'Hide' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="small-btn danger-btn"
                        onClick={() => onDeleteProductImage(img.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="variant-empty">No variant images yet.</p>
              )}
            </div>
          </div>
        </section>


        <section className="panel-grid admin-grid">
          <article className="panel compact-panel">
            <h3>Manage Categories</h3>
            <form className="mini-form" onSubmit={onSaveCategory}>
              <label>
                Name
                <input type="text" name="name" value={categoryForm.name} onChange={onCategoryInput} required />
              </label>
              <label>
                Slug
                <input type="text" name="slug" value={categoryForm.slug} onChange={onCategoryInput} required />
              </label>
              <label>
                Description
                <input type="text" name="description" value={categoryForm.description} onChange={onCategoryInput} />
              </label>
              <div className="product-form-actions">
                <button type="submit" disabled={savingCategory}>
                  {savingCategory ? 'Saving...' : categoryForm.id ? 'Update Category' : 'Add Category'}
                </button>
                {categoryForm.id ? (
                  <button type="button" className="ghost-btn" onClick={clearCategoryForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.categories.length > 0 ? (
                    dashboard.categories.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.slug}</td>
                        <td>
                          <div className="product-actions">
                            <button type="button" className="small-btn" onClick={() => onEditCategory(item)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="small-btn ghost-btn"
                              onClick={() => onDeleteCategory(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>No categories yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {categoryError ? <p className="dashboard-error">{categoryError}</p> : null}
            {categoryMessage ? <p className="dashboard-success">{categoryMessage}</p> : null}
          </article>

          <article className="panel compact-panel">
            <h3>Manage Tags</h3>
            <form className="mini-form" onSubmit={onSaveTag}>
              <label>
                Name
                <input type="text" name="name" value={tagForm.name} onChange={onTagInput} required />
              </label>
              <label>
                Slug
                <input type="text" name="slug" value={tagForm.slug} onChange={onTagInput} required />
              </label>
              <div className="product-form-actions">
                <button type="submit" disabled={savingTag}>
                  {savingTag ? 'Saving...' : tagForm.id ? 'Update Tag' : 'Add Tag'}
                </button>
                {tagForm.id ? (
                  <button type="button" className="ghost-btn" onClick={clearTagForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.tags.length > 0 ? (
                    dashboard.tags.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.slug}</td>
                        <td>
                          <div className="product-actions">
                            <button type="button" className="small-btn" onClick={() => onEditTag(item)}>
                              Edit
                            </button>
                            <button type="button" className="small-btn ghost-btn" onClick={() => onDeleteTag(item.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>No tags yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {tagError ? <p className="dashboard-error">{tagError}</p> : null}
            {tagMessage ? <p className="dashboard-success">{tagMessage}</p> : null}
          </article>
        </section>

        <section className="panel-grid">
          <article className="panel" id="orders">
            <h3>Recent Orders</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Subtotal</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.orders.length > 0 ? (
                    dashboard.orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_phone}</td>
                        <td>{formatMAD(order.subtotal)}</td>
                        <td>{order.status}</td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel" id="custom-requests">
            <h3>Custom Print Requests</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.customRequests.length > 0 ? (
                    dashboard.customRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.customer_name}</td>
                        <td>{request.customer_phone}</td>
                        <td>{request.product_type}</td>
                        <td>{request.quantity}</td>
                        <td>{request.status}</td>
                        <td>{formatDate(request.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No custom requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="panel" id="catalog-products">
          <div className="table-head-actions">
            <h3>Catalog Products</h3>
            <div className="bulk-actions">
              <button
                type="button"
                className="small-btn ghost-btn"
                disabled={selectedProductIds.length === 0}
                onClick={() => onBulkAction('activate')}
              >
                Activate Selected
              </button>
              <button
                type="button"
                className="small-btn ghost-btn"
                disabled={selectedProductIds.length === 0}
                onClick={() => onBulkAction('deactivate')}
              >
                Deactivate Selected
              </button>
              <button
                type="button"
                className="small-btn danger-btn"
                disabled={selectedProductIds.length === 0}
                onClick={() => onBulkAction('delete')}
              >
                Delete Selected
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllProducts} />
                  </th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Tags</th>
                  <th>Featured</th>
                  <th>Active</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.products.length > 0 ? (
                  dashboard.products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleOneProduct(product.id)}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.slug}</td>
                      <td>{product.category}</td>
                      <td>{formatMAD(product.price)}</td>
                      <td>{(product.tags || []).join(', ') || '-'}</td>
                      <td>{product.is_featured ? 'Yes' : 'No'}</td>
                      <td>{product.is_active ? 'Yes' : 'No'}</td>
                      <td>{formatDate(product.created_at)}</td>
                      <td>
                        <div className="product-actions">
                          <button type="button" className="small-btn" onClick={() => onEditProduct(product)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="small-btn ghost-btn"
                            onClick={() => onToggleProduct(product)}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="small-btn danger-btn"
                            onClick={() => onDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10}>No products loaded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
