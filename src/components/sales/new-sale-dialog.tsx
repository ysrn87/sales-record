'use client';

import { useState } from 'react';
import { PaymentStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createSaleAction } from '@/actions/sales';
import { Plus, Trash2, Gift, X, User, Search, ChevronDown, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { QuickAddCustomerForm } from '@/components/customers/quick-add-customer-form';

interface SaleItem {
  variantId: string;
  variantName: string;
  quantity: number;
  price: number;
}

interface NewSaleDialogProps {
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    points: number;
    product: {
      name: string;
    };
  }>;
  customers: Array<{
    id: string;
    name: string;
    points: number;
  }>;
  nonMemberCustomers?: Array<{
    id: string;
    name: string;
    phone: string;
    address: string;
  }>;
  conversionRate?: number;
}

export function NewSaleDialog({ variants, customers, nonMemberCustomers = [], conversionRate = 1000 }: NewSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerId, setCustomerId] = useState<string>('');
  const [nonMemberCustomerId, setNonMemberCustomerId] = useState<string>('');
  const [customerType, setCustomerType] = useState<'member' | 'non-member' | ''>(''); // Track customer type
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [ongkir, setOngkir] = useState<number>(0);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [localNonMemberCustomers, setLocalNonMemberCustomers] = useState(nonMemberCustomers);

  // Improved UI states
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const { toast } = useToast();

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedNonMemberCustomer = localNonMemberCustomers.find(c => c.id === nonMemberCustomerId);
  const availablePoints = selectedCustomer?.points || 0;
  const pointDiscount = pointsToRedeem * conversionRate;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount - pointDiscount + tax + ongkir;

  // Points are only earned for members who are not redeeming points
  const pointsEarned = (customerId && customerType === 'member' && pointsToRedeem === 0)
    ? items.reduce((sum, item) => {
      const variant = variants.find(v => v.id === item.variantId);
      return sum + (variant?.points ?? 0) * item.quantity;
    }, 0)
    : 0;

  const handleCustomerChange = (value: string) => {
    // Reset both customer IDs first
    setCustomerId('');
    setNonMemberCustomerId('');
    setPointsToRedeem(0);
    setIsCustomerDropdownOpen(false);
    setCustomerSearch('');

    // Check if it's a member or non-member
    const isMember = customers.some(c => c.id === value);
    const isNonMember = localNonMemberCustomers.some(c => c.id === value);

    if (value === 'WALK_IN') {
      setCustomerType('');
    } else if (isMember) {
      setCustomerId(value);
      setCustomerType('member');
    } else if (isNonMember) {
      setNonMemberCustomerId(value);
      setCustomerType('non-member');
    }
  };

  const handleQuickAddSuccess = (customer: { id: string; name: string; phone: string; address: string }) => {
    // Add to local list
    setLocalNonMemberCustomers(prev => [customer, ...prev]);
    // Select the new customer
    setNonMemberCustomerId(customer.id);
    setCustomerType('non-member');
    setShowQuickAddForm(false);
    setIsCustomerDropdownOpen(false);
    toast({
      title: 'Success!',
      description: 'Customer added and selected.',
    });
  };

  const handleDiscountChange = (value: number) => {
    const totalDiscount = value + pointDiscount;

    if (value > subtotal) {
      toast({
        title: 'Invalid Discount',
        description: 'Discount cannot exceed subtotal amount.',
        variant: 'destructive',
      });
      setDiscount(subtotal - pointDiscount);
    } else if (totalDiscount > subtotal) {
      toast({
        title: 'Total Discount Too High',
        description: `Combined discount and point discount (${formatCurrency(totalDiscount)}) cannot exceed subtotal (${formatCurrency(subtotal)}).`,
        variant: 'destructive',
      });
      setDiscount(Math.max(0, subtotal - pointDiscount));
    } else {
      setDiscount(value);
    }
  };

  const handlePointsRedeemChange = (value: number) => {
    const newPointDiscount = value * conversionRate;
    const totalDiscount = discount + newPointDiscount;

    if (value > availablePoints) {
      toast({
        title: 'Insufficient Points',
        description: `Customer only has ${availablePoints} points available.`,
        variant: 'destructive',
      });
      setPointsToRedeem(availablePoints);
    } else if (value < 0) {
      setPointsToRedeem(0);
    } else if (totalDiscount > subtotal) {
      const maxPointDiscount = subtotal - discount;
      const maxPoints = Math.floor(maxPointDiscount / conversionRate);

      toast({
        title: 'Total Discount Too High',
        description: `Combined discount and point discount cannot exceed subtotal. Maximum ${maxPoints} points can be redeemed.`,
        variant: 'destructive',
      });
      setPointsToRedeem(Math.max(0, maxPoints));
    } else {
      setPointsToRedeem(value);
    }
  };

  const handleProductSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    setIsProductDropdownOpen(false);
    setProductSearch('');
  };

  const addItem = () => {
    if (!selectedVariantId || quantity <= 0) {
      toast({
        title: 'Error',
        description: 'Please select a product and enter quantity.',
        variant: 'destructive',
      });
      return;
    }

    const variant = variants.find(v => v.id === selectedVariantId);
    if (!variant) return;

    if (quantity > variant.stock) {
      toast({
        title: 'Error',
        description: `Only ${variant.stock} units available in stock.`,
        variant: 'destructive',
      });
      return;
    }

    const existingItemIndex = items.findIndex(item => item.variantId === selectedVariantId);

    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([...items, {
        variantId: variant.id,
        variantName: `${variant.product.name} - ${variant.name}`,
        quantity,
        price: variant.price,
      }]);
    }

    setSelectedVariantId('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!customerId && !nonMemberCustomerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the sale.',
        variant: 'destructive',
      });
      return;
    }

    if (discount > subtotal) {
      toast({
        title: 'Error',
        description: 'Discount cannot exceed subtotal amount.',
        variant: 'destructive',
      });
      return;
    }

    // Points redemption only for members
    if (pointsToRedeem > 0 && !customerId) {
      toast({
        title: 'Error',
        description: 'Points redemption is only available for members.',
        variant: 'destructive',
      });
      return;
    }

    if (pointsToRedeem > availablePoints) {
      toast({
        title: 'Error',
        description: 'Points to redeem exceed available points.',
        variant: 'destructive',
      });
      return;
    }

    const totalDiscount = discount + pointDiscount;
    if (totalDiscount > subtotal) {
      toast({
        title: 'Error',
        description: `Total discount (${formatCurrency(totalDiscount)}) cannot exceed subtotal (${formatCurrency(subtotal)}).`,
        variant: 'destructive',
      });
      return;
    }

    if (total < 0) {
      toast({
        title: 'Error',
        description: 'Total payment cannot be negative. Please adjust discounts.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createSaleAction({
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerId: customerId || null,
        nonMemberCustomerId: nonMemberCustomerId || null,
        paymentMethod,
        paymentStatus,
        discount,
        tax,
        ongkir,
        notes,
        pointsRedeemed: customerId ? pointsToRedeem : 0,
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: `Sale completed. Total: ${formatCurrency(total)}`,
        });
        setItems([]);
        setCustomerId('');
        setNonMemberCustomerId('');
        setCustomerType('');
        setDiscount(0);
        setTax(0);
        setOngkir(0);
        setPaymentStatus('PAID');
        setPointsToRedeem(0);
        setNotes('');
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create sale.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get customer display name
  const getCustomerDisplayName = () => {
    if (customerType === 'member' && selectedCustomer) {
      return selectedCustomer.name;
    }
    if (customerType === 'non-member' && selectedNonMemberCustomer) {
      return selectedNonMemberCustomer.name;
    }
    return null;
  };

  // Get selected variant
  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  // Filter customers - combine members and non-members
  const filteredMembers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredNonMembers = localNonMemberCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Filter variants
  const filteredVariants = variants
    .filter(v => v.stock > 0)
    .filter(v =>
      !productSearch ||
      v.product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      v.name.toLowerCase().includes(productSearch.toLowerCase())
    );

  const [quantityDisplay, setQuantityDisplay] = useState('1');
  const [discountDisplay, setDiscountDisplay] = useState('');
  const [taxDisplay, setTaxDisplay] = useState('');
  const [ongkirDisplay, setOngkirDisplay] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Penjualan Baru
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="w-[95vw] max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Penjualan Baru</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Customer Selection - Improved Combobox Style */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">
              Customer <span className="text-red-500">*</span>
            </Label>


            {/* Quick Add Customer Button */}
            {!showQuickAddForm && (
              <div className="p-2 border-b flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAddForm(true)}
                  className="w-full gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add New Customer
                </Button>
              </div>
            )}

            {/* Quick Add Form */}
            {showQuickAddForm && (
              <div className="p-2 border-b flex-shrink-0">
                <QuickAddCustomerForm
                  onSuccess={handleQuickAddSuccess}
                  onCancel={() => setShowQuickAddForm(false)}
                />
              </div>
            )}

            <div className="relative">
              {/* Combobox Button */}
              <button
                type="button"
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                className={`flex items-center gap-2 w-full min-h-[44px] px-3 py-2 border rounded-md text-left transition-colors ${!customerId && !nonMemberCustomerId ? 'text-gray-400 hover:bg-gray-50' : 'hover:bg-gray-50'
                  } ${!customerId && !nonMemberCustomerId ? 'border-gray-300' : 'border-blue-300 bg-blue-50'}`}
              >
                {(customerId || nonMemberCustomerId) ? (
                  // Selected state - show as chip
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-900 px-2 py-1 rounded-md min-w-0 break-words line-clamp-2">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium break-words line-clamp-2">{getCustomerDisplayName()}</span>
                    {selectedCustomer && customerType === 'member' && (
                      <span className="text-xs text-blue-600 whitespace-nowrap">• {selectedCustomer.points} poin</span>
                    )}
                    {customerType === 'non-member' && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded whitespace-nowrap">Non-Member</span>
                    )}
                    <X
                      className="w-4 h-4 ml-1 cursor-pointer hover:text-blue-700 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerId('');
                        setNonMemberCustomerId('');
                        setCustomerType('');
                        setPointsToRedeem(0);
                      }}
                    />
                  </div>
                ) : (
                  // Empty state - show placeholder
                  <span className="text-sm">Pilih pelanggan...</span>
                )}
                <ChevronDown className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" />
              </button>

              {/* Dropdown */}
              {isCustomerDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 border rounded-md bg-white shadow-lg max-h-[400px] overflow-hidden flex flex-col">
                  {/* Search input */}
                  <div className="p-2 border-b flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-8 h-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="overflow-y-auto flex-1">
                    {/* Members Section */}
                    {filteredMembers.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                          MEMBERS ({filteredMembers.length})
                        </div>
                        {filteredMembers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleCustomerChange(customer.id)}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b ${customerId === customer.id ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                              <span className="font-medium text-sm truncate">{customer.name}</span>
                              <span className="text-xs text-gray-500">{customer.points} points</span>
                            </div>
                            {customerId === customer.id && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* Non-Members Section */}
                    {filteredNonMembers.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                          NON-MEMBERS ({filteredNonMembers.length})
                        </div>
                        {filteredNonMembers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleCustomerChange(customer.id)}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b ${nonMemberCustomerId === customer.id ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{customer.name}</span>
                                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">Non-Member</span>
                              </div>
                              <span className="text-xs text-gray-500">{customer.phone}</span>
                            </div>
                            {nonMemberCustomerId === customer.id && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* No results */}
                    {customerSearch &&
                      filteredMembers.length === 0 &&
                      filteredNonMembers.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No customers found
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Selection - Only show if customer is selected */}
          {(customerId || nonMemberCustomerId) && (
            <>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Tambah Produk</Label>

                {/* Selected product chip - show above input */}
                {selectedVariant && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 break-words line-clamp-2">
                        {selectedVariant.product.name} - {selectedVariant.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {formatCurrency(selectedVariant.price)} • Stock: {selectedVariant.stock}
                      </p>
                    </div>
                    <X
                      className="w-4 h-4 cursor-pointer text-blue-600 hover:text-blue-700 flex-shrink-0"
                      onClick={() => setSelectedVariantId('')}
                    />
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="pl-9"
                  />
                </div>

                {/* Dropdown - only when searching */}
                {isProductDropdownOpen && productSearch && (
                  <div className="border rounded-md bg-white shadow-lg max-h-[200px] overflow-y-auto">
                    {filteredVariants.map((variant) => (
                      <div
                        key={variant.id}
                        onClick={() => handleProductSelect(variant.id)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${selectedVariantId === variant.id ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm break-words line-clamp-2">
                              {variant.product.name} - {variant.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(variant.price)} • Stock: {variant.stock}
                            </p>
                          </div>
                          {selectedVariantId === variant.id && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredVariants.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No products found
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity and Add button */}
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quantityDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = parseInt(raw) || 0;
                      setQuantityDisplay(raw ? num.toLocaleString('en-US') : '');
                      setQuantity(num);
                    }}
                    placeholder='0'
                  />
                  <Button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedVariantId || quantity <= 0}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                </div>
              </div>

              {/* Items List - FIXED FOR MOBILE */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Keranjang ({items.length})</Label>
                  <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto overflow-x-hidden">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm break-words line-clamp-2">{item.variantName}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                          {customerId && customerId !== 'WALK_IN' && pointsToRedeem === 0 && (() => {
                            const variant = variants.find(v => v.id === item.variantId);
                            const itemPoints = (variant?.points ?? 0) * item.quantity;
                            return itemPoints > 0 ? (
                              <p className="text-xs text-green-600 mt-0.5">🎁 +{itemPoints} poin</p>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod" className="text-sm">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="grid gap-2">
                <Label htmlFor="paymentStatus" className="text-sm">Status Pembayaran</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Lunas</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount, Tax & Ongkir */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="discount" className="text-sm">
                    Discount {subtotal > 0 && <span className="text-xs text-gray-500">(Max: {formatCurrency(subtotal)})</span>}
                  </Label>
                  <Input
                    id="discount"
                    type="text"
                    inputMode="numeric"
                    value={discountDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = parseInt(raw) || 0;
                      setDiscountDisplay(raw ? num.toLocaleString('en-US') : '');
                      handleDiscountChange(num);
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tax" className="text-sm">Tax</Label>
                  <Input
                    id="tax"
                    type="text"
                    inputMode="numeric"
                    value={taxDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = parseInt(raw) || 0;
                      setTaxDisplay(raw ? num.toLocaleString('en-US') : '');
                      setTax(num);
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="ongkir" className="text-sm">Ongkir (Biaya Pengiriman)</Label>
                  <Input
                    id="ongkir"
                    type="text"
                    inputMode="numeric"
                    value={ongkirDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = parseInt(raw) || 0;
                      setOngkirDisplay(raw ? num.toLocaleString('en-US') : '');
                      setOngkir(num);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-sm">Notes (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this sale..."
                  rows={2}
                  maxLength={50}
                  className="text-sm resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  {notes.length}/50 characters
                </p>
              </div>

              {/* Point Redemption - Only for members */}
              {customerType === 'member' && customerId && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-base text-purple-900">Redeem Points</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Poin Tersedia:</span>
                      <span className="font-semibold text-purple-900">{availablePoints} poin</span>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="pointsRedeem" className="text-sm text-purple-900">
                        Points to Redeem (Max: {availablePoints})
                      </Label>
                      <Input
                        id="pointsRedeem"
                        type="number"
                        min="0"
                        max={availablePoints}
                        value={pointsToRedeem}
                        onChange={(e) => handlePointsRedeemChange(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-white"
                      />
                      <p className="text-xs text-purple-600">
                        1 poin = {formatCurrency(conversionRate)} discount • {pointsToRedeem} poin = {formatCurrency(pointDiscount)}
                      </p>
                    </div>

                    {pointsToRedeem > 0 && (
                      <div className="p-3 bg-white rounded border border-purple-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-purple-700">Point Discount:</span>
                          <span className="text-lg font-bold text-purple-900">-{formatCurrency(pointDiscount)}</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Member tidak mendapatkan poin saat menukarkan poin
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {items.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Point Discount ({pointsToRedeem} poin):</span>
                      <span className="font-medium">-{formatCurrency(pointDiscount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                  )}
                  {ongkir > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Ongkir:</span>
                      <span className="font-medium">+{formatCurrency(ongkir)}</span>
                    </div>
                  )}

                  {/* Warning when total discount is high */}
                  {(discount + pointDiscount) > subtotal * 0.8 && (discount + pointDiscount) <= subtotal && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                      ⚠️ Total discount is {Math.round((discount + pointDiscount) / subtotal * 100)}% of subtotal
                    </div>
                  )}

                  {/* Error when total discount exceeds subtotal */}
                  {(discount + pointDiscount) > subtotal && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                      ❌ Total discount melebihi subtotal! Kurangi discount atau points.
                    </div>
                  )}

                  <div className={`flex justify-between text-lg font-bold pt-2 border-t ${total < 0 ? 'text-red-600' : total === 0 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                    <span>Total:</span>
                    <span>{formatCurrency(Math.max(0, total))}</span>
                  </div>
                  {/* Points earned - only for members */}
                  {items.length > 0 && customerType === 'member' && customerId && (
                    <div className={`flex items-center justify-between px-3 py-2 rounded-md text-sm mt-1 ${pointsToRedeem > 0
                      ? 'bg-orange-50 border border-orange-200'
                      : pointsEarned > 0
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                      }`}>
                      <span className={`font-medium ${pointsToRedeem > 0 ? 'text-orange-700' : pointsEarned > 0 ? 'text-green-700' : 'text-gray-500'
                        }`}>
                        🎁 Poin Diperoleh:
                      </span>
                      <span className={`font-bold ${pointsToRedeem > 0 ? 'text-orange-600' : pointsEarned > 0 ? 'text-green-800' : 'text-gray-400'
                        }`}>
                        {pointsToRedeem > 0 ? '0 poin (penukaran aktif)' : `+${pointsEarned} poin`}
                      </span>
                    </div>
                  )}
                </div>

              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || items.length === 0 || (!customerId && !nonMemberCustomerId) || (discount + pointDiscount) > subtotal || total < 0}
            className="w-full sm:w-auto"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}