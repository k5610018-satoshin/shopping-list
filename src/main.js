import { state, setState, subscribe } from './state.js';
import { supabase, isConfigured } from './data/supabase.js';
import { loadItems, saveItems } from './data/localStore.js';
import { fetchItems, startRealtime, flushPending } from './data/sync.js';
import { renderApp } from './ui/app.js';

const HOUSEHOLD_ID =
  import.meta.env.VITE_HOUSEHOLD_ID ||
  '00000000-0000-0000-0000-000000000001';

subscribe(() => renderApp());

async function bootstrap() {
  setState({ householdId: HOUSEHOLD_ID });

  const cached = await loadItems();
  if (cached.length > 0) setState({ items: cached });
  setState({ ready: true });

  if (!isConfigured) return;

  try {
    const items = await fetchItems(HOUSEHOLD_ID);
    setState({ items });
    await saveItems(items);
    startRealtime(HOUSEHOLD_ID);
    await flushPending();
  } catch (e) {
    console.error('bootstrap failed', e);
  }
}

bootstrap();
