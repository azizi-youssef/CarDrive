/**
 * Script de création d'un compte administrateur CarDrive.
 * Usage: node scripts/create-admin.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wviqbscbnrrpxpojhqql.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2aXFic2NibnJycHhwb2pocXFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkzMDY1MSwiZXhwIjoyMTA2NTA2NjUxfQ.U0SzFdOvWGL2y56F4ssfM9Ov5xkCWQj6tg56ru0ubQM';

// ─── Informations du compte admin ────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@cardrive.ma';
const ADMIN_PASSWORD = 'CarDrive@Admin2026!';
const ADMIN_NAME     = 'Super Administrateur CarDrive';
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log('\n🚗 CarDrive — Création du compte administrateur\n');
console.log('━'.repeat(50));

// 1. Créer l'utilisateur dans auth.users via Admin API
console.log(`[1] Création du compte auth : ${ADMIN_EMAIL}`);

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true, // email pré-confirmé
  user_metadata: {
    full_name: ADMIN_NAME,
  },
});

if (authError) {
  if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
    console.log('   ⚠️  Cet email existe déjà — mise à jour du rôle uniquement...');
    
    // Récupérer l'utilisateur existant
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);
    
    if (existing) {
      // Mettre à jour le mot de passe
      await supabase.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      
      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: existing.id,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          role: 'SUPER_ADMIN',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('   ❌ Erreur mise à jour profil:', profileError.message);
        process.exit(1);
      }
      
      console.log('\n✅ Compte administrateur mis à jour avec succès !\n');
      console.log('━'.repeat(50));
      console.log(`   Email    : ${ADMIN_EMAIL}`);
      console.log(`   Mot de passe : ${ADMIN_PASSWORD}`);
      console.log(`   Rôle     : SUPER_ADMIN`);
      console.log(`   URL      : http://localhost:3000/login`);
      console.log('━'.repeat(50));
      process.exit(0);
    }
  }
  console.error('   ❌ Erreur création compte:', authError.message);
  process.exit(1);
}

const userId = authData.user.id;
console.log(`   ✅ Compte auth créé : ${userId}`);

// 2. Mettre à jour le profil avec le rôle SUPER_ADMIN
console.log(`[2] Attribution du rôle SUPER_ADMIN...`);

const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: ADMIN_NAME,
    role: 'SUPER_ADMIN',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

if (profileError) {
  console.error('   ❌ Erreur profil:', profileError.message);
  console.log('\n   → Exécutez ce SQL dans Supabase pour corriger manuellement :');
  console.log(`\n   UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE id = '${userId}';\n`);
  process.exit(1);
}

console.log('   ✅ Profil SUPER_ADMIN créé');

// 3. Vérification
console.log('[3] Vérification...');
const { data: profile } = await supabase
  .from('profiles')
  .select('email, role, full_name')
  .eq('id', userId)
  .single();

if (profile?.role !== 'SUPER_ADMIN') {
  console.error('   ❌ Le rôle n\'a pas été appliqué correctement:', profile);
  process.exit(1);
}

console.log(`   ✅ Rôle vérifié : ${profile.role}`);

// Résumé final
console.log('\n' + '━'.repeat(50));
console.log('🎉  COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS');
console.log('━'.repeat(50));
console.log(`   Email        : ${ADMIN_EMAIL}`);
console.log(`   Mot de passe : ${ADMIN_PASSWORD}`);
console.log(`   Rôle         : SUPER_ADMIN`);
console.log(`   Nom          : ${ADMIN_NAME}`);
console.log('');
console.log('   Connexion → http://localhost:3000/login');
console.log('   Dashboard → http://localhost:3000/admin');
console.log('━'.repeat(50) + '\n');
