'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createVariantAction, updateVariantAction } from '@/actions/products';
import { Plus, Pencil, Loader2, Tag, Layers, DollarSign, BarChart2, Star, AlertTriangle } from 'lucide-react';

interface VariantDialogProps {
  mode: 'create' | 'edit';
  productId?: string;
  isPreorder?: boolean;
  variant?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
    lowStock: number;
    points: number;
  };
  trigger?: React.ReactNode;
}

function FieldLabel({
  icon: Icon,
  label,
  required,
  hint,
}: {
  icon?: React.ElementType;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-gray-400" />}
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      </div>
      {hint && <span className="text-[11px] text-gray-300">{hint}</span>}
    </div>
  );
}

function CurrencyInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none select-none">
        Rp
      </span>
      <Input
        id={id}
        name={name}
        type="tel"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9 h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 tabular-nums"
      />
    </div>
  );
}

export function VariantDialog({ mode, productId, isPreorder = false, variant, trigger }: VariantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [price, setPrice] = useState(variant?.price?.toString() || '');
  const [cost, setCost] = useState(variant?.cost?.toString() || '');
  const [points, setPoints] = useState(variant?.points?.toString() || '0');
  const [stock, setStock] = useState('0');
  const [lowStock, setLowStock] = useState(variant?.lowStock?.toString() || '10');

  const isCreate = mode === 'create';

  const formatNumber = (value: string): string => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const parseNumber = (value: string): string => value.replace(/,/g, '');

  const handleNumberChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => setter(formatNumber(value));

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      formData.set('price', parseNumber(price));
      formData.set('cost', parseNumber(cost));
      formData.set('points', parseNumber(points));
      formData.set('lowStock', isPreorder ? '0' : parseNumber(lowStock));

      if (isCreate) {
        formData.set('stock', isPreorder ? '0' : parseNumber(stock));
      }
      if (isCreate && productId) {
        formData.append('productId', productId);
      }

      const result = isCreate
        ? await createVariantAction(formData)
        : await updateVariantAction(variant!.id, formData);

      if (result.success) {
        toast({
          title: isCreate ? 'Varian berhasil dibuat!' : 'Varian diperbarui!',
          description: isCreate
            ? 'Varian baru sudah ditambahkan ke produk.'
            : 'Perubahan berhasil disimpan.',
        });
        setOpen(false);
      } else {
        toast({
          title: 'Terjadi kesalahan',
          description: result.error || 'Gagal menyimpan varian.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Terjadi kesalahan',
        description: 'Permintaan tidak dapat diproses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPrice(variant?.price?.toString() || '');
      setCost(variant?.cost?.toString() || '');
      setPoints(variant?.points?.toString() || '0');
      setStock('0');
      setLowStock(variant?.lowStock?.toString() || '10');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={isCreate ? 'outline' : 'ghost'} size="sm">
            {isCreate ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Varian
              </>
            ) : (
              <Pencil className="w-4 h-4" />
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-0 shadow-2xl"
      >
        {/* Header band */}
        <div className="relative bg-gradient-to-br from-[#028697] to-[#016d7a] px-6 pt-6 pb-8">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-8 w-16 h-16 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <DialogHeader className="space-y-0.5 text-left p-0">
              <DialogTitle className="text-white text-lg font-semibold leading-tight">
                {isCreate ? 'Varian Baru' : 'Edit Varian'}
              </DialogTitle>
              <p className="text-white/65 text-xs font-normal">
                {isCreate
                  ? isPreorder
                    ? 'Tambah varian — produk pre order, stok tidak dilacak'
                    : 'Tentukan harga, stok awal, dan poin reward'
                  : `Mengedit: ${variant?.name}`}
              </p>
            </DialogHeader>
          </div>

          {/* Pre-order pill */}
          {isPreorder && (
            <div className="relative mt-4 inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/30 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
              <span className="text-amber-100 text-[11px] font-medium">Pre Order</span>
            </div>
          )}
        </div>

        {/* Form body */}
        <form action={handleSubmit}>
          <div className="px-6 pt-5 pb-2 space-y-4">

            {/* Name + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Tag} label="Nama Varian" required />
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={variant?.name}
                  placeholder="Contoh: 500gr, Coklat"
                  disabled={loading}
                  maxLength={30}
                  className="h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <FieldLabel label="Kode SKU" required />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[9px] font-mono border border-gray-300 rounded px-1 py-0.5 text-gray-400 leading-none">
                      SKU
                    </span>
                  </span>
                  <Input
                    id="sku"
                    name="sku"
                    required
                    defaultValue={variant?.sku}
                    placeholder="KL-001-A"
                    disabled={loading}
                    maxLength={15}
                    className="pl-12 h-10 font-mono tracking-wider border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Pricing section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Harga</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Harga Jual" required />
                  <CurrencyInput
                    id="price"
                    name="price"
                    value={price}
                    onChange={(v) => handleNumberChange(v, setPrice)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
                <div>
                  <FieldLabel label="Harga Modal" required />
                  <CurrencyInput
                    id="cost"
                    name="cost"
                    value={cost}
                    onChange={(v) => handleNumberChange(v, setCost)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Live margin hint */}
              {price && cost && !isNaN(parseFloat(parseNumber(price))) && !isNaN(parseFloat(parseNumber(cost))) && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Margin:</span>
                  <span className={`text-[11px] font-semibold ${
                    parseFloat(parseNumber(price)) - parseFloat(parseNumber(cost)) >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}>
                    Rp {(parseFloat(parseNumber(price)) - parseFloat(parseNumber(cost))).toLocaleString('id-ID')}
                    {' '}
                    ({parseFloat(parseNumber(price)) > 0
                      ? Math.round(((parseFloat(parseNumber(price)) - parseFloat(parseNumber(cost))) / parseFloat(parseNumber(price))) * 100)
                      : 0}%)
                  </span>
                </div>
              )}
            </div>

            {/* Stock & reward section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  {isPreorder ? 'Reward' : 'Stok & Reward'}
                </span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              {!isPreorder ? (
                <div className={`grid gap-3 ${isCreate ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {isCreate && (
                    <div>
                      <FieldLabel icon={BarChart2} label="Stok Awal" required />
                      <Input
                        id="stock"
                        name="stock"
                        type="tel"
                        required
                        value={stock}
                        onChange={(e) => handleNumberChange(e.target.value, setStock)}
                        placeholder="0"
                        disabled={loading}
                        className="h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 tabular-nums"
                      />
                    </div>
                  )}
                  <div>
                    <FieldLabel icon={AlertTriangle} label="Alert Stok" required />
                    <Input
                      id="lowStock"
                      name="lowStock"
                      type="tel"
                      required
                      value={lowStock}
                      onChange={(e) => handleNumberChange(e.target.value, setLowStock)}
                      placeholder="10"
                      disabled={loading}
                      className="h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 tabular-nums"
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Star} label="Poin/item" hint="Opsional" />
                    <Input
                      id="points"
                      name="points"
                      type="tel"
                      value={points}
                      onChange={(e) => handleNumberChange(e.target.value, setPoints)}
                      placeholder="0"
                      disabled={loading}
                      className="h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 tabular-nums"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel icon={Star} label="Poin/item" hint="Opsional" />
                    <Input
                      id="points"
                      name="points"
                      type="tel"
                      value={points}
                      onChange={(e) => handleNumberChange(e.target.value, setPoints)}
                      placeholder="0"
                      disabled={loading}
                      className="h-10 border-gray-200 focus-visible:ring-[#028697]/30 focus-visible:border-[#028697] transition-colors placeholder:text-gray-300 tabular-nums"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-amber-700 leading-snug">
                      Stok tidak dilacak — dijual tanpa batas stok
                    </p>
                  </div>
                </div>
              )}

              {!isPreorder && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Poin diberikan ke member untuk tiap unit yang dibeli.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 mt-2 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#028697] hover:bg-[#027080] text-white shadow-sm min-w-[120px] transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </span>
              ) : isCreate ? (
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Buat Varian
                </span>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}