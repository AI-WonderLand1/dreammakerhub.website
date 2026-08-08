import React, { useState } from 'react';
import { CartItem } from '../types';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Download, 
  Sparkles,
  Lock,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundEffects';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveFromCart: (index: number) => void;
  onClearCart: () => void;
  onCompletePurchase: (purchasedAssets: CartItem[]) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemoveFromCart,
  onClearCart,
  onCompletePurchase,
}) => {
  if (!isOpen) return null;

  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState<boolean>(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    if (promoCode.trim().toUpperCase() === 'DIMENSION20') {
      setDiscountPercent(20);
      setPromoApplied(true);
      setPromoError('');
    } else if (promoCode.trim().toUpperCase() === 'CYBER50') {
      setDiscountPercent(50);
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try DIMENSION20');
    }
  };

  const handleCheckout = () => {
    sounds.playPurchaseSuccess();
    setIsCheckingOut(true);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => {
      setIsCheckingOut(false);
      setPurchaseCompleted(true);
      onCompletePurchase(cart);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-base text-white font-mono">
              SHOPPING CART ({cart.length})
            </h3>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        {!purchaseCompleted ? (
          cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">Your Cart Is Empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Browse thousands of game-ready 3D models, procedural shaders, and environment kits.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {cart.map((item, idx) => (
                <div
                  key={`${item.asset.id}-${idx}`}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs shrink-0 overflow-hidden">
                    {item.asset.formats[0] || '3D'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-100 truncate">{item.asset.title}</h5>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      License: <span className="text-cyan-400 font-semibold">{item.license}</span>
                    </p>
                    <p className="font-mono font-bold text-xs text-white mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      onRemoveFromCart(idx);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Purchase Confirmation View */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg">Purchase Complete!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Your 3D assets have been added to your <span className="text-cyan-400 font-bold">3D Vault Library</span> for instant download!
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setPurchaseCompleted(false);
                onClearCart();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-cyan-400"
            >
              Open 3D Vault Library
            </button>
          </div>
        )}

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && !purchaseCompleted && (
          <div className="border-t border-slate-800 pt-4 space-y-4">
            
            {/* Promo Code Form */}
            <form onSubmit={applyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo Code (DIMENSION20)"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Apply
              </button>
            </form>

            {promoApplied && (
              <p className="text-xs font-mono text-emerald-400">
                ✓ {discountPercent}% discount applied!
              </p>
            )}
            {promoError && (
              <p className="text-xs font-mono text-rose-400">
                ✕ {promoError}
              </p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-100 font-bold text-sm pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-cyan-400 text-base">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:scale-[1.01] active:scale-95 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>{isCheckingOut ? 'Processing Payment...' : `Complete Order • $${grandTotal.toFixed(2)}`}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Download • Royalty Free Commercial License</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
