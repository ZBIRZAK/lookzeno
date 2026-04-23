import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export { isSupabaseConfigured };

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const PRODUCT_BUCKET = process.env.REACT_APP_SUPABASE_PRODUCT_BUCKET || 'product-images';

function asNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeTags(input) {
  if (Array.isArray(input)) {
    return input.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeInfoSections(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, idx) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const title = String(item.title || '').trim();
      const content = String(item.content || '').trim();
      if (!title || !content) {
        return null;
      }

      const id = String(item.id || title || `section-${idx + 1}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      return {
        id: id || `section-${idx + 1}`,
        title,
        content
      };
    })
    .filter(Boolean);
}

function normalizeProduct(item) {
  const slug = item.slug || String(item.id || 'product').toLowerCase();

  return {
    id: item.id || slug,
    slug,
    name: item.name || 'Produit sans titre',
    category: item.category || 'Sans catégorie',
    price: asNumber(item.price),
    badge: item.badge || (item.is_featured ? 'En vedette' : 'Nouveau'),
    image: item.image_url || '',
    image_url: item.image_url || '',
    media_video_url: item.media_video_url || '',
    detail_image_url: item.detail_image_url || '',
    detail_section_title: item.detail_section_title || '',
    detail_section_text: item.detail_section_text || '',
    description:
      item.description ||
      'Tissu premium, coupe nette et ton streetwear moderne. Conçu pour un usage quotidien.',
    info_sections: normalizeInfoSections(item.info_sections),
    tags: normalizeTags(item.tags),
    sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : DEFAULT_SIZES,
    is_featured: Boolean(item.is_featured),
    is_active: item.is_active !== false,
    created_at: item.created_at,
    to: `/product/${slug}`
  };
}

function normalizeProductImage(item) {
  return {
    id: item.id,
    product_id: item.product_id,
    image_url: item.image_url || '',
    variant_label: item.variant_label || '',
    sort_order: Number(item.sort_order || 0),
    is_primary: Boolean(item.is_primary),
    is_active: item.is_active !== false,
    created_at: item.created_at
  };
}

function mergeProductsWithImages(products, images) {
  const byProduct = images.reduce((acc, image) => {
    if (!acc[image.product_id]) {
      acc[image.product_id] = [];
    }
    acc[image.product_id].push(image);
    return acc;
  }, {});

  return products.map((product) => {
    const productImages = (byProduct[product.id] || []).sort((a, b) => a.sort_order - b.sort_order);

    const primary = productImages.find((img) => img.is_primary) || productImages[0];
    const image_url = primary?.image_url || product.image_url || '';

    return {
      ...product,
      image_url,
      image: image_url,
      images: productImages
    };
  });
}

async function syncProductPrincipalImage(productId) {
  if (!isSupabaseConfigured || !supabase || !productId) {
    return;
  }

  const { data: activeImages } = await supabase
    .from('product_images')
    .select('id, image_url, is_primary, sort_order')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const list = activeImages || [];

  if (list.length === 0) {
    await supabase.from('products').update({ image_url: null }).eq('id', productId);
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
    return;
  }

  const principal = list[0];

  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .neq('id', principal.id);

  await supabase.from('product_images').update({ is_primary: true }).eq('id', principal.id);
  await supabase.from('products').update({ image_url: principal.image_url || null }).eq('id', productId);
}

function normalizeHeroSlide(item) {
  return {
    id: item.id,
    title: item.title || 'Hero LookZeno',
    image_url: item.image_url || '',
    image: item.image_url || '',
    cta_text: item.cta_text || 'Acheter maintenant',
    cta_url: item.cta_url || '/products',
    sort_order: Number(item.sort_order || 0),
    is_active: item.is_active !== false,
    created_at: item.created_at
  };
}

async function fetchProductsRaw(onlyActive = true) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null };
  }

  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

export async function getDashboardSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { data: data?.session || null, error };
}

export async function signInDashboard(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data: data?.session || null, error };
}

export async function signOutDashboard() {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

export function subscribeDashboardAuth(handler) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    handler(session || null);
  });

  return () => subscription.unsubscribe();
}

export async function uploadProductImage(file) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  if (!file) {
    return { data: null, error: new Error('No file selected.') };
  }

  const ext = String(file.name || 'image').split('.').pop()?.toLowerCase() || 'jpg';
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600'
  });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return { data: { path, publicUrl: data.publicUrl }, error: null };
}

export async function uploadProductMedia(file) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  if (!file) {
    return { data: null, error: new Error('No file selected.') };
  }

  const ext = String(file.name || 'media').split('.').pop()?.toLowerCase() || 'bin';
  const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600'
  });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return { data: { path, publicUrl: data.publicUrl }, error: null };
}

export async function uploadHeroImage(file) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  if (!file) {
    return { data: null, error: new Error('No file selected.') };
  }

  const ext = String(file.name || 'image').split('.').pop()?.toLowerCase() || 'jpg';
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '3600'
  });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return { data: { path, publicUrl: data.publicUrl }, error: null };
}

export async function fetchHeroSlides() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return { data: [], error: null };
    }
    return { data: null, error };
  }

  return { data: (data || []).map(normalizeHeroSlide), error: null };
}

export async function fetchCatalogProducts() {
  const { data, error } = await fetchProductsRaw(true);
  if (error) {
    return { data: null, error };
  }

  const products = data.map(normalizeProduct);

  if (products.length === 0 || !supabase) {
    return { data: products, error: null };
  }

  const ids = products.map((item) => item.id);
  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', ids)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (imagesError && imagesError.code !== '42P01') {
    return { data: null, error: imagesError };
  }

  const images = (imagesData || []).map(normalizeProductImage);
  return { data: mergeProductsWithImages(products, images), error: null };
}

export async function fetchStorefrontData() {
  const [{ data: products, error: productsError }, { data: heroSlides, error: slidesError }] =
    await Promise.all([fetchCatalogProducts(), fetchHeroSlides()]);

  if (productsError || slidesError) {
    return { data: null, error: productsError || slidesError };
  }

  const safeProducts = products || [];

  const derivedCategories = Array.from(
    new Set(safeProducts.map((product) => product.category).filter(Boolean))
  ).map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: `Collection ${name}`
  }));

  const featured = safeProducts.filter((product) => product.is_featured).slice(0, 8);

  return {
    data: {
      products: safeProducts,
      featured,
      categories: derivedCategories,
      heroSlides: heroSlides || []
    },
    error: null
  };
}

export async function fetchProductBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const product = normalizeProduct(data);

  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (imagesError && imagesError.code !== '42P01') {
    return { data: null, error: imagesError };
  }

  const merged = mergeProductsWithImages([product], (imagesData || []).map(normalizeProductImage))[0];
  return { data: merged, error: null };
}

export async function fetchRelatedProducts({ category, excludeSlug, limit = 4 }) {
  const { data: products, error } = await fetchCatalogProducts();
  if (error) {
    return { data: null, error };
  }

  const safe = products || [];
  const byCategory = safe.filter((item) => item.category === category && item.slug !== excludeSlug);
  const fallback = safe.filter((item) => item.slug !== excludeSlug);
  const data = (byCategory.length > 0 ? byCategory : fallback).slice(0, limit);

  return { data, error: null };
}

export async function createOrderRecord({ customerName, customerPhone, items, subtotal }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal,
      total_items: totalItems,
      channel: 'whatsapp',
      status: 'new',
      payload: { source: 'cart_page' }
    })
    .select('id')
    .single();

  if (orderError) {
    return { data: null, error: orderError };
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_name: item.name,
    product_slug: item.slug || item.id,
    size: item.size,
    quantity: item.qty,
    unit_price: item.price,
    line_total: item.price * item.qty
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  return { data: order, error: null };
}

export async function createCustomPrintRequest({
  customerName,
  customerPhone,
  productType,
  quantity,
  logoName,
  designBySide
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('custom_print_requests')
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      product_type: productType,
      quantity,
      logo_name: logoName,
      design_json: designBySide,
      status: 'pending'
    })
    .select('id')
    .single();

  return { data, error };
}

export async function fetchDashboardData() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: {
        metrics: {
          totalOrders: 0,
          totalRevenue: 0,
          totalCustomRequests: 0,
          totalProducts: 0
        },
        orders: [],
        customRequests: [],
        products: [],
        productImages: [],
        categories: [],
        tags: [],
        heroSlides: []
      },
      error: null
    };
  }

  const [ordersResult, customResult, productsResult, productImagesResult, categoriesResult, tagsResult, heroSlidesResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, customer_name, customer_phone, subtotal, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('custom_print_requests')
      .select('id, customer_name, customer_phone, product_type, quantity, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100),
    supabase
      .from('product_images')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(500),
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('tags').select('*').order('name', { ascending: true }),
    supabase.from('hero_slides').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  ]);

  if (ordersResult.error || customResult.error || productsResult.error) {
    return {
      data: null,
      error: ordersResult.error || customResult.error || productsResult.error
    };
  }

  const productImagesErrorCode = productImagesResult.error?.code;
  const categoryErrorCode = categoriesResult.error?.code;
  const tagErrorCode = tagsResult.error?.code;
  const heroSlidesErrorCode = heroSlidesResult.error?.code;
  const categories = categoryErrorCode === '42P01' ? [] : categoriesResult.data || [];
  const tags = tagErrorCode === '42P01' ? [] : tagsResult.data || [];

  const orders = ordersResult.data || [];
  const customRequests = customResult.data || [];
  const rawProducts = (productsResult.data || []).map(normalizeProduct);
  const productImages =
    productImagesErrorCode === '42P01' ? [] : (productImagesResult.data || []).map(normalizeProductImage);
  const products = mergeProductsWithImages(rawProducts, productImages);
  const heroSlides =
    heroSlidesErrorCode === '42P01' ? [] : (heroSlidesResult.data || []).map(normalizeHeroSlide);

  const totalRevenue = orders.reduce((sum, order) => sum + asNumber(order.subtotal), 0);

  return {
    data: {
      metrics: {
        totalOrders: orders.length,
        totalRevenue,
        totalCustomRequests: customRequests.length,
        totalProducts: products.length
      },
      orders,
      customRequests,
      products,
      productImages,
      categories,
      tags,
      heroSlides
    },
    error: null
  };
}

export async function upsertHeroSlideRecord(slideInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {
    title: String(slideInput.title || '').trim() || 'Hero LookZeno',
    image_url: String(slideInput.image_url || '').trim(),
    cta_text: String(slideInput.cta_text || '').trim() || 'Acheter maintenant',
    cta_url: String(slideInput.cta_url || '').trim() || '/products',
    sort_order: Number(slideInput.sort_order || 0),
    is_active: slideInput.is_active !== false
  };

  if (slideInput.id) {
    const { data, error } = await supabase
      .from('hero_slides')
      .update(payload)
      .eq('id', slideInput.id)
      .select('id')
      .single();
    return { data, error };
  }

  const { data, error } = await supabase.from('hero_slides').insert(payload).select('id').single();
  return { data, error };
}

export async function deleteHeroSlideRecord(slideId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { error } = await supabase.from('hero_slides').delete().eq('id', slideId);
  return { data: { id: slideId }, error };
}

export async function toggleHeroSlideActive(slideId, currentActive) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .update({ is_active: !currentActive })
    .eq('id', slideId)
    .select('id')
    .single();

  return { data, error };
}

export async function upsertProductRecord(productInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {
    slug: String(productInput.slug || '').trim(),
    name: String(productInput.name || '').trim(),
    category: String(productInput.category || '').trim() || 'Sans catégorie',
    price: asNumber(productInput.price),
    image_url: String(productInput.image_url || '').trim() || null,
    media_video_url: String(productInput.media_video_url || '').trim() || null,
    detail_image_url: String(productInput.detail_image_url || '').trim() || null,
    detail_section_title: String(productInput.detail_section_title || '').trim() || null,
    detail_section_text: String(productInput.detail_section_text || '').trim() || null,
    badge: String(productInput.badge || '').trim() || null,
    description: String(productInput.description || '').trim() || null,
    info_sections: normalizeInfoSections(productInput.info_sections),
    tags: normalizeTags(productInput.tags),
    sizes:
      Array.isArray(productInput.sizes) && productInput.sizes.length > 0
        ? productInput.sizes
        : DEFAULT_SIZES,
    is_featured: Boolean(productInput.is_featured),
    is_active: productInput.is_active !== false
  };

  if (productInput.id) {
    let candidatePayload = { ...payload };
    while (true) {
      const { data, error } = await supabase
        .from('products')
        .update(candidatePayload)
        .eq('id', productInput.id)
        .select('id')
        .single();

      if (!error) {
        return { data, error: null };
      }

      const columnMatch = String(error.message || '').match(/column "([^"]+)"/);
      const missingColumn = columnMatch?.[1];
      if (error.code !== '42703' || !missingColumn || !(missingColumn in candidatePayload)) {
        return { data: null, error };
      }

      delete candidatePayload[missingColumn];
    }
  }

  let candidatePayload = { ...payload };
  while (true) {
    const { data, error } = await supabase.from('products').insert(candidatePayload).select('id').single();
    if (!error) {
      return { data, error: null };
    }

    const columnMatch = String(error.message || '').match(/column "([^"]+)"/);
    const missingColumn = columnMatch?.[1];
    if (error.code !== '42703' || !missingColumn || !(missingColumn in candidatePayload)) {
      return { data: null, error };
    }

    delete candidatePayload[missingColumn];
  }
}

export async function fetchProductImages(productId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return { data: [], error: null };
    }
    return { data: null, error };
  }

  return { data: (data || []).map(normalizeProductImage), error: null };
}

export async function addProductImageRecord(imageInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {
    product_id: imageInput.product_id,
    image_url: String(imageInput.image_url || '').trim(),
    variant_label: String(imageInput.variant_label || '').trim() || null,
    sort_order: Number(imageInput.sort_order || 0),
    is_primary: Boolean(imageInput.is_primary),
    is_active: imageInput.is_active !== false
  };

  if (!payload.product_id || !payload.image_url) {
    return { data: null, error: new Error("Le produit et l'URL de l'image sont obligatoires.") };
  }

  const { data, error } = await supabase.from('product_images').insert(payload).select('*').single();

  if (error) {
    return { data: null, error };
  }

  await syncProductPrincipalImage(payload.product_id);
  return { data: normalizeProductImage(data), error: null };
}

export async function setPrimaryProductImage(productId, imageId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data: allImages } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId);
  const minSort = (allImages || []).reduce((min, item) => Math.min(min, Number(item.sort_order || 0)), 0);

  const { data, error } = await supabase
    .from('product_images')
    .update({ sort_order: minSort - 1, is_active: true })
    .eq('id', imageId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  await syncProductPrincipalImage(productId);
  return { data: normalizeProductImage(data), error: null };
}

export async function moveProductImageToTop(productId, imageId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data: allImages, error: listError } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId);

  if (listError) {
    return { data: null, error: listError };
  }

  const minSort = (allImages || []).reduce((min, item) => Math.min(min, Number(item.sort_order || 0)), 0);

  const { data, error } = await supabase
    .from('product_images')
    .update({ sort_order: minSort - 1, is_active: true })
    .eq('id', imageId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  await syncProductPrincipalImage(productId);

  return { data: normalizeProductImage(data), error: null };
}

export async function toggleProductImageActive(imageId, currentActive) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('product_images')
    .update({ is_active: !currentActive, ...(currentActive ? { is_primary: false } : {}) })
    .eq('id', imageId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  await syncProductPrincipalImage(data.product_id);
  return { data: normalizeProductImage(data), error: null };
}

export async function deleteProductImageRecord(imageId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data: beforeDelete } = await supabase
    .from('product_images')
    .select('product_id')
    .eq('id', imageId)
    .maybeSingle();

  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (!error && beforeDelete?.product_id) {
    await syncProductPrincipalImage(beforeDelete.product_id);
  }
  return { data: { id: imageId }, error };
}

export async function updateProductImageRecord(imageId, patch) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {};
  if (Object.prototype.hasOwnProperty.call(patch, 'variant_label')) {
    payload.variant_label = String(patch.variant_label || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'sort_order')) {
    payload.sort_order = Number(patch.sort_order || 0);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'is_active')) {
    payload.is_active = Boolean(patch.is_active);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'is_primary')) {
    payload.is_primary = Boolean(patch.is_primary);
  }

  const { data, error } = await supabase
    .from('product_images')
    .update(payload)
    .eq('id', imageId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  if (
    Object.prototype.hasOwnProperty.call(patch, 'sort_order') ||
    Object.prototype.hasOwnProperty.call(patch, 'is_active') ||
    Object.prototype.hasOwnProperty.call(patch, 'is_primary')
  ) {
    await syncProductPrincipalImage(data.product_id);
  }

  return { data: normalizeProductImage(data), error: null };
}

export async function toggleProductActive(productId, currentActive) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: !currentActive })
    .eq('id', productId)
    .select('id')
    .single();

  return { data, error };
}

export async function deleteProductRecord(productId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);
  return { data: { id: productId }, error };
}

export async function bulkUpdateProducts(productIds, action) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { data: null, error: new Error('No products selected.') };
  }

  if (action === 'activate' || action === 'deactivate') {
    const { error } = await supabase
      .from('products')
      .update({ is_active: action === 'activate' })
      .in('id', productIds);
    return { data: { count: productIds.length }, error };
  }

  if (action === 'delete') {
    const { error } = await supabase.from('products').delete().in('id', productIds);
    return { data: { count: productIds.length }, error };
  }

  return { data: null, error: new Error('Unsupported bulk action.') };
}

export async function upsertCategoryRecord(categoryInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {
    name: String(categoryInput.name || '').trim(),
    slug: String(categoryInput.slug || '').trim(),
    description: String(categoryInput.description || '').trim() || null
  };

  if (categoryInput.id) {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', categoryInput.id)
      .select('id')
      .single();
    return { data, error };
  }

  const { data, error } = await supabase.from('categories').insert(payload).select('id').single();
  return { data, error };
}

export async function deleteCategoryRecord(categoryId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .select('id')
    .single();
  return { data, error };
}

export async function upsertTagRecord(tagInput) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const payload = {
    name: String(tagInput.name || '').trim(),
    slug: String(tagInput.slug || '').trim()
  };

  if (tagInput.id) {
    const { data, error } = await supabase.from('tags').update(payload).eq('id', tagInput.id).select('id').single();
    return { data, error };
  }

  const { data, error } = await supabase.from('tags').insert(payload).select('id').single();
  return { data, error };
}

export async function deleteTagRecord(tagId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase.from('tags').delete().eq('id', tagId).select('id').single();
  return { data, error };
}
