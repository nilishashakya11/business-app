/**
 * Pure invoice math shared between the API and the POS client so totals match
 * exactly on both sides. All amounts are plain numbers (rupees).
 */
export interface LineInput {
  quantity: number;
  unitPrice: number;
  discount: number; // absolute amount off this line
  taxRate: number; // percent
}

export interface LineTotals {
  gross: number; // qty * unitPrice
  net: number; // gross - discount
  tax: number; // net * taxRate%
  lineTotal: number; // net + tax
}

export function computeLine(line: LineInput): LineTotals {
  const gross = round2(line.quantity * line.unitPrice);
  const net = Math.max(0, round2(gross - line.discount));
  const tax = round2((net * line.taxRate) / 100);
  return { gross, net, tax, lineTotal: round2(net + tax) };
}

export interface InvoiceTotals {
  subtotal: number; // sum of net line amounts before invoice-level discount
  taxTotal: number;
  discountTotal: number; // line discounts + invoice-level discount
  total: number;
}

export function computeInvoice(lines: LineInput[], invoiceDiscount = 0): InvoiceTotals {
  let subtotal = 0;
  let taxTotal = 0;
  let lineDiscounts = 0;

  for (const line of lines) {
    const { gross, net, tax } = computeLine(line);
    subtotal += net;
    taxTotal += tax;
    lineDiscounts += gross - net;
  }

  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  const total = Math.max(0, round2(subtotal + taxTotal - invoiceDiscount));

  return {
    subtotal,
    taxTotal,
    discountTotal: round2(lineDiscounts + invoiceDiscount),
    total,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
