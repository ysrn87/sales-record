export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { MessageCircle, Star, ShoppingBag, Package } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getProducts() {
  const products = await db.product.findMany({
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const products      = await getProducts();
  const allVariants   = products.flatMap((p) => p.variants);
  const allPrices     = allVariants.map((v) => v.price);
  const minPrice      = allPrices.length ? Math.min(...allPrices) : 0;
  const maxPrice      = allPrices.length ? Math.max(...allPrices) : 0;
  const totalVariants = allVariants.length;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#e0f9fc] bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 rounded-lg bg-[#028697] flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[#028697]">Dapur Lisa</span>
          </Link>

          {/* Auth */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/register"
              className="text-xs font-medium text-slate-500 hover:text-[#028697] transition-colors px-3 py-1.5 rounded-md hover:bg-[#e0f9fc]"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold bg-[#028697] hover:bg-[#17a8bb] text-white transition-colors px-3.5 py-1.5 rounded-md"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ── Catalogue banner ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#e0f9fc] via-[#f0fdfe] to-[#d6f7fa] border-b border-[#b2eff7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[11px] font-semibold tracking-widest text-[#028697]/60 uppercase mb-4">
            Katalog Produk
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#028697] mb-2">
                Dapur Lisa
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Produk buatan tangan dengan bahan pilihan. Pesan langsung via WhatsApp.
              </p>
            </div>

            {/* Stats pills */}
            {allPrices.length > 0 && (
              <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-[#b2eff7] rounded-xl px-4 py-2.5 shadow-sm">
                  <Package className="w-4 h-4 text-[#028697] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">Harga</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      {minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white border border-[#b2eff7] rounded-xl px-4 py-2.5 shadow-sm">
                  <ShoppingBag className="w-4 h-4 text-[#1ecbe1] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">Varian</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      {totalVariants} pilihan
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Products ────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-12">

        {products.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada produk tersedia.</p>
          </div>
        ) : (
          products.map((product) => {
            const prices = product.variants.map((v) => v.price);
            const minP   = prices.length ? Math.min(...prices) : 0;
            const maxP   = prices.length ? Math.max(...prices) : 0;

            return (
              <section key={product.id}>

                {/* Product header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-0.5">{product.name}</h2>
                    {product.description && (
                      <p className="text-sm text-slate-500 leading-relaxed max-w-lg">{product.description}</p>
                    )}
                  </div>
                  {prices.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">mulai dari</span>
                      <span className="text-sm font-bold text-[#028697]">
                        {minP === maxP
                          ? formatCurrency(minP)
                          : `${formatCurrency(minP)} – ${formatCurrency(maxP)}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-[#e0f9fc] text-[#028697] font-medium px-2 py-0.5 rounded-full border border-[#b2eff7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1ecbe1] animate-pulse" />
                        {product.variants.length} varian
                      </span>
                    </div>
                  )}
                </div>

                {/* Variants grid */}
                {product.variants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.variants.map((variant) => {
                      const stockStatus = variant.stock === 0
                        ? 'empty'
                        : variant.stock <= variant.lowStock
                        ? 'low'
                        : 'ok';
                      const dotColor = {
                        empty: 'bg-red-400',
                        low:   'bg-yellow-400',
                        ok:    'bg-green-400',
                      }[stockStatus];
                      const stockText = {
                        empty: 'Habis',
                        low:   'Stok Terbatas',
                        ok:    'Tersedia',
                      }[stockStatus];
                      const stockBadge = {
                        empty: 'bg-red-50 text-red-600 border-red-100',
                        low:   'bg-yellow-50 text-yellow-700 border-yellow-100',
                        ok:    'bg-green-50 text-green-700 border-green-100',
                      }[stockStatus];

                      return (
                        <div
                          key={variant.id}
                          className="group relative border border-slate-200 rounded-xl p-5 hover:border-[#1ecbe1] hover:shadow-md transition-all duration-200 bg-white"
                        >
                          {/* Top accent */}
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#028697] to-[#1ecbe1] rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm leading-snug">{variant.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{variant.sku}</p>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${stockBadge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              {stockText}
                            </span>
                          </div>

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xl font-bold text-[#028697]">{formatCurrency(variant.price)}</p>
                              {variant.points > 0 && (
                                <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3" />
                                  +{variant.points} poin member
                                </p>
                              )}
                            </div>
                            <a
                              href={`https://wa.me/6282302312687?text=Halo%20Dapur%20Lisa!%20Saya%20ingin%20memesan%3A%20${encodeURIComponent(variant.name)}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#028697] hover:bg-[#17a8bb] text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Pesan
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Tidak ada varian aktif untuk produk ini.</p>
                )}
              </section>
            );
          })
        )}

        {/* CTA strip */}
        {products.length > 0 && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Ada pertanyaan? Hubungi kami langsung melalui WhatsApp.
            </p>
            <a
              href="https://wa.me/6282302312687?text=Halo%20Dapur%20Lisa!%20Saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20produk."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-all hover:shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi via WhatsApp
            </a>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e0f9fc] bg-[#f0fdfe]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#028697] flex items-center justify-center">
              <ShoppingBag className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-[#028697]">Dapur Lisa</span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            © {new Date().getFullYear()} Dapur Lisa. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <Link href="/register" className="hover:text-[#028697] transition-colors">Daftar</Link>
            <Link href="/login"    className="hover:text-[#028697] transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}