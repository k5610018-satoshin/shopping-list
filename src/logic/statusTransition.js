// 状態は2段階のみ：stock(ある) ↔ out(買う)
// タップ1回で stock <-> out をトグル

export const STATUS_LABEL = {
  stock: 'ある',
  out: '買う',
};

export function nextStatus(current) {
  return current === 'stock' ? 'out' : 'stock';
}

export function inShoppingList(status) {
  return status === 'out';
}

// ソートは「ピン留め > sort_score 降順 > 名前」で完全固定
// 状態が変わってもタイル位置が動かないことを保証
export function compareItems(a, b) {
  const pin = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
  if (pin !== 0) return pin;
  const score = (b.sort_score || 0) - (a.sort_score || 0);
  if (score !== 0) return score;
  return (a.name || '').localeCompare(b.name || '', 'ja');
}
