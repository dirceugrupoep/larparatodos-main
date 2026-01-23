import { generateMonthlyCharges, checkPaymentStatus } from '../jobs/generateMonthlyCharges.js';
import dotenv from 'dotenv';

dotenv.config();

// Executar geração de cobranças mensais
console.log('🔄 Executando job de geração de cobranças mensais...');
generateMonthlyCharges()
  .then((result) => {
    console.log(`✅ Job concluído: ${result.success} sucessos, ${result.errors} erros`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no job:', error);
    process.exit(1);
  });
