import { db } from '@/lib/db';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag, Star, Users, CheckCircle,
  ArrowRight, Phone, Package, Award,
  ChevronRight, MessageCircle,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

async function getProduct() {
  const product = await db.product.findFirst({
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
  });
  if (!product) return null;
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      cost:  Number(v.cost),
    })),
  };
}

// ─── Static content ───────────────────────────────────────────────────────────

// const PHOTOS = [
//   { src: 'https://tapesingkongSaleskafe.wordpress.com/wp-content/uploads/2026/02/icon-tape-singkong.jpg',    alt: ' Sales — tampak atas' },
//   { src: 'https://tapesingkongSaleskafe.wordpress.com/wp-content/uploads/2026/02/img20251207170428.jpg',    alt: ' segar baru jadi' },
//   { src: 'https://tapesingkongSaleskafe.wordpress.com/wp-content/uploads/2026/02/img20251207215953.jpg',    alt: ' siap disajikan' },
//   { src: 'https://tapesingkongSaleskafe.wordpress.com/wp-content/uploads/2026/02/img20251207165744.jpg',    alt: 'Tekstur kenyel ' },
// ];

const PILLARS = [
  { icon: '🌾', title: 'Singkong Pilihan',    desc: 'Dipilih langsung dari petani lokal, segar setiap hari.' },
  { icon: '⏳', title: 'Fermentasi Alami',    desc: 'Tanpa pengawet. Proses alami menghasilkan rasa manis sempurna.' },
  { icon: '❤️', title: 'Dibuat dengan Cinta', desc: 'Setiap porsi dibuat tangan dengan standar kualitas tinggi.' },
];

const STEPS = [
  { n: '01', title: 'Pilih Varian',    desc: 'Lihat pilihan varian dan kemasan yang tersedia di bawah ini.' },
  { n: '02', title: 'Hubungi Kami',    desc: 'Chat WhatsApp kami. Kami akan konfirmasi stok dan harga.' },
  { n: '03', title: 'Terima Pesanan',  desc: 'Ambil sendiri atau atur pengiriman. Nikmati selagi segar!' },
];

