export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { MessageCircle, Star, ShoppingBag, Package, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { LandingFilters } from '@/components/landing/landing-filters';
import { Suspense } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  return products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      cost:  Number(v.cost),
    })),
  }));
}

const WA_NUMBER = '6282331312555';
const waLink = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; product?: string }>;
}) {
  const params    = await searchParams;
  const query     = (params.q || '').toLowerCase().trim();
  const sort      = params.sort || 'default';
  const productId = params.product || '';

  const allProducts   = await getProducts();
  const allVariants   = allProducts.flatMap((p) => p.variants);
  const allPrices     = allVariants.map((v) => v.price);
  const minPrice      = allPrices.length ? Math.min(...allPrices) : 0;
  const totalProducts = allProducts.length;

  // ── Filter ────────────────────────────────────────────────────────────────
  let products = allProducts;

  // Filter by selected product
  if (productId) {
    products = products.filter(p => p.id === productId);
  }

  // Filter by search query — matches product name, description, variant name, or SKU
  if (query) {
    products = products
      .map(p => ({
        ...p,
        variants: p.variants.filter(v =>
          v.name.toLowerCase().includes(query) ||
          v.sku.toLowerCase().includes(query)
        ),
      }))
      .filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        p.variants.length > 0
      );
  }

  // ── Sort variants within each product ────────────────────────────────────
  products = products.map(p => ({
    ...p,
    variants: [...p.variants].sort((a, b) => {
      if (sort === 'price_asc')  return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'name_asc')   return a.name.localeCompare(b.name);
      if (sort === 'name_desc')  return b.name.localeCompare(a.name);
      return 0;
    }),
  }));

  // Also sort products themselves by name if name sort selected
  if (sort === 'name_asc')  products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'name_desc') products = [...products].sort((a, b) => b.name.localeCompare(a.name));

  const hasResults = products.some(p => p.variants.length > 0);

  return (
    <div className="min-h-screen bg-[#f8fffe] text-slate-900 antialiased">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e0f9fc]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-[#028697] flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#028697] leading-none">Dapur Lisa</p>
              <p className="text-[9px] text-slate-400 leading-none tracking-wide mt-0.5">Homemade · Halal</p>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#028697] via-[#039aad] to-[#1ecbe1] overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-lg mx-auto px-4 pt-8 pb-6 relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3 h-3 text-white/80" />
            <span className="text-[11px] font-semibold text-white/80 tracking-wide">Produk Homemade</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
            Dapur Lisa
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
            Kue & makanan buatan tangan dengan bahan pilihan. Pesan langsung, dikirim segar.
          </p>

          <div className="flex items-center gap-2.5 mb-6">
            <a
              href={waLink('Halo Dapur Lisa! Saya ingin tahu lebih lanjut tentang produk.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white text-[#028697] font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Kami
            </a>
            <a
              href="#katalog"
              className="flex items-center gap-1.5 text-white/80 text-sm font-medium hover:text-white transition-colors"
            >
              Lihat Katalog
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {allPrices.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-semibold leading-none mb-1">Produk</p>
                <p className="text-sm font-bold text-white leading-none">{totalProducts} jenis</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-semibold leading-none mb-1">Mulai dari</p>
                <p className="text-sm font-bold text-white leading-none">{formatCurrency(minPrice)}</p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-semibold leading-none mb-1">Varian</p>
                <p className="text-sm font-bold text-white leading-none">{allVariants.length} pilihan</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 bg-[#f8fffe]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── Filters + Catalogue ─────────────────────────────────────────────── */}
      <div id="katalog" className="max-w-lg mx-auto px-4 pb-28">

        {/* Filters — client component wrapped in Suspense for streaming */}
        <Suspense fallback={<div className="h-24" />}>
          <LandingFilters products={allProducts.map(p => ({ id: p.id, name: p.name }))} />
        </Suspense>

        {/* Results count */}
        {(query || productId) && (
          <p className="text-xs text-slate-400 pt-3 pb-1">
            {hasResults
              ? `${products.reduce((n, p) => n + p.variants.length, 0)} varian ditemukan`
              : 'Tidak ada hasil'}
          </p>
        )}

        {/* Products */}
        {!hasResults ? (
          <div className="text-center py-20 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Produk tidak ditemukan</p>
            <p className="text-xs mt-1">Coba kata kunci atau filter lain</p>
          </div>
        ) : (
          <div className="space-y-8 pt-4">
            {products.map((product) => {
              if (product.variants.length === 0) return null;
              const prices     = product.variants.map((v) => v.price);
              const minP       = Math.min(...prices);
              const isPreorder = product.type === 'PREORDER';

              return (
                <section key={product.id}>
                  {/* Product header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900">{product.name}</h2>
                        {isPreorder && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" />
                            Pre Order
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{product.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-slate-400">mulai</p>
                      <p className="text-sm font-bold text-[#028697]">{formatCurrency(minP)}</p>
                    </div>
                  </div>

                  {/* Variant cards — 2 col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {product.variants.map((variant) => {
                      const isOutOfStock = !isPreorder && variant.stock === 0;
                      const isLowStock   = !isPreorder && variant.stock > 0 && variant.stock <= variant.lowStock;

                      const stockBadge = isPreorder
                        ? { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: '', label: 'Pre Order', icon: true }
                        : isOutOfStock
                        ? { bg: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-400', label: 'Habis', icon: false }
                        : isLowStock
                        ? { bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-400', label: 'Terbatas', icon: false }
                        : { bg: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-400', label: 'Tersedia', icon: false };

                      const orderText = `Halo Dapur Lisa! Saya ingin memesan produk: *${product.name}* varian *${variant.name}*.`;

                      return (
                        <div
                          key={variant.id}
                          className={`relative flex flex-col bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                            isOutOfStock
                              ? 'border-slate-100 opacity-60'
                              : 'border-slate-200 hover:border-[#028697]/40 hover:shadow-md active:scale-[0.98]'
                          }`}
                        >
                          <div className={`h-1 w-full ${isPreorder ? 'bg-amber-300' : isOutOfStock ? 'bg-slate-200' : 'bg-gradient-to-r from-[#028697] to-[#1ecbe1]'}`} />

                          <div className="p-3 flex flex-col gap-2 flex-1">
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-snug">{variant.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{variant.sku}</p>
                            </div>

                            <span className={`self-start inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stockBadge.bg}`}>
                              {stockBadge.icon
                                ? <Clock className="w-2.5 h-2.5" />
                                : <span className={`w-1.5 h-1.5 rounded-full ${stockBadge.dot}`} />
                              }
                              {stockBadge.label}
                            </span>

                            <div className="mt-auto">
                              <p className="text-base font-extrabold text-[#028697] leading-none">{formatCurrency(variant.price)}</p>
                              {variant.points > 0 && (
                                <p className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-1">
                                  <Star className="w-2.5 h-2.5" />
                                  +{variant.points} poin
                                </p>
                              )}
                            </div>

                            <a
                              href={waLink(orderText)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-disabled={isOutOfStock}
                              className={`mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all ${
                                isOutOfStock
                                  ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                  : 'bg-[#028697] text-white hover:bg-[#027080] active:scale-95'
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {isOutOfStock ? 'Habis' : 'Pesan'}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating WhatsApp ────────────────────────────────────────────────── */}
      <div className="fixed bottom-12 right-4 z-50">
        <a
          href={waLink('Halo Dapur Lisa! Saya ingin tahu lebih lanjut tentang produk.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs font-semibold px-4 py-3 rounded-full shadow-lg transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e0f9fc] bg-white">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} Dapur Lisa</p>
          <Link href="/login" className="text-[11px] text-slate-400 hover:text-[#028697] transition-colors">
            Login
          </Link>
        </div>
      </footer>
    </div>
  );
}