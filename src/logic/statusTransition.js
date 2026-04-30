const ORDER = ['stock', 'soon', 'out'];

export const STATUS_LABEL = {
  stock: 'ある',
  soon: 'そろそろ',
  out: 'ない',
};

export const STATUS_DOT = {
  stock: '🟢',
  soon: '🟠',
  out: '🔴',
};

export function nextStatus(current) {
  const i = ORDER.indexOf(current);
  return ORDER[(i + 1) % ORDER.length];
}

export function inShoppingList(status) {
  return status === 'soon' || status === 'out';
}

const STATUS_RANK = { out: 0, soon: 1, stock: 2 };

export function compareItems(a, b) {
  const pin = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
  if (pin !== 0) return pin;
  const status = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (status !== 0) return status;
  return (b.sort_score || 0) - (a.sort_score || 0);
}
