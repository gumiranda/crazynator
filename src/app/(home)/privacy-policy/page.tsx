'use client';

import Image from 'next/image';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Crazy Code"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold text-center">Política de Privacidade</h1>
        <p className="text-muted-foreground text-center text-sm md:text-base">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </section>

      <div className="prose prose-gray dark:prose-invert max-w-none mt-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Informações que Coletamos</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              A Crazy Code coleta informações que você nos fornece diretamente quando:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cria uma conta em nossa plataforma</li>
              <li>Utiliza nossos serviços</li>
              <li>Entra em contato conosco</li>
              <li>Participa de pesquisas ou promoções</li>
            </ul>
            <p>
              Também coletamos automaticamente certas informações quando você usa nossos serviços, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informações de dispositivo (tipo, sistema operacional, navegador)</li>
              <li>Dados de uso (páginas visitadas, tempo gasto, recursos utilizados)</li>
              <li>Endereço IP e localização aproximada</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Como Usamos suas Informações</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar confirmações</li>
              <li>Enviar comunicações técnicas e atualizações</li>
              <li>Responder às suas solicitações e fornecer suporte</li>
              <li>Personalizar sua experiência</li>
              <li>Detectar e prevenir fraudes e abusos</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
              exceto nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Com seu consentimento explícito</li>
              <li>Com prestadores de serviços que nos ajudam a operar a plataforma</li>
              <li>Para cumprir obrigações legais ou responder a processos judiciais</li>
              <li>Para proteger nossos direitos, propriedade ou segurança</li>
              <li>Em caso de fusão, aquisição ou venda de ativos</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Segurança dos Dados</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Implementamos medidas de segurança técnicas, administrativas e físicas 
              apropriadas para proteger suas informações pessoais contra acesso não autorizado, 
              alteração, divulgação ou destruição.
            </p>
            <p>
              Isso inclui criptografia de dados, controles de acesso, monitoramento de segurança 
              e treinamento regular de nossa equipe sobre práticas de segurança.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Seus Direitos</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p>
              Para exercer esses direitos, entre em contato conosco através do email: 
              <span className="font-medium">privacy@crazycode.com</span>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
              analisar o uso de nossos serviços e personalizar conteúdo.
            </p>
            <p>
              Você pode controlar ou desativar cookies através das configurações do seu navegador, 
              mas isso pode afetar algumas funcionalidades da plataforma.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Retenção de Dados</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir 
              os propósitos descritos nesta política, atender a requisitos legais ou resolver disputas.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Alterações nesta Política</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. 
              Notificaremos você sobre mudanças significativas através de nossa plataforma 
              ou por email.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Contato</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
              tratamos seus dados pessoais, entre em contato conosco:
            </p>
            <ul className="list-none space-y-2">
              <li><strong>Email:</strong> privacy@crazycode.com</li>
              <li><strong>Endereço:</strong> [Endereço da empresa]</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}