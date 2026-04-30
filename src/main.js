import { state, setState, subscribe } from './state.js';
import {
  supabase,
  isConfigured,
  getSession,
  ensureHousehold,
  onAuthChange,
} from './data/supabase.js';
import { loadItems, saveItems } from './data/localStore.js';
import { fetchItems, startRealtime, stopRealtime, flushPending } from './data/sync.js';
import { renderApp } from './ui/app.js';

subscribe(() => renderApp());

async function bootstrap() {
  if (!isConfigured) {
    setState({ ready: true });
    return;
  }
  const session = await getSession();
  if (session) {
    await initSession(session);
  }
  setState({ ready: true });
  onAuthChange(async (event, sess) => {
    if (event === 'SIGNED_IN' && sess) {
      await initSession(sess);
    } else if (event === 'SIGNED_OUT') {
      stopRealtime();
      setState({ user: null, householdId: null, items: [] });
    }
  });
}

async function initSession(session) {
  setState({ user: session.user });
  const cached = await loadItems();
  if (cached.length > 0) setState({ items: cached });
  try {
    const householdId = await ensureHousehold(session.user.id, session.user.email);
    setState({ householdId });
    const items = await fetchItems(householdId);
    setState({ items });
    await saveItems(items);
    startRealtime(householdId);
    await flushPending();
  } catch (e) {
    console.error('initSession failed', e);
  }
}

bootstrap();
