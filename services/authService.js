// ============================================================
// Autenticação (Supabase Auth).
// ============================================================
import { db } from '../config/supabase.js';

export async function signUp({ name, email, password, cpfCnpj }){
  return db.auth.signUp({
    email, password,
    options: { data: { name, cpf_cnpj: cpfCnpj } },
  });
}
export async function signIn({ email, password }){
  return db.auth.signInWithPassword({ email, password });
}
export async function signOut(){
  return db.auth.signOut();
}
export async function requestPasswordReset(email){
  const redirectTo = new URL('reset-password.html', window.location.href).toString();
  return db.auth.resetPasswordForEmail(email, { redirectTo });
}
export async function updatePassword(newPassword){
  return db.auth.updateUser({ password: newPassword });
}
export async function getSession(){
  const { data } = await db.auth.getSession();
  return data.session;
}
export async function getProfile(userId){
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
  if(error) throw error;
  return { id: data.id, name: data.name, email: data.email, slug: data.slug, tagline: data.tagline, cpfCnpj: data.cpf_cnpj };
}
export async function updateProfile(userId, { name, tagline, cpfCnpj }){
  const { error } = await db.from('profiles').update({ name, tagline, cpf_cnpj: cpfCnpj }).eq('id', userId);
  if(error) throw error;
}
export function onAuthStateChange(cb){
  return db.auth.onAuthStateChange((event, session)=>cb(event, session));
}
