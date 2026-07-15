// All money math lives here on the server. I learned early on that you can't
// trust totals coming from the browser (anyone can edit them in devtools),
// so the client only sends product ids + qty + payment method, and this file
// recomputes everything from DB prices.
//
// Why two free-shipping thresholds? COD orders cost us extra (courier COD fee
// + the risk of the customer refusing the parcel), so prepaid gets the better
// deal. Numbers are env-configurable so papa can tune them without a deploy.
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
