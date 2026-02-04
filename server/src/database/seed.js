import { pool } from './connection.js';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  try {
    console.log('🌱 Running seeds...');

    // 1. Criar associação padrão
    let defaultAssociation;
    
    // Verificar se já existe associação com o CNPJ fornecido
    const existingByCNPJ = await pool.query(
      "SELECT id, is_default FROM associations WHERE cnpj = '55912593000154'"
    );

    if (existingByCNPJ.rows.length > 0) {
      defaultAssociation = { id: existingByCNPJ.rows[0].id };
      // Garantir que está marcada como padrão e aprovada
      if (!existingByCNPJ.rows[0].is_default) {
        await pool.query(
          "UPDATE associations SET is_default = true, is_approved = true, is_active = true WHERE cnpj = '55912593000154'"
        );
      }
      console.log('✅ Associação padrão já existe');
    } else {
      // Verificar se existe outra associação padrão
      const existingDefault = await pool.query(
        "SELECT id FROM associations WHERE is_default = true"
      );
      
      // Se existir outra padrão, remover o flag
      if (existingDefault.rows.length > 0) {
        await pool.query(
          "UPDATE associations SET is_default = false WHERE is_default = true"
        );
      }
      
      // Criar associação padrão com os dados fornecidos
      const hashedPassword = await bcrypt.hash('larparatodos123', 10);
      
      const associationResult = await pool.query(
        `INSERT INTO associations (
          cnpj, corporate_name, trade_name, email, password, phone, 
          address, city, state, zip_code, is_active, is_default, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, corporate_name, trade_name, cnpj, email`,
        [
          '55912593000154',
          'Larparatodos',
          'Larparatodos',
          'larparatodos@larparatodos.com.br',
          hashedPassword,
          null,
          null,
          null,
          null,
          null,
          true,
          true,
          true // Já aprovada por padrão
        ]
      );
      defaultAssociation = associationResult.rows[0];
      console.log('✅ Associação padrão criada!');
      console.log(`   Nome: ${defaultAssociation.corporate_name}`);
      console.log(`   CNPJ: ${defaultAssociation.cnpj}`);
      console.log(`   Email: ${defaultAssociation.email}`);
      console.log(`   Senha padrão: larparatodos123`);
      console.log(`   ID: ${defaultAssociation.id}`);
    }

    // 2. Verificar se já existe admin
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = 'dirceu.oliveira@grupoep.com.br'"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin já existe, pulando criação');
    } else {
    // 3. Criar admin vinculado à associação padrão
    const hashedPassword = await bcrypt.hash('senha123', 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, is_admin, is_active, association_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, is_admin`,
      [
        'Dirceu Oliveira',
        'dirceu.oliveira@grupoep.com.br',
        hashedPassword,
        true,
        true,
        defaultAssociation.id
      ]
    );

    console.log('✅ Admin criado com sucesso!');
    console.log(`   Email: dirceu.oliveira@grupoep.com.br`);
    console.log(`   Senha: senha123`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Associação: ${defaultAssociation.corporate_name}`);
    }

    // 3b. Criar admin "fake" (vê apenas cadastros fake e balanço dos fakes)
    const fakeAdminEmail = 'admin@larparatodoshabitacional.com.br';
    const existingFakeAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [fakeAdminEmail]
    );
    if (existingFakeAdmin.rows.length === 0) {
      const fakeAdminPassword = await bcrypt.hash('admin123456789', 10);
      await pool.query(
        `INSERT INTO users (name, email, password, is_admin, is_active, association_id, fake)
         VALUES ($1, $2, $3, true, true, $4, false)`,
        ['Admin Larparatodos', fakeAdminEmail, fakeAdminPassword, defaultAssociation.id]
      );
      console.log('✅ Admin fake criado: ' + fakeAdminEmail + ' / Senha: admin123456789');
    } else {
      console.log('✅ Admin fake já existe');
    }

    // 4. Criar termo de aceite padrão
    const existingTerm = await pool.query(
      "SELECT id FROM terms_of_acceptance WHERE version = '1.0'"
    );

    if (existingTerm.rows.length === 0) {
      const termContent = `TERMO DE ACEITE E CONDIÇÕES DE USO - LARPARATODOS COOPERATIVA HABITACIONAL

Este documento estabelece os termos e condições que regem o uso da plataforma Larparatodos, uma cooperativa habitacional que visa facilitar o acesso à moradia através de um sistema colaborativo de contribuições mensais.

================================================================================
1. ACEITAÇÃO DOS TERMOS E CONDIÇÕES
================================================================================

Ao acessar, navegar ou utilizar a plataforma Larparatodos, você (doravante denominado "Usuário", "Cooperado" ou "Você") declara ter lido, compreendido e aceitado integralmente todos os termos e condições aqui estabelecidos.

Este termo constitui um acordo legalmente vinculante entre você e a Larparatodos Cooperativa Habitacional (doravante denominada "Larparatodos", "Nós" ou "Nossa"), regendo sua participação na plataforma e nos projetos habitacionais oferecidos.

Se você não concorda com qualquer parte destes termos, não deve utilizar a plataforma ou se cadastrar como usuário.

================================================================================
2. DEFINIÇÕES E OBJETIVO DA PLATAFORMA
================================================================================

2.1. A Larparatodos é uma cooperativa habitacional que tem como objetivo principal facilitar o acesso à moradia própria através de um sistema inovador de contribuições mensais, permitindo que famílias realizem o sonho da casa própria de forma organizada e transparente.

2.2. A plataforma digital Larparatodos oferece:
   • Sistema de cadastro e gestão de usuários
   • Vinculação a associações cooperativas parceiras
   • Acompanhamento de pagamentos e contribuições mensais
   • Monitoramento do progresso de projetos habitacionais
   • Comunicação entre usuários e associações
   • Relatórios e transparência financeira

2.3. A Larparatodos atua como intermediária entre os usuários e as associações cooperativas, facilitando o processo de participação em projetos habitacionais, mas não se responsabiliza pelas decisões operacionais das associações parceiras.

================================================================================
3. CADASTRO E CONTA DO USUÁRIO
================================================================================

3.1. REQUISITOS PARA CADASTRO:
   Para utilizar a plataforma, você deve:
   • Ser maior de 18 anos ou estar devidamente representado
   • Possuir capacidade civil plena
   • Fornecer informações verdadeiras, precisas, atualizadas e completas
   • Manter a confidencialidade de suas credenciais de acesso

3.2. DADOS OBRIGATÓRIOS PARA CADASTRO:
   • Nome completo (conforme documento de identidade)
   • CPF (Cadastro de Pessoa Física) válido e não cadastrado anteriormente
   • E-mail válido e de uso pessoal
   • Telefone de contato atualizado
   • Senha segura (mínimo de 6 caracteres)
   • Seleção de uma associação cooperativa parceira

3.3. RESPONSABILIDADES DO USUÁRIO:
   • Você é o único responsável por manter a confidencialidade de suas credenciais de acesso (e-mail e senha)
   • Você é responsável por todas as atividades que ocorram em sua conta
   • Você deve notificar imediatamente a Larparatodos sobre qualquer uso não autorizado de sua conta ou qualquer violação de segurança
   • Você deve manter seus dados atualizados e corretos
   • Você não deve compartilhar suas credenciais com terceiros

3.4. VERIFICAÇÃO DE DADOS:
   A Larparatodos se reserva o direito de verificar a veracidade dos dados fornecidos e pode solicitar documentação adicional quando necessário. Informações falsas ou incorretas podem resultar na suspensão ou cancelamento imediato da conta.

================================================================================
4. ASSOCIAÇÃO COOPERATIVA E VINCULAÇÃO
================================================================================

4.1. Ao se cadastrar na plataforma, você deve selecionar uma associação cooperativa parceira à qual deseja se vincular. Cada associação possui suas próprias regras, valores de contribuição e condições específicas.

4.2. A seleção da associação é de sua responsabilidade. Recomendamos que você:
   • Leia atentamente as informações sobre cada associação disponível
   • Verifique os valores das contribuições mensais
   • Consulte os prazos e condições de participação
   • Entre em contato com a associação escolhida para esclarecer dúvidas

4.3. A Larparatodos não se responsabiliza pelas decisões, políticas ou ações das associações cooperativas parceiras. Cada associação é uma entidade independente com suas próprias diretrizes e procedimentos.

4.4. A troca de associação após o cadastro pode estar sujeita a regras específicas da associação de origem e de destino, podendo envolver taxas ou condições especiais.

================================================================================
5. CONTRIBUIÇÕES E PAGAMENTOS
================================================================================

5.1. OBRIGAÇÃO DE PAGAMENTO:
   Ao se vincular a uma associação cooperativa, você se compromete a realizar as contribuições mensais conforme estabelecido no contrato ou acordo com a associação escolhida.

5.2. VALORES E PRAZOS:
   • Os valores das contribuições são definidos pela associação cooperativa selecionada
   • Os prazos de pagamento são estabelecidos pela associação
   • Todos os valores são expressos em Reais (BRL - R$)
   • Os valores podem ser ajustados pela associação mediante aviso prévio e conforme previsto em contrato

5.3. MÉTODOS DE PAGAMENTO:
   Os pagamentos podem ser realizados através dos métodos aceitos pela associação, que podem incluir:
   • Boleto bancário
   • Transferência bancária (PIX, TED, DOC)
   • Cartão de crédito ou débito
   • Outros métodos definidos pela associação

5.4. ATRASO E INADIMPLÊNCIA:
   • O não pagamento das contribuições dentro do prazo estabelecido pode resultar em:
     - Cobrança de juros e multas conforme previsto em contrato
     - Suspensão temporária de acesso à plataforma
     - Cancelamento da participação no projeto habitacional
     - Aplicação de penalidades previstas pela associação
   
   • A Larparatodos não se responsabiliza por problemas relacionados a métodos de pagamento de terceiros (bancos, processadores de pagamento, etc.)

5.5. REEMBOLSOS:
   As políticas de reembolso são definidas pela associação cooperativa à qual você está vinculado. Consulte diretamente sua associação para informações sobre possibilidade de reembolso.

================================================================================
6. PRIVACIDADE E PROTEÇÃO DE DADOS PESSOAIS
================================================================================

6.1. CONFORMIDADE COM A LGPD:
   A Larparatodos coleta, processa e armazena seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.

6.2. DADOS COLETADOS:
   Coletamos e processamos os seguintes dados pessoais:
   • Dados de identificação: nome completo, CPF, RG
   • Dados de contato: e-mail, telefone, endereço
   • Dados financeiros: informações de pagamento e histórico de contribuições
   • Dados de navegação: IP, cookies, logs de acesso
   • Dados de aceite: registro de aceitação de termos e políticas

6.3. FINALIDADES DO USO DOS DADOS:
   Seus dados pessoais são utilizados para:
   • Gerenciamento de sua conta e participação na cooperativa
   • Processamento e controle de pagamentos e contribuições
   • Comunicação sobre o projeto habitacional e atualizações
   • Melhoria e desenvolvimento dos serviços oferecidos
   • Cumprimento de obrigações legais e regulatórias
   • Prevenção de fraudes e garantia de segurança
   • Análise estatística e geração de relatórios

6.4. COMPARTILHAMENTO DE DADOS:
   Seus dados podem ser compartilhados com:
   • A associação cooperativa à qual você está vinculado, para fins de gestão do projeto
   • Prestadores de serviços terceirizados (processadores de pagamento, hospedagem, etc.)
   • Autoridades competentes, quando exigido por lei ou ordem judicial
   • Empresas parceiras, sempre com seu consentimento prévio

6.5. SEUS DIREITOS (LGPD):
   Você tem direito a:
   • Confirmar a existência de tratamento de dados
   • Acessar seus dados pessoais
   • Corrigir dados incompletos, inexatos ou desatualizados
   • Solicitar anonimização, bloqueio ou eliminação de dados desnecessários
   • Solicitar portabilidade dos dados
   • Revogar seu consentimento
   • Ser informado sobre compartilhamento de dados
   • Ser informado sobre a possibilidade de não fornecer consentimento e suas consequências

6.6. SEGURANÇA DOS DADOS:
   Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.

================================================================================
7. RESPONSABILIDADES E OBRIGAÇÕES DO USUÁRIO
================================================================================

7.1. OBRIGAÇÕES GERAIS:
   Você se compromete a:
   • Fornecer informações verdadeiras, precisas, atualizadas e completas
   • Manter a segurança e confidencialidade de sua conta e credenciais
   • Realizar os pagamentos dentro dos prazos estabelecidos
   • Respeitar as regras e políticas da associação cooperativa escolhida
   • Utilizar a plataforma apenas para fins legítimos e autorizados
   • Não utilizar a plataforma para atividades ilegais, fraudulentas ou que violem direitos de terceiros
   • Não tentar acessar áreas restritas da plataforma
   • Não interferir ou interromper o funcionamento da plataforma
   • Não transmitir vírus, malware ou códigos maliciosos
   • Não realizar engenharia reversa ou tentar extrair código-fonte da plataforma

7.2. RESPONSABILIDADE POR ATIVIDADES:
   Você é integralmente responsável por todas as atividades realizadas em sua conta, incluindo:
   • Todas as ações e transações realizadas
   • Qualquer conteúdo publicado ou compartilhado
   • Qualquer violação destes termos ou de leis aplicáveis

7.3. NOTIFICAÇÃO DE PROBLEMAS:
   Você deve notificar imediatamente a Larparatodos sobre:
   • Uso não autorizado de sua conta
   • Qualquer violação de segurança
   • Erros ou problemas técnicos encontrados
   • Suspeita de atividades fraudulentas

================================================================================
8. LIMITAÇÃO DE RESPONSABILIDADE
================================================================================

8.1. NATUREZA DA INTERMEDIAÇÃO:
   A Larparatodos atua como intermediária entre usuários e associações cooperativas, fornecendo uma plataforma digital para facilitar a gestão e o acompanhamento de projetos habitacionais.

8.2. EXCLUSÕES DE RESPONSABILIDADE:
   A Larparatodos NÃO se responsabiliza por:
   • Decisões, políticas, ações ou omissões das associações cooperativas parceiras
   • Atrasos, problemas ou cancelamentos de projetos habitacionais
   • Problemas técnicos de terceiros (bancos, processadores de pagamento, provedores de internet)
   • Perdas, danos ou prejuízos decorrentes de uso indevido da plataforma
   • Interrupções temporárias ou permanentes do serviço por motivos técnicos ou de força maior
   • Perda de dados devido a falhas técnicas ou ataques cibernéticos
   • Decisões judiciais ou administrativas que afetem projetos habitacionais
   • Alterações em políticas governamentais que impactem projetos habitacionais

8.3. LIMITAÇÃO DE DANOS:
   Na medida máxima permitida por lei, a responsabilidade total da Larparatodos, em qualquer caso, está limitada ao valor das taxas pagas pelo usuário nos últimos 12 meses, excluindo-se danos indiretos, lucros cessantes, danos morais ou outros danos não diretamente relacionados ao uso da plataforma.

8.4. SUSPENSÃO E CANCELAMENTO:
   A Larparatodos se reserva o direito de suspender ou cancelar contas que:
   • Violarem estes termos e condições
   • Violarem políticas da plataforma
   • Utilizarem a plataforma para fins ilegais
   • Fornecerem informações falsas ou enganosas
   • Estiverem inadimplentes com suas obrigações financeiras

================================================================================
9. PROPRIEDADE INTELECTUAL
================================================================================

9.1. DIREITOS DE PROPRIEDADE:
   Todo o conteúdo da plataforma Larparatodos, incluindo mas não limitado a:
   • Textos, gráficos, logos, ícones, imagens e fotografias
   • Software, código-fonte, algoritmos e funcionalidades
   • Design, layout e interface gráfica
   • Marcas, nomes comerciais e sinais distintivos
   • Bases de dados e estruturas de informação
   
   É propriedade exclusiva da Larparatodos ou de seus licenciadores e está protegido por leis de propriedade intelectual, direitos autorais, marcas e outras leis aplicáveis.

9.2. PROIBIÇÕES:
   É expressamente proibido, sem autorização prévia e por escrito da Larparatodos:
   • Reproduzir, copiar, duplicar ou clonar qualquer parte da plataforma
   • Distribuir, publicar, transmitir ou disponibilizar o conteúdo para terceiros
   • Modificar, adaptar, traduzir ou criar obras derivadas
   • Realizar engenharia reversa, descompilar ou desmontar o software
   • Utilizar robôs, spiders ou outros métodos automatizados para acessar a plataforma
   • Remover ou alterar avisos de direitos autorais, marcas ou outros sinais distintivos

9.3. CONTEÚDO DO USUÁRIO:
   Ao fornecer conteúdo através da plataforma (mensagens, comentários, etc.), você concede à Larparatodos uma licença não exclusiva, mundial, livre de royalties para usar, reproduzir, modificar e distribuir tal conteúdo para fins de operação e melhoria da plataforma.

================================================================================
10. MODIFICAÇÕES DOS TERMOS E DA PLATAFORMA
================================================================================

10.1. ALTERAÇÕES NOS TERMOS:
   A Larparatodos se reserva o direito de modificar, atualizar ou alterar estes termos e condições a qualquer momento, mediante comunicação prévia aos usuários.

10.2. NOTIFICAÇÃO DE MUDANÇAS:
   Alterações significativas nos termos serão comunicadas aos usuários através de:
   • E-mail cadastrado
   • Notificações na plataforma
   • Avisos no site
   
   A comunicação será realizada com pelo menos 30 (trinta) dias de antecedência, quando aplicável.

10.3. ACEITAÇÃO DE MUDANÇAS:
   O uso continuado da plataforma após a publicação das modificações constitui aceitação tácita dos novos termos. Se você não concordar com as alterações, deve cessar o uso da plataforma e solicitar o cancelamento de sua conta.

10.4. ALTERAÇÕES NA PLATAFORMA:
   A Larparatodos pode modificar, suspender, descontinuar ou interromper qualquer aspecto da plataforma a qualquer momento, com ou sem aviso prévio, sem que isso gere responsabilidade para com os usuários.

================================================================================
11. CANCELAMENTO E RESCISÃO
================================================================================

11.1. CANCELAMENTO PELO USUÁRIO:
   Você pode solicitar o cancelamento de sua conta a qualquer momento através:
   • Área de configurações da plataforma
   • Contato direto com o suporte
   • Comunicação escrita à Larparatodos
   
   O cancelamento da conta não isenta você de obrigações financeiras pendentes junto à associação cooperativa.

11.2. CANCELAMENTO PELA LARPARATODOS:
   A Larparatodos pode suspender ou cancelar sua conta imediatamente, sem aviso prévio, se você:
   • Violar estes termos e condições
   • Violar políticas da plataforma
   • Utilizar a plataforma para fins ilegais ou não autorizados
   • Fornecer informações falsas ou enganosas
   • Estiver inadimplente com obrigações financeiras
   • Praticar qualquer conduta que a Larparatodos considere inadequada

11.3. CONSEQUÊNCIAS DO CANCELAMENTO:
   Após o cancelamento:
   • Você perderá acesso à sua conta e à plataforma
   • Seus dados poderão ser mantidos conforme exigências legais
   • Obrigações financeiras pendentes permanecerão válidas
   • A associação cooperativa será notificada sobre o cancelamento

11.4. RETENÇÃO DE DADOS:
   A Larparatodos pode reter seus dados pessoais após o cancelamento da conta conforme exigências legais, regulatórias ou para resolução de disputas.

================================================================================
12. LEI APLICÁVEL E FORO
================================================================================

12.1. LEGISLAÇÃO APLICÁVEL:
   Estes termos e condições são regidos exclusivamente pela legislação brasileira, especialmente:
   • Código de Defesa do Consumidor (Lei nº 8.078/1990)
   • Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
   • Código Civil Brasileiro (Lei nº 10.406/2002)
   • Demais legislações aplicáveis

12.2. FORO COMPETENTE:
   Para dirimir quaisquer controvérsias ou questões oriundas destes termos, as partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, renunciando expressamente a qualquer outro, por mais privilegiado que seja.

12.3. MEDIAÇÃO E ARBITRAGEM:
   Antes de recorrer ao Poder Judiciário, as partes se comprometem a tentar resolver eventuais controvérsias através de mediação ou arbitragem, conforme previsto em lei.

================================================================================
13. DISPOSIÇÕES GERAIS
================================================================================

13.1. INTEGRIDADE DO ACORDO:
   Estes termos constituem o acordo integral entre você e a Larparatodos em relação ao uso da plataforma, substituindo todos os acordos anteriores.

13.2. SEVERABILIDADE:
   Se qualquer disposição destes termos for considerada inválida, ilegal ou inexequível por um tribunal competente, tal disposição será modificada na medida do necessário para torná-la válida, e as demais disposições permanecerão em pleno vigor e efeito.

13.3. TOLERÂNCIA:
   A tolerância ou falta de exigência de cumprimento de qualquer cláusula destes termos não constitui renúncia de direitos, não impedindo que a Larparatodos exija o cumprimento posteriormente.

13.4. CESSÃO:
   Você não pode ceder, transferir ou sublicenciar seus direitos ou obrigações sob estes termos sem o consentimento prévio e por escrito da Larparatodos. A Larparatodos pode ceder ou transferir estes termos a qualquer momento.

13.5. COMUNICAÇÕES:
   Todas as comunicações relacionadas a estes termos devem ser feitas por escrito através dos canais oficiais da Larparatodos disponíveis na plataforma.

13.6. VIGÊNCIA:
   Este termo entra em vigor imediatamente após sua aceitação pelo usuário e permanece válido enquanto você utilizar a plataforma ou manter uma conta ativa.

================================================================================
14. CONTATO E SUPORTE
================================================================================

14.1. CANAIS DE CONTATO:
   Para questões relacionadas a estes termos, à plataforma ou ao seu cadastro, você pode entrar em contato através de:
   • E-mail: contato@larparatodos.org.br
   • Telefone: (11) 99999-9999
   • Formulário de contato na plataforma
   • Canais oficiais disponíveis no site

14.2. HORÁRIO DE ATENDIMENTO:
   O atendimento está disponível de segunda a sexta-feira, das 9h às 18h, exceto feriados.

14.3. TEMPO DE RESPOSTA:
   Comprometemo-nos a responder suas solicitações em até 5 (cinco) dias úteis.

================================================================================
15. DECLARAÇÃO FINAL
================================================================================

Ao clicar em "Aceito os Termos e Condições" ou ao utilizar a plataforma Larparatodos, você declara expressamente que:

✓ Leu, compreendeu e aceitou integralmente todos os termos e condições aqui estabelecidos
✓ Tem capacidade legal para celebrar este acordo
✓ Forneceu informações verdadeiras e precisas
✓ Está ciente de suas responsabilidades e obrigações
✓ Concorda em cumprir todas as regras e políticas da plataforma
✓ Autoriza o tratamento de seus dados pessoais conforme descrito neste termo
✓ Reconhece que a Larparatodos pode modificar estes termos conforme previsto
✓ Aceita que este acordo é regido pela legislação brasileira

Se você não concorda com qualquer parte destes termos, NÃO deve utilizar a plataforma ou se cadastrar como usuário.

Última atualização: Janeiro de 2026
Versão: 1.0`;

      await pool.query(
        `INSERT INTO terms_of_acceptance (version, title, content, is_active)
         VALUES ($1, $2, $3, $4)`,
        [
          '1.0',
          'Termo de Aceite e Condições de Uso - Larparatodos',
          termContent,
          true
        ]
      );
      console.log('✅ Termo de aceite criado!');
    } else {
      console.log('✅ Termo de aceite já existe');
    }

    // 5. Seed de usuários fake (26.000) — roda apenas uma vez (idempotente)
    const FAKE_TARGET = 26000;
    const countFake = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE fake = true"
    );
    const currentFake = parseInt(countFake.rows[0].total, 10);

    if (currentFake >= FAKE_TARGET) {
      console.log(`✅ Já existem ${currentFake} usuários fake (meta: ${FAKE_TARGET}), pulando seed de fakes.`);
    } else {
      const assocResult = await pool.query('SELECT id FROM associations WHERE is_active = true');
      const associationIds = assocResult.rows.map((r) => r.id);
      if (associationIds.length === 0) {
        console.log('⚠️ Nenhuma associação ativa; seed de fakes ignorado.');
      } else {
        const toInsert = FAKE_TARGET - currentFake;
        console.log(`🌱 Inserindo ${toInsert} usuários fake (${currentFake} já existentes)...`);

        // Carrega dump pré-gerado se existir (mais rápido e automatizado)
        const dumpPath = join(__dirname, 'seed-fake-users.json');
        let records = [];
        if (existsSync(dumpPath)) {
          try {
            const raw = readFileSync(dumpPath, 'utf8');
            records = JSON.parse(raw);
            console.log(`   Usando dump pré-gerado: ${records.length} registros`);
          } catch (e) {
            console.warn('   Dump inválido ou corrompido, gerando dados em memória.');
          }
        }
        // Se não tem dump ou não tem registros suficientes, gera em memória
        const firstNames = [
          'Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
          'Igor', 'Julia', 'Lucas', 'Mariana', 'Nathan', 'Olivia', 'Pedro', 'Rafaela',
          'Samuel', 'Tatiana', 'Vitor', 'Amanda', 'Bernardo', 'Camila', 'Diego', 'Elisa',
          'Felipe', 'Giovana', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália'
        ];
        const lastNames = [
          'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
          'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
          'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso', 'Dias', 'Castro', 'Campos',
          'Teixeira', 'Moreira', 'Nunes', 'Mendes', 'Freitas', 'Cavalcanti', 'Ramos', 'Pinto'
        ];
        // Gera CPF válido (dígitos verificadores corretos) para fallback
        function gerarCpfValido() {
          const base = [];
          for (let i = 0; i < 9; i++) base.push(Math.floor(Math.random() * 10));
          if (new Set(base).size === 1) base[0] = (base[0] + 1) % 10;
          let soma = 0;
          for (let i = 0; i < 9; i++) soma += base[i] * (10 - i);
          let d1 = (soma * 10) % 11;
          if (d1 === 10) d1 = 0;
          base.push(d1);
          soma = 0;
          for (let i = 0; i < 10; i++) soma += base[i] * (11 - i);
          let d2 = (soma * 10) % 11;
          if (d2 === 10) d2 = 0;
          base.push(d2);
          return base.join('');
        }
        while (records.length < toInsert) {
          records.push({
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            cpf: gerarCpfValido(),
            payment_day: Math.floor(Math.random() * 31) + 1
          });
        }
        records = records.slice(0, toInsert);

        // E-mails aleatórios com domínios reais (sem palavra "fake"); Gmail em maior peso
        const DOMINIOS = [
          { d: 'gmail.com', p: 45 },
          { d: 'hotmail.com', p: 15 },
          { d: 'outlook.com', p: 8 },
          { d: 'yahoo.com.br', p: 8 },
          { d: 'uol.com.br', p: 8 },
          { d: 'bol.com.br', p: 5 },
          { d: 'live.com.br', p: 4 },
          { d: 'ig.com.br', p: 3 },
          { d: 'terra.com.br', p: 2 },
          { d: 'globo.com', p: 2 },
        ];
        function escolherDominio() {
          const total = DOMINIOS.reduce((s, x) => s + x.p, 0);
          let r = Math.floor(Math.random() * total);
          for (const { d, p } of DOMINIOS) {
            if (r < p) return d;
            r -= p;
          }
          return DOMINIOS[0].d;
        }
        function gerarEmailAleatorio(nome, sufixoUnico) {
          const local = nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9.]/g, '')
            .slice(0, 25) || 'user';
          return `${local}${sufixoUnico}@${escolherDominio()}`;
        }

        const fakePasswordHash = await bcrypt.hash('fake123', 10);
        const BATCH = 1000;
        let inserted = 0;

        for (let batchStart = 0; batchStart < toInsert; batchStart += BATCH) {
          const batchSize = Math.min(BATCH, toInsert - batchStart);
          const names = [];
          const emails = [];
          const assocIds = [];
          const paymentDays = [];
          const cpfs = [];

          for (let i = 0; i < batchSize; i++) {
            const r = records[batchStart + i];
            const globalIndex = currentFake + batchStart + i + 1;
            names.push(r.name);
            emails.push(gerarEmailAleatorio(r.name, globalIndex));
            assocIds.push(associationIds[Math.floor(Math.random() * associationIds.length)]);
            paymentDays.push(r.payment_day);
            cpfs.push(r.cpf);
          }

          const userPlaceholders = [];
          const userFlat = [];
          for (let i = 0; i < batchSize; i++) {
            const base = i * 5;
            userPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, false, true, true, $${base + 5})`);
            userFlat.push(names[i], emails[i], fakePasswordHash, assocIds[i], paymentDays[i]);
          }
          const userResult = await pool.query(
            `INSERT INTO users (name, email, password, association_id, is_admin, is_active, fake, payment_day)
             VALUES ${userPlaceholders.join(', ')}
             RETURNING id`,
            userFlat
          );
          const ids = userResult.rows.map((row) => row.id);

          await pool.query(
            `INSERT INTO user_profiles (user_id, cpf)
             SELECT * FROM UNNEST($1::int[], $2::text[])`,
            [ids, cpfs]
          );

          inserted += batchSize;
          if (batchStart % 5000 === 0 || batchStart + batchSize >= toInsert) {
            console.log(`   Inseridos ${inserted}/${toInsert} usuários fake...`);
          }
        }
        console.log(`✅ Seed de usuários fake concluído: ${inserted} inseridos.`);

        // 5a. Distribuir created_at dos usuários fake nos últimos 12 meses (para "Novos Hoje" / "Novos no Mês" não serem 26k)
        await pool.query(`
          UPDATE users
          SET created_at = NOW() - (random() * INTERVAL '60 days')
          WHERE fake = true
        `);
        console.log('   created_at dos fakes distribuído nos últimos 12 meses.');

        // 5b. Parcelas para usuários fake: apenas 2889 com 1-2 parcelas PAGAS; o restante tudo À VENCER
        const QUANTOS_COM_PAGAMENTO_PAGO = 2889;
        const fakeUserIds = await pool.query(`
          SELECT u.id FROM users u
          WHERE u.fake = true
          AND NOT EXISTS (SELECT 1 FROM payments WHERE user_id = u.id)
          ORDER BY u.id
        `);
        let userIds = fakeUserIds.rows.map((r) => r.id);
        if (userIds.length > 0) {
          // Embaralhar para escolher aleatoriamente quem terá parcelas pagas
          for (let i = userIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
          }
          const usersComPago = userIds.slice(0, Math.min(QUANTOS_COM_PAGAMENTO_PAGO, userIds.length));
          const usersAVencer = userIds.slice(usersComPago.length);

          const now = new Date();
          const paymentRows = [];

          // 2889 usuários: 1 ou 2 parcelas PAGAS (parte com paid_date no mês atual e hoje para Receita do Mês / Receita Hoje)
          for (const uid of usersComPago) {
            const numParcelas = Math.random() < 0.5 ? 1 : 2;
            // Uma parcela por usuário pode ser "deste mês" (~25%) ou "de hoje" (~5%); o resto no passado
            const parcelaMesAtual = numParcelas === 1 ? (Math.random() < 0.25) : (Math.random() < 0.15);
            const parcelaHoje = Math.random() < 0.05;
            const baseMonth = 2 + Math.floor(Math.random() * 10);
            for (let p = 0; p < numParcelas; p++) {
              const dueDate = new Date(now.getFullYear(), now.getMonth() - baseMonth - p, 10);
              let paidDateStr;
              if (p === 0 && parcelaHoje) {
                paidDateStr = now.toISOString().split('T')[0];
              } else if (p === 0 && parcelaMesAtual) {
                const dia = 1 + Math.floor(Math.random() * Math.min(28, now.getDate()));
                const paidDate = new Date(now.getFullYear(), now.getMonth(), dia);
                paidDateStr = paidDate.toISOString().split('T')[0];
              } else {
                const paidDate = new Date(dueDate);
                paidDate.setDate(paidDate.getDate() + (Math.random() < 0.7 ? 0 : 1));
                paidDateStr = paidDate.toISOString().split('T')[0];
              }
              paymentRows.push({
                user_id: uid,
                amount: 150,
                due_date: dueDate.toISOString().split('T')[0],
                paid_date: paidDateStr,
                status: 'paid'
              });
            }
          }

          // Restante: 1 ou 2 parcelas À VENCER (pending)
          for (const uid of usersAVencer) {
            const numParcelas = Math.random() < 0.5 ? 1 : 2;
            for (let p = 0; p < numParcelas; p++) {
              const dueDate = new Date(now.getFullYear(), now.getMonth() + p, 10);
              paymentRows.push({
                user_id: uid,
                amount: 150,
                due_date: dueDate.toISOString().split('T')[0],
                paid_date: null,
                status: 'pending'
              });
            }
          }

          const PAYMENT_BATCH = 1000;
          for (let i = 0; i < paymentRows.length; i += PAYMENT_BATCH) {
            const batch = paymentRows.slice(i, i + PAYMENT_BATCH);
            const values = batch.map((b) =>
              b.paid_date
                ? `(${b.user_id}, ${b.amount}, '${b.due_date}', '${b.paid_date}', '${b.status}')`
                : `(${b.user_id}, ${b.amount}, '${b.due_date}', NULL, '${b.status}')`
            ).join(', ');
            await pool.query(
              `INSERT INTO payments (user_id, amount, due_date, paid_date, status) VALUES ${values}`
            );
          }
          console.log(`✅ Parcelas criadas: ${usersComPago.length} usuários com 1-2 pagas; ${usersAVencer.length} usuários com parcelas à vencer.`);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Aguardar banco estar pronto
async function waitForDatabase(maxRetries = 30, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error('Database connection timeout');
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

waitForDatabase().then(() => seed());

