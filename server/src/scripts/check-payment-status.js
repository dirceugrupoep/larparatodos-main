import { checkPaymentStatus, updateOverduePayments } from '../jobs/generateMonthlyCharges.js';
import dotenv from 'dotenv';

dotenv.config();

// Executar atualização de vencidos e verificação de status
async function run() {
  try {
    // Primeiro atualizar pagamentos vencidos
    console.log('🔄 Atualizando pagamentos vencidos...');
    await updateOverduePayments();

    // Depois verificar status no Ciabra
    console.log('🔄 Verificando status de pagamentos no Ciabra...');
    const result = await checkPaymentStatus();
    
    console.log(`✅ Verificação concluída: ${result.updated} pagamentos atualizados`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

run();
