/**
 * All money math happens here, on the server, from database prices.
 * The client only ever sends product IDs, quantities and a payment method;
 * the client-side numbers are display mirrors only.
 *
 * Pricing architecture:
 *  - Prepaid (Razorpay): free shipping above FREE_SHIPPING_ABOVE_PREPAID (default 1199)
 *  - COD: free shipping above FREE_SHIPPING_ABOVE (default 1499) + a flat COD_FEE (default 40)
 *  - COD unavailable when the items subtotal exceeds COD_MAX (default 2500)
 * Together these steer customers toward prepaid (near-zero RTO risk) while
 * keeping every order's shipping economics healthy.
 */
export const getShippingRules = () => ({
  freeAbove: Number(process.env.FREE_SHIPPING_ABOVE || 1499), // COD threshold
  freeAbovePrepaid: Number(process.env.FREE_SHIPPING_ABOVE_PREPAID || 1199),
  fee: Number(process.env.SHIPPING_FEE || 49),
  codFee: Number(process.env.COD_FEE || 40),
  codMax: Number(process.env.COD_MAX || 2500),
});

export const computeTotals = (items, paymentMethod = 'razorpay') => {
  const rules = getShippingRules();
  const itemsPrice = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const threshold = paymentMethod === 'cod' ? rules.freeAbove : rules.freeAbovePrepaid;
  const shippingPrice = itemsPrice >= threshold ? 0 : rules.fee;
  const codFee = paymentMethod === 'cod' ? rules.codFee : 0;
  return {
    itemsPrice,
    shippingPrice,
    codFee,
    totalPrice: itemsPrice + shippingPrice + codFee,
  };
};
