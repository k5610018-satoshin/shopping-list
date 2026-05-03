// 状態は2段階のみ：stock(ある) ↔ out(買う)
// タップ1回で stock <-> out をトグル

export const STATUS_LABEL = {
  stock: 'ある',
  out: '買う',
};

export const STATUS_DOT = {
  stock: '',
  out: '🛒',
};

export function nextStatus(current) {
  return current === 'stock' ? 'out' : 'stock';
}

export function inShoppingList(status) {
  return status === 'out';
}

// ソートは「ピン留め > 登録順(created_at ASC)」で完全固定
// 状態が変わってもタイル位置が動かないようにする
export function compareItems(a, b) {
  const pin = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
  if (pin !== 0) return pin;
  if (a.created_at && b.created_at) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  return (b.sort_score || 0) - (a.sort_score || 0);
}
