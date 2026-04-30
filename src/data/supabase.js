import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(URL && KEY);

export const supabase = isConfigured
  ? createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithEmail(email) {
  if (!supabase) throw new Error('Supabase 未設定');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function ensureHousehold(userId, userEmail) {
  if (!supabase) return null;
  const inviteId = new URLSearchParams(location.search).get('invite');
  if (inviteId) {
    await supabase.from('household_members').upsert(
      { household_id: inviteId, user_id: userId },
      { onConflict: 'household_id,user_id' }
    );
    history.replaceState(null, '', '/');
    return inviteId;
  }
  const { data: members } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1);
  if (members && members.length > 0) return members[0].household_id;

  const { data: created, error } = await supabase
    .from('households')
    .insert({ name: userEmail || 'My Household' })
    .select()
    .single();
  if (error) throw error;
  await supabase.from('household_members').insert({
    household_id: created.id,
    user_id: userId,
  });
  await seedInitialItems(created.id);
  return created.id;
}

async function seedInitialItems(householdId) {
  const seeds = [
    { name: '卵', emoji: '🥚', category: '食材' },
    { name: '牛乳', emoji: '🥛', category: '食材' },
    { name: '食パン', emoji: '🍞', category: '食材' },
    { name: 'ごはん（米）', emoji: '🍚', category: '食材' },
    { name: 'バナナ', emoji: '🍌', category: '食材' },
    { name: 'ヨーグルト', emoji: '🥣', category: '食材' },
    { name: 'トマト', emoji: '🍅', category: '食材' },
    { name: '鶏肉', emoji: '🍗', category: '食材' },
    { name: '醤油', emoji: '🧂', category: '調味料' },
    { name: '味噌', emoji: '🍶', category: '調味料' },
    { name: '砂糖', emoji: '🍬', category: '調味料' },
    { name: 'コーヒー', emoji: '☕', category: '調味料' },
    { name: 'お茶', emoji: '🍵', category: '調味料' },
    { name: '洗濯洗剤', emoji: '🧴', category: '日用品' },
    { name: 'ティッシュ', emoji: '🧻', category: '日用品' },
    { name: 'トイレットペーパー', emoji: '🧻', category: '日用品' },
    { name: 'ゴミ袋', emoji: '🗑️', category: '日用品' },
    { name: 'シャンプー', emoji: '🧴', category: '日用品' },
    { name: '歯磨き粉', emoji: '🦷', category: '日用品' },
    { name: '食器用洗剤', emoji: '🧽', category: '日用品' },
  ].map((s, i) => ({
    ...s,
    household_id: householdId,
    is_pinned: i < 6,
    sort_score: 100 - i,
  }));
  await supabase.from('items').insert(seeds);
}
