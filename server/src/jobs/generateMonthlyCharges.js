import { pool } from '../database/connection.js';
import { createCharge } from '../services/ciabra.js';

/**
 * Gera cobranças mensais para todos os usuários ativos
 * Deve ser executado diariamente (ex: via cron)
 */
export async function generateMonthlyCharges() {
  try {
    console.log('🔄 Iniciando geração de cobranças mensais...');

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Determinar qual dia processar (10 ou 20) e mês
    let targetDay = null;
    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (currentDay >= 1 && currentDay <= 9) {
      // Se estamos entre dia 1-9, gerar cobranças para dia 10 deste mês
      targetDay = 10;
    } else if (currentDay >= 10 && currentDay <= 19) {
      // Se estamos entre dia 10-19, gerar cobranças para dia 20 deste mês
      targetDay = 20;
    } else {
      // Se estamos após dia 20, gerar cobranças para o próximo mês (dia 10)
      targetDay = 10;
      targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    }

    // Buscar usuários com payment_day = targetDay que ainda não têm cobrança para este mês
    const dueDate = new Date(targetYear, targetMonth, targetDay);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Buscar usuários ativos com o dia de pagamento correspondente
    const usersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.payment_day, up.cpf
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.is_active = TRUE
         AND u.payment_day = $1
         AND u.is_admin = FALSE
         AND NOT EXISTS (
           SELECT 1 FROM payments p
           WHERE p.user_id = u.id
             AND p.due_date = $2
         )`,
      [targetDay, dueDateStr]
    );

    console.log(`📋 Encontrados ${usersResult.rows.length} usuários para processar (dia ${targetDay})`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersResult.rows) {
      try {
        // Valor padrão da contribuição (pode ser configurável por associação)
        const amount = 150.00;

        // Criar registro de pagamento primeiro
        const paymentResult = await pool.query(
          `INSERT INTO payments (user_id, amount, due_date, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING id`,
          [user.id, amount, dueDateStr]
        );

        const paymentId = paymentResult.rows[0].id;

        // Criar cobrança no Ciabra (PIX por padrão)
        const chargeData = await createCharge({
          amount,
          due_date: dueDateStr,
          description: `Contribuição mensal - ${dueDateStr}`,
          customer: {
            name: user.name,
            email: user.email,
            document: user.cpf,
            phone: user.phone,
          },
          payment_method: 'pix', // Padrão PIX, pode ser configurável
        });

        // Atualizar pagamento com dados do Ciabra
        await pool.query(
          `UPDATE payments 
           SET ciabra_charge_id = $1,
               ciabra_pix_qr_code = $2,
               ciabra_pix_qr_code_url = $3,
               ciabra_boleto_url = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            chargeData.id || chargeData.charge_id,
            chargeData.pix?.qr_code || chargeData.pix_qr_code,
            chargeData.pix?.qr_code_url || chargeData.pix_qr_code_url,
            chargeData.boleto?.url || chargeData.boleto_url,
            paymentId,
          ]
        );

        successCount++;
        console.log(`✅ Cobrança criada para usuário ${user.id} (${user.name})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Erro ao criar cobrança para usuário ${user.id}:`, error);
      }
    }

    console.log(`✅ Geração de cobranças concluída: ${successCount} sucessos, ${errorCount} erros`);
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error('❌ Erro ao gerar cobranças mensais:', error);
    throw error;
  }
}

/**
 * Atualiza status de pagamentos vencidos para 'overdue'
 * Deve ser executado diariamente
 */
export async function updateOverduePayments() {
  try {
    console.log('🔄 Atualizando pagamentos vencidos...');

    // Marcar pagamentos vencidos como overdue
    const result = await pool.query(
      `UPDATE payments 
       SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'pending' 
         AND due_date < CURRENT_DATE
       RETURNING id`,
      []
    );

    console.log(`✅ ${result.rows.length} pagamentos marcados como vencidos`);
    return { updated: result.rows.length };
  } catch (error) {
    console.error('❌ Erro ao atualizar pagamentos vencidos:', error);
    throw error;
  }
}

/**
 * Verifica e atualiza status de pagamentos pendentes via Ciabra
 * Deve ser executado periodicamente (ex: a cada hora)
 */
export async function checkPaymentStatus() {
  try {
    console.log('🔄 Verificando status de pagamentos pendentes...');

    // Buscar pagamentos pendentes com charge_id
    const paymentsResult = await pool.query(
      `SELECT id, ciabra_charge_id, status, due_date
       FROM payments
       WHERE status IN ('pending', 'overdue')
         AND ciabra_charge_id IS NOT NULL
         AND due_date <= CURRENT_DATE + INTERVAL '7 days'`,
      []
    );

    console.log(`📋 Encontrados ${paymentsResult.rows.length} pagamentos para verificar`);

    const { getChargeStatus } = await import('../services/ciabra.js');
    let updatedCount = 0;

    for (const payment of paymentsResult.rows) {
      try {
        const chargeData = await getChargeStatus(payment.ciabra_charge_id);

        // Mapear status
        const statusMap = {
          pending: 'pending',
          paid: 'paid',
          overdue: 'overdue',
          cancelled: 'cancelled',
        };

        const newStatus = statusMap[chargeData.status] || chargeData.status;

        if (newStatus !== payment.status) {
          const updateData = {
            status: newStatus,
            updated_at: new Date(),
          };

          if (newStatus === 'paid' && chargeData.paid_at) {
            updateData.paid_date = new Date(chargeData.paid_at);
          }

          await pool.query(
            `UPDATE payments 
             SET status = $1,
                 paid_date = $2,
                 updated_at = $3
             WHERE id = $4`,
            [
              updateData.status,
              updateData.paid_date || null,
              updateData.updated_at,
              payment.id,
            ]
          );

          updatedCount++;
          console.log(`✅ Pagamento ${payment.id} atualizado para: ${newStatus}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar pagamento ${payment.id}:`, error);
      }
    }

    console.log(`✅ Verificação concluída: ${updatedCount} pagamentos atualizados`);
    return { updated: updatedCount };
  } catch (error) {
    console.error('❌ Erro ao verificar status de pagamentos:', error);
    throw error;
  }
}

// Se executado diretamente, rodar a geração
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMonthlyCharges()
    .then(() => {
      console.log('✅ Job concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no job:', error);
      process.exit(1);
    });
}
