import { updateOverduePayments } from '../jobs/generateMonthlyCharges.js';
import dotenv from 'dotenv';

dotenv.config();

// Executar atualização de pagamentos vencidos
console.log('🔄 Executando atualização de pagamentos vencidos...');
updateOverduePayments()
  .then((result) => {
    console.log(`✅ Atualização concluída: ${result.updated} pagamentos marcados como vencidos`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na atualização:', error);
    process.exit(1);
  });