const TESTIMONIALS = [
  {
    name:   'Ibu Rahma',
    role:   'Pelanggan Setia',
    text:   'nya enak banget! Kenyel kayak mochi, manisnya pas. Keluarga saya langsung ketagihan.',
    rating: 5,
  },
  {
    name:   'Pak Dani',
    role:   'Oleh-oleh dari Bekasi',
    text:   'Bawa buat oleh-oleh ke kantor, semua pada minta lagi. Kemasannya rapi, aromanya harum sekali.',
    rating: 5,
  },
  {
    name:   'Mbak Sari',
    role:   'Member Sales',
    text:   'Sudah langganan tiap minggu. Selain enak, punya kartu member jadi makin hemat. Alhamdulillah!',
    rating: 5,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {  const product = await getProduct();
  const prices  = product?.variants.map((v) => v.price) ?? [];
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Sticky navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent tracking-tight">
            Sales Record
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#produk"
              className="hidden sm:inline text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              Produk
            </a>
            <a
              href="#cara-pesan"
              className="hidden sm:inline text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              Cara Pesan
            </a>
            <a
              href="#tentang"
              className="hidden sm:inline text-sm text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              Tentang
            </a>
            <Link
              href="/register"
              style={{textDecoration:"underline"}}
              className="text-sm font-medium hover:text-blue-600 transition-all px-4 py-1.5 rounded-md"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all px-4 py-1.5 rounded-md"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-green-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 grid lg:grid-cols-2 gap-12 items-center">

          {/* Text */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-blue-400 uppercase mb-6 animate-fade-up">
              <span className="w-6 h-px bg-blue-400" />
               Sales Record
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-fade-up-delay-1">
              Harum. Manis.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Alami.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-3 animate-fade-up-delay-2">
              Yummy seperti Yuppy — Kenyel seperti Mochi.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 animate-fade-up-delay-2">
               premium buatan tangan, difermentasi alami tanpa pengawet.
              Alhamdulillah, bismillah. 🤲
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up-delay-3">
              <a
                href="https://wa.me/6282302312687?text=Halo%20Sales%20Kafe!%20Saya%20ingin%20memesan%20Tape%20Singkong."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4" />
                Pesan via WhatsApp
              </a>
              <a
                href="#produk"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all border border-white/10 hover:border-white/20"
              >
                Lihat Produk
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/10 animate-fade-up-delay-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400 mt-0.5">Alami</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">⭐ 5.0</p>
                <p className="text-xs text-slate-400 mt-0.5">Rating</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-slate-400 mt-0.5">Pengawet</p>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative hidden lg:block animate-fade-up-delay-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20 rounded-2xl" />
            <img
              // src={PHOTOS[0].src}
              // alt={PHOTOS[0].alt}
              className="w-full h-[460px] object-cover rounded-2xl shadow-2xl shadow-black/60 border border-white/5"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold">Fermentasi Alami</p>
                <p className="text-[10px] text-slate-500">Tanpa bahan pengawet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand pillars ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex items-start gap-4">
              <span className="text-3xl shrink-0">{p.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product showcase ───────────────────────────────────────────────── */}
      <section id="produk" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">Produk Kami</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {product?.name ?? ' Sales'}
            </h2>
            <p className="text-slate-500 leading-relaxed">
              {product?.description ?? ' premium buatan tangan dengan fermentasi alami. Harum, manis, dan kenyel sempurna.'}
            </p>
          </div>

          {/* Price range banner */}
          {prices.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mb-10 p-5 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600">
                <Package className="w-5 h-5" />
                <span className="font-semibold text-lg">
                  {minPrice === maxPrice
                    ? formatCurrency(minPrice)
                    : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`}
                </span>
              </div>
              <span className="text-slate-400 text-sm">·</span>
              <span className="text-sm text-slate-600">{product?.variants.length} varian tersedia</span>
              <span className="text-slate-400 text-sm">·</span>
              <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">
                Stok tersedia
              </span>
            </div>
          )}

          {/* Variants grid */}
          {product && product.variants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {product.variants.map((variant, i) => {
                const stockStatus = variant.stock === 0 ? 'empty' : variant.stock <= variant.lowStock ? 'low' : 'ok';
                const dotColor = { empty: 'bg-red-400', low: 'bg-yellow-400', ok: 'bg-green-400' }[stockStatus];
                const stockText = { empty: 'Habis', low: 'Stok Terbatas', ok: 'Tersedia' }[stockStatus];
                const stockBadge = {
                  empty: 'bg-red-50 text-red-600 border-red-100',
                  low:   'bg-yellow-50 text-yellow-700 border-yellow-100',
                  ok:    'bg-green-50 text-green-700 border-green-100',
                }[stockStatus];

                return (
                  <div
                    key={variant.id}
                    className="group relative border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    {/* Accent on hover */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 to-green-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

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
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(variant.price)}</p>
                        {variant.points > 0 && (
                          <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3" />
                            +{variant.points} poin member
                          </p>
                        )}
                      </div>
                      <a
                        href={`https://wa.me/6282302312687?text=Halo%20Sales%20Kafe!%20Saya%20ingin%20memesan%3A%20${encodeURIComponent(variant.name)}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
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
            /* No DB data fallback */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { name: 'Porsi Original',       sku: 'TMK-001', price: 'Rp 25.000', note: 'Per porsi' },
                { name: 'Kemasan Jumbo',         sku: 'TMK-002', price: 'Rp 45.000', note: 'Isi lebih banyak' },
                { name: 'Paket Oleh-oleh',       sku: 'TMK-003', price: 'Rp 65.000', note: 'Box eksklusif' },
              ].map((v) => (
                <div key={v.sku} className="border border-slate-200 rounded-xl p-5 bg-white">
                  <p className="font-semibold text-slate-900 text-sm mb-1">{v.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono mb-3">{v.sku} · {v.note}</p>
                  <p className="text-xl font-bold text-blue-600">{v.price}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <a
              href="https://wa.me/6282302312687?text=Halo%20Sales%20Kafe!%20Saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20produk."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-8 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Kami untuk Pemesanan
            </a>
          </div>
        </div>
      </section>

      {/* ── Photo gallery ─────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 sm:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Galeri</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Lihat Sendiri Kualitasnya
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Foto asli, tanpa filter berlebihan. Apa yang Anda lihat adalah apa yang Anda dapatkan.
            </p>
          </div>

          {/* Asymmetric gallery grid */}
          <div className="grid grid-cols-12 gap-3 h-[480px] sm:h-[520px]">
            <div className="col-span-7 row-span-2 relative rounded-2xl overflow-hidden">
              {/* <img src={PHOTOS[0].src} alt={PHOTOS[0].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /> */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white text-sm font-medium">Tekstur kenyel seperti mochi</p>
            </div>
            <div className="col-span-5 relative rounded-2xl overflow-hidden">
              {/* <img src={PHOTOS[1].src} alt={PHOTOS[1].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /> */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <p className="absolute bottom-3 left-3 text-white text-xs font-medium">Segar setiap hari</p>
            </div>
            <div className="col-span-2 relative rounded-2xl overflow-hidden">
              {/* <img src={PHOTOS[2].src} alt={PHOTOS[2].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /> */}
            </div>
            <div className="col-span-3 relative rounded-2xl overflow-hidden">
              {/* <img src={PHOTOS[3].src} alt={PHOTOS[3].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /> */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <p className="absolute bottom-3 left-3 text-white text-xs font-medium">Aroma harum alami</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How to order ──────────────────────────────────────────────────── */}
      <section id="cara-pesan" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">Cara Memesan</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Mudah &amp; Cepat</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Hanya 3 langkah untuk menikmati  segar kami.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {STEPS.map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center group">
                {/* Step number */}
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-5 text-xl font-black tracking-tight group-hover:bg-blue-600 transition-colors duration-300 shadow-lg shadow-slate-200 relative z-10">
                  {step.n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>

                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden sm:block absolute top-[calc(2rem+2px)] -right-4 text-slate-300 w-5 h-5 z-20" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <a
              href="https://wa.me/6282302312687"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4" />
              Mulai Pesan Sekarang
            </a>
          </div>
        </div>
      </section>

      {/* ── About / brand story ───────────────────────────────────────────── */}
      <section id="tentang" className="bg-slate-50 border-y border-slate-100 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {/* <img src={PHOTOS[1].src} alt="" className="w-full h-52 object-cover rounded-2xl shadow-md" />
              <img src={PHOTOS[2].src} alt="" className="w-full h-52 object-cover rounded-2xl shadow-md mt-6" /> */}
            </div>
            {/* Floating quote */}
            <div className="absolute -bottom-5 left-4 right-4 bg-white rounded-xl p-4 shadow-xl border border-slate-100">
              <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                "Harum Wangi Manis Alami — Alhamdulillah, bismillah."
              </p>
              <p className="text-xs text-slate-400 mt-1">— Sales Record</p>
            </div>
          </div>

          <div className="pt-10 lg:pt-0">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-4">Tentang Kami</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 leading-snug">
              Warisan rasa yang dibuat<br/>dengan sepenuh hati
            </h2>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>
                Sales Record lahir dari kecintaan mendalam pada cita rasa tradisional Indonesia.
                 bukan sekadar camilan — ia adalah warisan budaya, hasil kerja keras,
                dan ungkapan rasa syukur.
              </p>
              <p>
                Setiap batch kami dibuat dengan singkong pilihan terbaik, difermentasi secara alami
                tanpa campuran bahan kimia. Prosesnya membutuhkan kesabaran dan ketelitian, karena
                kami percaya kualitas tidak bisa terburu-buru.
              </p>
              <p>
                Kami berkomitmen untuk terus menghadirkan  yang harum, manis, dan kenyel
                — persis seperti yang dulu Anda nikmati bersama keluarga.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
              {[
                { icon: <ShoppingBag className="w-5 h-5" />, label: 'Pesanan Selesai', val: '200+' },
                { icon: <Users         className="w-5 h-5" />, label: 'Pelanggan Puas',  val: '150+' },
                { icon: <Star          className="w-5 h-5" />, label: 'Rating Rata-rata', val: '5.0 ⭐' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-xl mb-2">
                    {stat.icon}
                  </div>
                  <p className="text-xl font-black text-slate-900">{stat.val}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">Testimoni</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Yang Mereka Katakan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                {/* Quote mark */}
                <span className="absolute top-5 right-6 text-5xl font-serif text-blue-100 leading-none select-none">
                  "
                </span>

                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Member loyalty teaser ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
            <Award className="w-3.5 h-3.5" />
            Program Member
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Belanja lebih, dapat
            <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent"> lebih banyak</span>.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-4">
            Daftar sebagai member Sales Record dan dapatkan poin reward di setiap pembelian.
            Tukar poin dengan diskon langsung!
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400 mb-10">
            {['Poin di setiap transaksi', 'Tukar poin jadi diskon', 'Riwayat belanja lengkap', 'Akses eksklusif member'].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {b}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-8 py-3.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Daftar Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm px-8 py-3.5 rounded-lg transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-base font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              Sales Record
            </p>
            <p className="text-xs text-slate-500 mt-1"> — Harum, Manis, Alami 🤲</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#produk"    className="hover:text-white transition-colors">Produk</a>
            <a href="#cara-pesan" className="hover:text-white transition-colors">Cara Pesan</a>
            <a href="#tentang"   className="hover:text-white transition-colors">Tentang</a>
            <Link href="/login"  className="hover:text-white transition-colors">Login</Link>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Sales Record</p>
        </div>
      </footer>

    </div>
  );
}