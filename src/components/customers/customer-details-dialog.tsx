'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Package, TrendingUp, CreditCard, Phone, MapPin, Mail, Calendar, Star, Sparkles, User } from 'lucide-react';
import { MemberCard } from '../member/member-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getCustomerPurchaseHistory } from '@/actions/customers';
import { CustomerDialog } from './customer-dialog';
import { CustomerDeleteButton } from './customer-delete-button';
import { NonMemberDialog } from './non-member-dialog';
import { UpgradeToMemberDialog } from './upgrade-to-member-dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteNonMemberCustomerAction } from '@/actions/customers';
import { DialogTitle } from '@radix-ui/react-dialog';

interface MemberCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  birthday?: Date | null;
  photoUrl?: string | null;
  points: number;
  createdAt: Date;
  sales: Array<{ id: string; total: any }>;
  _count: { sales: number };
  type: 'member';
}

interface NonMemberCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  sales: Array<{ id: string; total: any }>;
  _count: { sales: number };
  type: 'non-member';
}

type Customer = MemberCustomer | NonMemberCustomer;

interface CustomerDetailsDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActions?: boolean;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatFullDate(date: Date | string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight leading-none mb-1">{value}</p>
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
      {/* decorative circle */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  );
}

// ── purchase history item ─────────────────────────────────────────────────────

