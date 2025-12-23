/**
 * Script para limpar documentos inválidos da coleção 'calls' no Firebase
 *
 * Documentos com IDs contendo "/" causam erro no Firestore.
 * Este script remove todos os documentos da coleção 'calls' para permitir
 * que novos documentos sejam criados com IDs sanitizados.
 *
 * Execute: npx tsx scripts/cleanInvalidCallDocs.ts
 */

import { db } from '../services/firebase';

async function cleanInvalidCallDocs() {
  if (!db) {
    console.error('❌ Firebase não inicializado!');
    return;
  }

  console.log('🔍 Buscando documentos na coleção "calls"...');

  try {
    const snapshot = await db.collection('calls').get();

    if (snapshot.empty) {
      console.log('✅ Nenhum documento encontrado na coleção "calls".');
      return;
    }

    console.log(`📋 Encontrados ${snapshot.size} documentos.`);
    console.log('🗑️  Removendo todos os documentos...');

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      console.log(`   - Removendo: ${doc.id}`);
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`✅ ${count} documentos removidos com sucesso!`);
    console.log('✨ A coleção "calls" está limpa. Novos documentos usarão IDs sanitizados.');

  } catch (error) {
    console.error('❌ Erro ao limpar documentos:', error);
  }

  process.exit(0);
}

cleanInvalidCallDocs();
