'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Printer, Pencil, Gift, Trash2, AlertTriangle } from 'lucide-react';
import { EditSaleDialog } from './edit-sale-dialog';
import { deleteSaleAction } from '@/actions/sales';

interface SaleDetailsDialogProps {
  sale: {
    id: string;
    saleNumber: string;
    customerId: string | null;
    createdAt: Date;
    subtotal: number;
    discount: number;
    tax: number;
    ongkir: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    notes: string | null;
    pointsEarned: number;
    pointsRedeemed?: number;
    customer: {
      name: string;
      email: string;
      phone?: string | null;
      address?: string | null;
    } | null;
    nonMemberCustomer: {
      name: string;
      phone: string;
      address: string | null;
    } | null;
    cashier: {
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      subtotal: number;
      variant: {
        id: string;
        name: string;
        sku: string;
        stock: number;
        product: {
          name: string;
        };
      };
    }>;
  };
  conversionRate?: number;
  userRole?: string;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    points: number;
    product: { name: string };
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function SaleDetailsDialog({ sale, conversionRate = 1000, userRole, variants = [], open, onOpenChange, onUpdate }: SaleDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteSaleAction(sale.id);
      if (result.success) {
        toast({ title: 'Berhasil!', description: `${sale.saleNumber} berhasil dihapus.` });
        onOpenChange(false);
        if (onUpdate) onUpdate();
      } else {
        toast({ title: 'Error', description: result.error || 'Gagal menghapus penjualan.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan yang tidak terduga.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const pointsRedeemed = sale.pointsRedeemed || 0;
  const pointDiscount = pointsRedeemed * conversionRate;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusLabel = sale.paymentStatus === 'PAID' ? 'Lunas' : sale.paymentStatus === 'PENDING' ? 'Pending' : 'Belum Lunas';
    const statusColor = sale.paymentStatus === 'PAID' ? '#16a34a' : sale.paymentStatus === 'PENDING' ? '#d97706' : '#dc2626';
    const statusBg   = sale.paymentStatus === 'PAID' ? '#f0fdf4' : sale.paymentStatus === 'PENDING' ? '#fffbeb' : '#fef2f2';

    const customerName = sale.customer?.name ?? sale.nonMemberCustomer?.name ?? 'Pelanggan Umum';
    const customerSub  = sale.customer
      ? [sale.customer.email, sale.customer.phone, sale.customer.address].filter(Boolean).join(' · ')
      : sale.nonMemberCustomer
      ? [sale.nonMemberCustomer.phone, sale.nonMemberCustomer.address].filter(Boolean).join(' · ')
      : '';

    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Invoice ${sale.saleNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --ink:     #0f172a;
            --muted:   #64748b;
            --line:    #e2e8f0;
            --surface: #f8fafc;
            --primary: #0f172a;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--ink);
            background: #fff;
            padding: 40px;
            max-width: 750px;
            margin: 0 auto;
            font-size: 13px;
            line-height: 1.2;
          }

          /* ── HEADER ── */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--line);
            margin-bottom: 24px;
          }
          .brand { display: flex; flex-direction: column; gap: 2px; }
          .brand-name {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1;
          }
          .brand-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }

          .invoice-badge {
            text-align: right;
          }
          .invoice-badge .word {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .invoice-badge .number {
            font-size: 16px;
            font-weight: 700;
            margin-top: 2px;
            color: var(--ink);
          }
          .invoice-badge .inv-date {
            font-size: 10px;
            color: var(--muted);
            margin-top: 2px;
          }

          /* ── BILL-TO ── */
          .party-box {
            background: var(--surface);
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 24px;
          }
          .party-label {
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 600;
            margin-bottom: 6px;
          }
          .party-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
          .party-detail { color: var(--muted); font-size: 12px; line-height: 1.3; }
          .party-inline {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
          }
          .party-inline-item { font-size: 11px; color: var(--muted); }
          .party-inline-item span { font-weight: 600; color: var(--ink); }
          .party-divider {
            width: 3px; height: 3px;
            border-radius: 50%;
            background: var(--muted);
            flex-shrink: 0;
            opacity: 0.4;
          }

          .status-pill {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            background: ${statusBg};
            color: ${statusColor};
          }
          .points-row {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 8px;
            font-size: 11px;
          }
          .points-earned { color: #2563eb; }
          .points-redeemed { color: #7c3aed; }

          /* ── TABLE ── */
          .section-title {
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 600;
            margin-bottom: 10px;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead tr { border-bottom: 1px solid var(--ink); }
          th {
            padding: 8px 10px;
            text-align: left;
            font-size: 9px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 600;
          }
          th.r, td.r { text-align: right; }
          td { padding: 7px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .item-name { font-weight: 600; font-size: 13px; }
          .item-meta { font-size: 11px; color: var(--muted); margin-top: 1px; line-height: 1.2; }

          /* ── BOTTOM (notes + totals side-by-side) ── */
          .bottom-wrap {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }
          .bottom-left { flex: 1; min-width: 0; }
          .bottom-right {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 260px;
            flex-shrink: 0;
          }

          /* ── TOTALS ── */
          .totals-box {
            width: 100%;
            border: 1px solid var(--line);
            border-radius: 6px;
            overflow: hidden;
          }
          .totals-inner { padding: 0 14px; }
          .totals-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px solid var(--line);
            font-size: 12px;
          }
          .totals-row:last-child { border-bottom: none; }
          .totals-row .label { color: var(--muted); }
          .totals-row.discount .val { color: #16a34a; }
          .totals-row.points-disc .val { color: #7c3aed; }
          .totals-row.ongkir .val { color: #d97706; }
          .total-final {
            background: var(--ink);
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            font-weight: 700;
            font-size: 15px;
          }

          /* ── PAYMENT INFO (full-width) ── */
          .payment-info {
            width: 100%;
            background: var(--surface);
            border-radius: 6px;
            border: 1px solid var(--line);
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .payment-info-label {
            font-size: 9px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 600;
            margin-bottom: 10px;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
          }
          .payment-col-title {
            font-size: 10px;
            font-weight: 700;
            color: var(--ink);
            letter-spacing: 0.03em;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--line);
          }
          .bank-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 3px 0;
            font-size: 11px;
          }
          .bank-row .label { color: var(--muted); min-width: 76px; }
          .bank-row .value { font-weight: 600; color: var(--ink); }
          .ewallet-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 3px 0;
            font-size: 11px;
          }
          .ewallet-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.03em;
            padding: 1px 6px;
            min-width: 44px;
            text-align: center;
          }
          .badge-dana  { background: #108de0; color: #fff; }
          .badge-gopay { background: #00aed6; color: #fff; }
          .badge-ovo   { background: #4c3494; color: #fff; }
          .badge-shopeepay { background: #ee4d2d; color: #fff; }
          .ewallet-number { font-weight: 600; color: var(--ink); }
          .ewallet-name   { color: var(--muted); font-size: 10px; margin-left: 2px; }

          /* ── NOTES ── */
          .notes-box {
            border-left: 2px solid var(--ink);
            padding: 10px 14px;
            background: var(--surface);
            border-radius: 0 6px 6px 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .notes-box strong { display: block; margin-bottom: 4px; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); font-weight: 600; }

          /* ── FOOTER ── */
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid var(--line);
          }
          .footer-left { font-size: 11px; color: var(--muted); }
          .footer-left strong { display: block; color: var(--ink); font-size: 12px; margin-bottom: 2px; }
          .footer-right { font-size: 10px; color: var(--muted); text-align: right; }

          /* ── BUTTONS ── */
          .print-btn-wrap { text-align: center; margin-top: 32px; display: flex; justify-content: center; gap: 10px; }
          .print-btn, .back-btn, .screenshot-btn, .share-btn {
            padding: 10px 32px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            letter-spacing: 0.01em;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .print-btn { background: var(--ink); color: #fff; }
          .print-btn:hover { opacity: 0.85; }
          .back-btn { background: var(--surface); color: var(--ink); border: 1px solid var(--line); }
          .back-btn:hover { background: var(--line); }
          .screenshot-btn { background: #f1f5f9; color: #0f172a; border: 1px solid var(--line); }
          .screenshot-btn:hover { background: #e2e8f0; }
          .share-btn { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .share-btn:hover { background: #dbeafe; }
          .screenshot-btn:disabled, .share-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .toast-msg {
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: #0f172a; color: #fff; padding: 8px 20px;
            border-radius: 8px; font-size: 12px; font-weight: 500;
            opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 9999;
          }
          .toast-msg.show { opacity: 1; }

          @media print {
            body { padding: 24px 32px; }
            .print-btn-wrap { display: none; }
          }
        </style>
      </head>
      <body>

        <!-- Header -->
        <div class="header">
          <div class="brand">
            <div class="brand-name"><></div>
            <div class="brand-sub">Official Invoice</div>
          </div>
          <div class="invoice-badge">
            <div class="word">Invoice</div>
            <div class="number">${sale.saleNumber}</div>
            <div class="inv-date">${formatDateTime(sale.createdAt)}</div>
          </div>
        </div>

        <!-- Bill To -->
        <div class="party-box">
          <div class="party-label">Tagihan Kepada</div>
          <div class="party-name">${customerName}</div>
          ${customerSub ? `<div class="party-detail">${customerSub}</div>` : ''}
          <div class="party-inline">
            <div class="party-inline-item"><span>${sale.paymentMethod}</span></div>
            <div class="party-divider"></div>
            <div class="party-inline-item"><span class="status-pill">${statusLabel}</span></div>
            ${sale.customer && sale.pointsEarned > 0 ? `
            <div class="party-divider"></div>
            <div class="party-inline-item points-earned">+${sale.pointsEarned} poin diperoleh</div>` : ''}
            ${pointsRedeemed > 0 ? `
            <div class="party-divider"></div>
            <div class="party-inline-item points-redeemed">◆ ${pointsRedeemed} poin ditukarkan</div>` : ''}
          </div>
        </div>

        <!-- Items table -->
        <div class="section-title">Rincian Pesanan</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="r">Harga Satuan</th>
              <th class="r">Qty</th>
              <th class="r">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>
                  <div class="item-name" classname=" text-xs">${item.variant.name}</div>
                  <div class="item-meta">${item.variant.product.name} &nbsp;·&nbsp; ${item.variant.sku}</div>
                </td>
                <td class="r" style="font-weight:100;">${formatCurrency(item.price)}</td>
                <td class="r item-meta" style="font-weight:600;">x ${item.quantity}</td>
                <td class="r" style="font-weight:600;">${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Bottom: Notes (left) + Totals & Bank (right) -->
        <div class="bottom-wrap">
          <!-- Left: Notes -->
          <div class="bottom-left">
            ${sale.notes ? `
            <div class="notes-box">
              <strong>Catatan</strong>
              ${sale.notes}
            </div>` : ''}
          </div>

          <!-- Right: Totals only -->
          <div class="bottom-right">
            <div class="totals-box">
              <div class="totals-inner">
                <div class="totals-row">
                  <span class="label">Subtotal</span>
                  <span class="val">${formatCurrency(sale.subtotal)}</span>
                </div>
                ${sale.discount > 0 ? `
                <div class="totals-row discount">
                  <span class="label">Diskon</span>
                  <span class="val">− ${formatCurrency(sale.discount)}</span>
                </div>` : ''}
                ${pointsRedeemed > 0 ? `
                <div class="totals-row points-disc">
                  <span class="label">Diskon Poin (${pointsRedeemed} pts)</span>
                  <span class="val">− ${formatCurrency(pointDiscount)}</span>
                </div>` : ''}
                ${sale.tax > 0 ? `
                <div class="totals-row">
                  <span class="label">Pajak</span>
                  <span class="val">${formatCurrency(sale.tax)}</span>
                </div>` : ''}
                ${sale.ongkir > 0 ? `
                <div class="totals-row ongkir">
                  <span class="label">Ongkir</span>
                  <span class="val">+ ${formatCurrency(sale.ongkir)}</span>
                </div>` : ''}
              </div>
              <div class="total-final">
                <span>Total</span>
                <span>${formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info: full width, bank + e-wallet -->
        <div class="payment-info">
          <div class="payment-info-label">Informasi Pembayaran</div>
          <div class="payment-grid">
            <!-- Bank Transfer -->
            <div>
              <div class="payment-col-title">Transfer Bank</div>
              <div class="bank-row">
                <span class="label">Bank</span>
                <span class="value">Bank Syariah Indonesia (BSI)</span>
              </div>
              <div class="bank-row">
                <span class="label">No. Rekening</span>
                <span class="value">7244 2022 46</span>
              </div>
              <div class="bank-row">
                <span class="label">Atas Nama</span>
                <span class="value">Lisharyati</span>
              </div>
            </div>
            <!-- E-Wallet -->
            <div>
              <div class="payment-col-title">E-Wallet</div>
              <div class="ewallet-row">
                <span class="ewallet-badge badge-dana">DANA</span>
                <span class="ewallet-number">0823-3131-2555</span>
                <span class="ewallet-name">Muh Yusran Ash Shiddiq</span>
              </div>
              <!-- <div class="ewallet-row"> -->
                <!-- <span class="ewallet-badge badge-gopay">GoPay</span> -->
                <!-- <span class="ewallet-number">0823-3131-2555</span> -->
                <!-- <span class="ewallet-name">Muh Yusran Ash Shiddiq</span> -->
              <!-- </div> -->
              <!-- <div class="ewallet-row"> -->
                <!-- <span class="ewallet-badge badge-ovo">OVO</span> -->
                <!-- <span class="ewallet-number">0823-3131-2555</span> -->
                <!-- <span class="ewallet-name">Muh Yusran Ash Shiddiq</span> -->
              <!-- </div> -->
              <!-- <div class="ewallet-row"> -->
                <!-- <span class="ewallet-badge badge-shopeepay">ShopeePay</span> -->
                <!-- <span class="ewallet-number">0823-3131-2555</span> -->
                <!-- <span class="ewallet-name">Muh Yusran Ash Shiddiq</span> -->
              <!-- </div> -->
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-left">
            <strong>Terima kasih atas kepercayaan Anda!</strong>
            Dokumen ini digenerate secara otomatis.
          </div>
          <div class="footer-right">
            Diinput oleh ${sale.cashier.name}<br>
            Dicetak pada ${new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="print-btn-wrap">
          <button class="back-btn" onclick="window.close()">← Kembali</button>
          <button class="screenshot-btn" id="screenshotBtn" onclick="captureInvoice('download')">📸 Screenshot</button>
          <button class="share-btn" id="shareBtn" onclick="captureInvoice('share')">📤 Bagikan</button>
          <button class="print-btn" onclick="window.print()">Cetak Invoice</button>
        </div>

        <div class="toast-msg" id="toastMsg"></div>

      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Inject script via DOM to avoid TSX parser issues with </script>
    // and bypass Next.js CSP restrictions on inline scripts
    const saleNumber = sale.saleNumber;
    const custName   = customerName;

    const injectScript = () => {
      const s = printWindow.document.createElement('script');
      s.textContent = `
        function showToast(msg) {
          var t = document.getElementById('toastMsg');
          t.textContent = msg;
          t.classList.add('show');
          setTimeout(function() { t.classList.remove('show'); }, 2800);
        }

        function setLoading(id, loading, originalText) {
          var btn = document.getElementById(id);
          btn.disabled = loading;
          btn.textContent = loading ? 'Memproses...' : originalText;
        }

        function captureInvoice(mode) {
          var btnId   = mode === 'share' ? 'shareBtn' : 'screenshotBtn';
          var origTxt = mode === 'share' ? '📤 Bagikan' : '📸 Screenshot';
          var wrap    = document.querySelector('.print-btn-wrap');
          var toast   = document.getElementById('toastMsg');

          setLoading(btnId, true, origTxt);
          wrap.style.visibility  = 'hidden';
          toast.style.visibility = 'hidden';

          html2canvas(document.body, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          }).then(function(canvas) {
            wrap.style.visibility  = '';
            toast.style.visibility = '';
            setLoading(btnId, false, origTxt);

            canvas.toBlob(function(blob) {
              var fileName = 'invoice-${saleNumber}.png';
              var file     = new File([blob], fileName, { type: 'image/png' });

              if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                  files: [file],
                  title: 'Invoice ${saleNumber}',
                  text: 'Invoice ${saleNumber} — ${custName}',
                }).catch(function(err) {
                  if (err.name !== 'AbortError') showToast('Gagal berbagi: ' + err.message);
                });
              } else {
                var url = URL.createObjectURL(blob);
                var a   = document.createElement('a');
                a.href     = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                if (mode === 'share') showToast('Share tidak didukung — gambar diunduh');
                else showToast('Screenshot tersimpan!');
              }
            }, 'image/png');
          }).catch(function(err) {
            wrap.style.visibility  = '';
            toast.style.visibility = '';
            setLoading(btnId, false, origTxt);
            showToast('Gagal mengambil screenshot');
            console.error(err);
          });
        }
      `;
      printWindow.document.body.appendChild(s);
    };

    if (printWindow.document.readyState === 'complete') {
      injectScript();
    } else {
      printWindow.addEventListener('load', injectScript);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <DialogTitle className='text-md'>Sale Details</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {sale.saleNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                   • {formatDateTime(sale.createdAt)} • 
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-initial">
                  <Printer className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print Invoice</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="flex-1 sm:flex-initial">
                  <Pencil className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                {userRole === 'ADMINISTRATOR' && (
                  confirmDelete ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-xs font-semibold text-red-700 whitespace-nowrap">Yakin hapus?</span>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded px-2 py-0.5 transition-colors"
                      >
                        {deleting ? 'Menghapus...' : 'Ya'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="flex-1 sm:flex-initial border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Hapus</span>
                    </Button>
                  )
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Pelanggan</h4>
                {sale.customer ? (
                  <>
                    <p className="text-sm font-medium">{sale.customer.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{sale.customer.email}</p>
                    {sale.customer.phone && (
                      <p className="text-xs sm:text-sm text-gray-600">{sale.customer.phone}</p>
                    )}
                    {sale.customer.address && (
                      <p className="text-xs sm:text-sm text-gray-600">{sale.customer.address}</p>
                    )}
                    {sale.pointsEarned > 0 && (
                      <p className="text-xs sm:text-sm text-blue-600 mt-2">+{sale.pointsEarned} poin bertambah</p>
                    )}
                    {pointsRedeemed > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        <p className="text-xs sm:text-sm text-purple-600 font-medium">-{pointsRedeemed} poin ditukar</p>
                      </div>
                    )}
                  </>
                ) : sale.nonMemberCustomer ? (
                  <>
                    <p className="text-sm font-medium">{sale.nonMemberCustomer.name}</p>
                    {sale.nonMemberCustomer.phone && (
                      <p className="text-xs sm:text-sm text-gray-600">{sale.nonMemberCustomer.phone}</p>
                    )}
                    {sale.nonMemberCustomer.address && (
                      <p className="text-xs sm:text-sm text-gray-600">{sale.nonMemberCustomer.address}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Pelanggan Umum</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Pembayaran</h4>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Metode:</span> {sale.paymentMethod}</p>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Cashier:</span> {sale.cashier.name}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    sale.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : sale.paymentStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sale.paymentStatus === 'PAID' ? 'Lunas' : sale.paymentStatus === 'PENDING' ? 'Pending' : 'Belum Lunas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-3 text-sm sm:text-base">Items</h4>
              <div className="border rounded-lg divide-y">
                {sale.items.map((item) => (
                  <div key={item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{item.variant.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{item.variant.product.name} • SKU: {item.variant.sku}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {pointsRedeemed > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-purple-600 font-medium">
                  <span>Discount ({pointsRedeemed} poin)</span>
                  <span>-{formatCurrency(pointDiscount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(sale.tax)}</span>
                </div>
              )}
              {sale.ongkir > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-orange-600">
                  <span>Ongkir</span>
                  <span className="font-medium">+{formatCurrency(sale.ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base text-blue-900">Notes</h4>
                <p className="text-xs sm:text-sm text-blue-800">{sale.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditSaleDialog
          sale={sale}
          variants={variants}
          userRole={userRole}
          conversionRate={conversionRate}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            setShowEditDialog(false);
            onOpenChange(false);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </>
  );
}