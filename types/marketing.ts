export type MpAdsDraft = {
  id: string;
  date: string;
  produk: string;
  impression: number;
  click: number;
  ctr: number; // decimal (e.g. 0.023 = 2.3%)
  qty_buyer: number;
  qty_produk: number;
  omset: number;
  spent: number;
  roas: number; // ratio (e.g. 3.5)
  cancel_qty: number;
  cancel_omset: number;
  roas_fix: number; // ratio
  target_roas: number; // ratio
};