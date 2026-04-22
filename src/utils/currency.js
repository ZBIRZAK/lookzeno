const madFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatMAD(value) {
  const amount = Number(value || 0);
  return madFormatter.format(Number.isFinite(amount) ? amount : 0);
}

