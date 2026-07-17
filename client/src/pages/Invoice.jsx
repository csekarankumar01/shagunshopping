import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { inr, formatDate, shortId } from '../lib/format';
import { Spinner, Empty } from '../components/Spinner';
import { SHOP_NAME, SHOP_CONTACT, SHOP_GSTIN } from '../lib/config';

/*
  Printable invoice. Instead of generating PDFs on the server (extra deps,
  extra memory on a free dyno) I render clean HTML and let the browser's
  print dialog do "Save as PDF" — works on phones too. Prices in India are
  MRP-inclusive of GST, so the tax break-up is derived FROM the total
  (total / 1.18), and only shows once SHOP_GSTIN is filled in config.
  CGST+SGST when shipping within UP, IGST otherwise.
*/

const GST_RATE = 0.18;

const Invoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) {
    return (
      <div className="container-page py-16">
        <Empty title="Invoice unavailable" hint={error} action={<Link to="/orders" className="btn-primary btn-sm mt-2">My orders</Link>} />
      </div>
    );
  }
  if (!order) return <div className="container-page py-24"><Spinner /></div>;

  const a = order.shippingAddress;
  const intraState = (a.state || '').trim().toLowerCase() === 'uttar pradesh';
  const taxable = order.totalPrice / (1 + GST_RATE);
  const tax = order.totalPrice - taxable;
  const mrpTotal = order.orderItems.reduce((s, it) => s + it.mrp * it.qty, 0);
  const saved = mrpTotal - order.itemsPrice;

  return (
    <div className="container-page py-8">
      {/* Hide site chrome + controls when printing */}
      <style>{`@media print {
        header, footer, nav, .no-print { display: none !important; }
        body { background: #ffffff !important; }
        .invoice-sheet { border: none !important; box-shadow: none !important; }
      }`}</style>

      <div className="no-print mb-5 flex items-center justify-between">
        <Link to={`/orders/${order._id}`} className="btn-ghost btn-sm"><ArrowLeft size={14} /> Back to order</Link>
        <button onClick={() => window.print()} className="btn-primary btn-sm"><Printer size={14} /> Print / Save PDF</button>
      </div>

      <div className="invoice-sheet card mx-auto max-w-3xl p-8 sm:p-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="font-display text-3xl font-extrabold">{SHOP_NAME}</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
              {SHOP_CONTACT.address}<br />
              {SHOP_CONTACT.phones.join(' · ')}<br />
              {SHOP_CONTACT.email}
              {SHOP_GSTIN ? <><br />GSTIN: {SHOP_GSTIN}</> : null}
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow">{SHOP_GSTIN ? 'Tax Invoice' : 'Retail Invoice'}</p>
            <p className="mt-2 text-sm font-extrabold">Invoice no. SS-{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-muted">Order {shortId(order._id)} · {formatDate(order.createdAt)}</p>
            <p className="mt-2 text-xs font-bold">
              {order.paymentMethod === 'cod'
                ? (order.isPaid ? 'Paid — Cash on Delivery' : 'Payable on delivery (COD)')
                : 'Paid online — Razorpay'}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Billed & shipped to</p>
            <p className="mt-2 text-sm font-bold">{a.fullName}</p>
            <p className="text-xs leading-relaxed text-muted">
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
              {a.city}, {a.state} — {a.pincode}<br />
              {a.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Order status</p>
            <p className="mt-2 text-sm font-bold capitalize">{order.status}</p>
            {order.paymentResult?.razorpayPaymentId && (
              <p className="text-xs text-muted">Payment ID: {order.paymentResult.razorpayPaymentId}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-3">Item</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">MRP</th>
              <th className="py-3 text-right">Price</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems.map((it) => (
              <tr key={it.product} className="border-t border-line">
                <td className="py-3 pr-2">
                  <span className="font-bold">{it.name}</span>
                  <span className="block text-xs text-muted">{it.brand}</span>
                </td>
                <td className="py-3 text-center">{it.qty}</td>
                <td className="py-3 text-right text-muted line-through">{inr(it.mrp)}</td>
                <td className="py-3 text-right">{inr(it.price)}</td>
                <td className="py-3 text-right font-bold">{inr(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto mt-6 w-full max-w-xs space-y-1.5 text-sm">
          {saved > 0 && (
            <div className="flex justify-between"><span className="text-muted">MRP total</span><span className="text-muted line-through">{inr(order.itemsPrice + saved)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted">Items total</span><span>{inr(order.itemsPrice)}</span></div>
          <div className="flex justify-between text-sage"><span>You saved vs MRP</span><span>− {inr(saved)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shippingPrice === 0 ? 'Free' : inr(order.shippingPrice)}</span></div>
          {order.codFee > 0 && (
            <div className="flex justify-between"><span className="text-muted">COD fee</span><span>{inr(order.codFee)}</span></div>
          )}
          {SHOP_GSTIN ? (
            intraState ? (
              <>
                <div className="flex justify-between text-xs text-muted"><span>Taxable value</span><span>{inr(Math.round(taxable))}</span></div>
                <div className="flex justify-between text-xs text-muted"><span>CGST @ 9% (incl.)</span><span>{inr(Math.round(tax / 2))}</span></div>
                <div className="flex justify-between text-xs text-muted"><span>SGST @ 9% (incl.)</span><span>{inr(Math.round(tax / 2))}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs text-muted"><span>Taxable value</span><span>{inr(Math.round(taxable))}</span></div>
                <div className="flex justify-between text-xs text-muted"><span>IGST @ 18% (incl.)</span><span>{inr(Math.round(tax))}</span></div>
              </>
            )
          ) : null}
          <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold">
            <span>Grand total</span><span className="text-mulberry">{inr(order.totalPrice)}</span>
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-4 text-center text-[11px] leading-relaxed text-muted">
          All products are 100% genuine, sourced from authorised distributors. Prices are inclusive of all taxes.
          All sales are final — for any inconvenience call {SHOP_CONTACT.phones[0]} or email {SHOP_CONTACT.email}.
          Thank you for shopping with {SHOP_NAME}!
        </p>
      </div>
    </div>
  );
};

export default Invoice;