function HistoryItem({ sale, isMember }: { sale: any; isMember: boolean }) {
  const [open, setOpen] = useState(false);
  const statusColor =
    sale.paymentStatus === 'PAID'    ? 'bg-emerald-100 text-emerald-700' :
    sale.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                       'bg-red-100 text-red-700';
  const statusLabel =
    sale.paymentStatus === 'PAID'    ? 'Lunas' :
    sale.paymentStatus === 'PENDING' ? 'Pending' : 'Belum Lunas';

  return (
    <div className="group">
      {/* collapsed row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 hover:text-black transition-colors"
      >
        {/* date column */}
        <div className="shrink-0 w-10 text-center">
          <p className="text-lg font-bold text-gray-800 leading-none">
            {new Date(sale.createdAt).getDate()}
          </p>
          <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">
            {new Date(sale.createdAt).toLocaleDateString('id-ID', { month: 'short' })}
          </p>
        </div>

        {/* divider */}
        <div className="shrink-0 w-px h-10 bg-gray-200" />

        {/* main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{sale.saleNumber}</p>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {sale.items.length} item · {sale.paymentMethod}
            {isMember && sale.pointsEarned > 0 && (
              <span className="text-blue-500 ml-1.5">+{sale.pointsEarned} pts</span>
            )}
          </p>
        </div>

        {/* amount */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</p>
          <p className="text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">
            {open ? 'Tutup ▲' : 'Detail ▾'}
          </p>
        </div>
      </button>

      {/* expanded items */}
      {open && (
        <div className="mx-4 mb-3 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sale.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.variant.product.name}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-500">{item.variant.name}</span>
                  <span className="text-gray-400 text-xs ml-1.5">×{item.quantity}</span>
                </div>
                <span className="font-semibold text-gray-700 shrink-0 ml-4">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          {(sale.discount > 0 || (isMember && sale.pointsRedeemed > 0)) && (
            <div className="border-t border-gray-200 px-4 py-2.5 space-y-1">
              {sale.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Diskon</span>
                  <span>− {formatCurrency(sale.discount)}</span>
                </div>
              )}
              {isMember && sale.pointsRedeemed > 0 && (
                <div className="flex justify-between text-xs text-violet-600">
                  <span>Poin ditukar ({sale.pointsRedeemed} pts)</span>
                  <span>− {formatCurrency(sale.pointsRedeemed)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function CustomerDetailsDialog({
  customer, open, onOpenChange, showActions = false,
}: CustomerDetailsDialogProps) {
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSpent  = customer.sales.reduce((s, sale) => s + Number(sale.total), 0);
  const avgPurchase = customer._count.sales > 0 ? totalSpent / customer._count.sales : 0;
  const isMember    = customer.type === 'member';
  const initials    = getInitials(customer.name);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getCustomerPurchaseHistory(customer.id, !isMember)
        .then(setPurchaseHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, customer.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[680px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl"
      >
        <DialogTitle></DialogTitle>

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-5 overflow-hidden shrink-0">
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-24 translate-x-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-16 -translate-x-16 pointer-events-none" />

          <div className="relative flex items-start gap-4">
            {/* avatar */}
            <div className="shrink-0">
              {isMember && (customer as MemberCustomer).photoUrl ? (
                <img
                  src={(customer as MemberCustomer).photoUrl!}
                  alt={customer.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl border-2 border-white/20">
                  <span className="text-xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>

            {/* name + meta */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white leading-none">{customer.name}</h2>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  isMember
                    ? 'bg-violet-500/30 text-violet-300 border border-violet-400/30'
                    : 'bg-slate-600/60 text-slate-300 border border-slate-500/30'
                }`}>
                  {isMember ? '✦ Member' : 'Non-Member'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />{customer.phone}
                </span>
                {isMember && (customer as MemberCustomer).email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />{(customer as MemberCustomer).email}
                  </span>
                )}
              </div>

              {isMember && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/25 rounded-full px-3 py-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300 text-xs font-bold">
                    {(customer as MemberCustomer).points.toLocaleString('id-ID')} Poin
                  </span>
                </div>
              )}
            </div>

            {/* actions */}
            {showActions && (
              <div className="flex items-center gap-1.5 shrink-0">
                {isMember ? (
                  <>
                    <CustomerDialog
                      mode="edit"
                      customer={{
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address ?? undefined,
                        email: (customer as MemberCustomer).email ?? undefined,
                        birthday: (customer as MemberCustomer).birthday ?? undefined,
                        photoUrl: (customer as MemberCustomer).photoUrl ?? undefined,
                        points: (customer as MemberCustomer).points,
                      }}
                    />
                    <CustomerDeleteButton customerId={customer.id} />
                  </>
                ) : (
                  <>
                    <NonMemberDialog
                      customer={{
                        id: customer.id, name: customer.name,
                        phone: customer.phone, address: customer.address as string,
                      }}
                    />
                    <UpgradeToMemberDialog
                      customer={{
                        id: customer.id, name: customer.name,
                        phone: customer.phone, address: customer.address as string,
                      }}
                    />
                    <DeleteConfirmDialog
                      title="Hapus Non-Member"
                      description="Yakin ingin menghapus pelanggan ini? Pelanggan tidak dapat dihapus jika memiliki riwayat transaksi."
                      onConfirm={() => deleteNonMemberCustomerAction(customer.id)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── inline quick stats ── */}
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Transaksi', value: customer._count.sales.toString(), icon: <ShoppingCart className="w-3.5 h-3.5 text-slate-300" /> },
              { label: 'Total Belanja', value: formatCurrency(totalSpent), icon: <TrendingUp className="w-3.5 h-3.5 text-slate-300" /> },
              { label: 'Rata-rata', value: formatCurrency(avgPurchase), icon: <Star className="w-3.5 h-3.5 text-slate-300" /> },
            ].map(s => (
              <div key={s.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{s.label}</span></div>
                <p className="text-sm font-bold text-white truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100/80 rounded-xl p-1 h-auto">
              <TabsTrigger value="profile"   className="rounded-lg text-xs font-semibold py-2">Profil</TabsTrigger>
              <TabsTrigger value="statistics" className="rounded-lg text-xs font-semibold py-2">Statistik</TabsTrigger>
              <TabsTrigger value="history"   className="rounded-lg text-xs font-semibold py-2">Riwayat</TabsTrigger>
            </TabsList>
          </div>

          {/* ── PROFILE ── */}
          <TabsContent value="profile" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
            {isMember ? (
              <MemberCard
                user={{
                  id: customer.id,
                  name: customer.name,
                  email: (customer as MemberCustomer).email,
                  phone: customer.phone,
                  address: (customer as MemberCustomer).address,
                  birthday: (customer as MemberCustomer).birthday,
                  photoUrl: (customer as MemberCustomer).photoUrl,
                  points: (customer as MemberCustomer).points,
                  createdAt: customer.createdAt,
                }}
                showMembershipId
              />
            ) : (
              <div className="space-y-3">
                {[
                  { icon: <Phone className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Telepon', value: customer.phone },
                  { icon: <MapPin className="w-4 h-4 text-rose-500" />, bg: 'bg-rose-50', label: 'Alamat', value: customer.address as string },
                  { icon: <User className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50', label: 'Pelanggan Sejak', value: formatFullDate(customer.createdAt) },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                    <div className={`p-2 rounded-lg ${row.bg} shrink-0`}>{row.icon}</div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── STATISTICS ── */}
          <TabsContent value="statistics" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <StatCard
                icon={<ShoppingCart className="w-4 h-4 text-white" />}
                label="Total Transaksi"
                value={customer._count.sales.toString()}
                color="bg-gradient-to-br from-violet-500 to-indigo-600"
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                label="Total Belanja"
                value={formatCurrency(totalSpent)}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
            </div>
            <StatCard
              icon={<Star className="w-4 h-4 text-white" />}
              label="Rata-rata per Transaksi"
              value={formatCurrency(avgPurchase)}
              sub={customer._count.sales > 0 ? `Dari ${customer._count.sales} transaksi` : undefined}
              color="bg-gradient-to-br from-orange-500 to-rose-500"
            />

            {isMember && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-400/20">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-0.5">Saldo Poin</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {(customer as MemberCustomer).points.toLocaleString('id-ID')}
                    <span className="text-sm font-normal text-amber-500 ml-1">pts</span>
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── HISTORY ── */}
          <TabsContent value="history" className="flex-1 overflow-y-auto pb-6 mt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-sm">Memuat riwayat...</p>
              </div>
            ) : purchaseHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <div className="p-4 rounded-2xl bg-gray-100">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Belum ada riwayat transaksi</p>
              </div>
            ) : (
              <div className="px-2">
                {purchaseHistory.map((sale, i) => (
                  <div key={sale.id}>
                    <HistoryItem sale={sale} isMember={isMember} />
                    {i < purchaseHistory.length - 1 && (
                      <div className="mx-4 h-px bg-gray-100" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}