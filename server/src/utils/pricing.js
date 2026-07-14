/**
 * All money math happens here, on the server, from database prices.
 * The client only ever sends product IDs and quantities.
 */
export const getShippingRules = () => ({
  freeAbove: Number(process.env.FREE_SHIPPING_ABOVE || 999),
  fee: Number(process.env.SHIPPING_FEE || 49),
});

export const computeTotals = (items) => {
  const { freeAbove, fee } = getShippingRules();
  const itemsPrice = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shippingPrice = itemsPrice >= freeAbove ? 0 : fee;
  return {
    itemsPrice,
    shippingPrice,
    totalPrice: itemsPrice + shippingPrice,
  };
};
