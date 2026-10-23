import { fmtMoney, fmtMoneyFull } from './money';

/* One place that turns a figure and its unit into words, so the reports, the
   charts and the CSV all say the same thing about the same number. */

export const fmtUnit = (value, unit, { full = false } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const v = Number(value);
  switch (unit) {
    case 'money': return full ? fmtMoneyFull(v) : fmtMoney(v);
    case 'percent': return `${Number(v.toFixed(1))}%`;
    case 'hours': return `${Number(v.toFixed(1))} h`;
    default: return v.toLocaleString('en-IN');
  }
};

/* Short axis ticks: ₹12L, 4.5K, 20% */
export const fmtTick = (value, unit) => {
  if (unit === 'money') return fmtMoney(value);
  if (unit === 'percent') return `${Math.round(value)}%`;
  if (unit === 'hours') return `${Math.round(value)}h`;
  if (Math.abs(value) >= 1000) return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  return String(Math.round(value));
};

/* A CSV the owner can open in Excel. Values are quoted; a leading =, +, - or
   @ is escaped so a cell can never run as a formula. */
export const downloadCsv = (filename, rows) => {
  if (!rows?.length) return;
  const cols = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set()));
  const cell = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.map(cell).join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
