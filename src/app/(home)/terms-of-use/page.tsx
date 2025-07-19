'use client';

import Image from 'next/image';

export default function TermsOfUsePage() {
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
        <h1 className="text-xl md:text-3xl font-bold text-center">Termos de Uso</h1>
        <p className="text-muted-foreground text-center text-sm md:text-base">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </section>

      <div className="prose prose-gray dark:prose-invert max-w-none mt-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Ao acessar e usar a plataforma Crazy Code, você concorda em ficar vinculado a estes 
              Termos de Uso e a todas as leis e regulamentos aplicáveis. Se você não concordar 
              com algum destes termos, está proibido de usar ou acessar esta plataforma.
            </p>
            <p>
              Estes termos constituem um acordo legal entre você e a Crazy Code. 
              Ao usar nossos serviços, você confirma que leu, compreendeu e concorda 
              com estes termos em sua totalidade.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              A Crazy Code é uma plataforma de desenvolvimento de software que oferece:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ferramentas de desenvolvimento e programação</li>
              <li>Ambiente de colaboração em projetos</li>
              <li>Recursos de aprendizado e documentação</li>
              <li>Integração com outras ferramentas de desenvolvimento</li>
              <li>Serviços de hospedagem e deploy</li>
            </ul>
            <p>
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer 
              aspecto do serviço a qualquer momento, com ou sem aviso prévio.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Registro e Conta de Usuário</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Para usar certos recursos da plataforma, você deve criar uma conta fornecendo 
              informações precisas, atuais e completas. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades que ocorrem em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Manter suas informações de conta atualizadas</li>
            </ul>
            <p>
              Você deve ter pelo menos 18 anos de idade para criar uma conta ou usar 
              nossos serviços sob supervisão de um responsável legal.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Uso Aceitável</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes termos. 
              É expressamente proibido:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
              <li>Transmitir material prejudicial, ameaçador, abusivo ou difamatório</li>
              <li>Interferir ou interromper os serviços ou servidores</li>
              <li>Tentar ganhar acesso não autorizado a qualquer parte da plataforma</li>
              <li>Usar a plataforma para distribuir spam ou malware</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Criar contas falsas ou se passar por outra pessoa</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Propriedade Intelectual</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              A plataforma Crazy Code e todo seu conteúdo, recursos e funcionalidades são 
              propriedade da Crazy Code e são protegidos por leis de direitos autorais, 
              marcas registradas e outras leis de propriedade intelectual.
            </p>
            <p>
              Você mantém a propriedade de qualquer código, projeto ou conteúdo que criar 
              ou enviar para a plataforma. Ao usar nossos serviços, você nos concede uma 
              licença limitada para hospedar, exibir e processar seu conteúdo conforme 
              necessário para fornecer os serviços.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Privacidade e Proteção de Dados</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Sua privacidade é importante para nós. O tratamento de seus dados pessoais 
              está descrito em nossa Política de Privacidade, que faz parte integrante 
              destes termos.
            </p>
            <p>
              Ao usar nossos serviços, você consente com a coleta, uso e compartilhamento 
              de suas informações conforme descrito na Política de Privacidade.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Pagamentos e Assinaturas</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Alguns recursos da plataforma podem exigir pagamento. Ao adquirir uma assinatura:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você autoriza cobranças recorrentes conforme o plano escolhido</li>
              <li>Os preços estão sujeitos a alterações com aviso prévio</li>
              <li>Reembolsos são processados conforme nossa política de reembolso</li>
              <li>Você pode cancelar sua assinatura a qualquer momento</li>
            </ul>
            <p>
              Todas as transações são processadas de forma segura através de provedores 
              de pagamento terceirizados confiáveis.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Em nenhuma circunstância a Crazy Code será responsável por quaisquer danos 
              diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, 
              incluindo, mas não limitado a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Perda de dados ou código</li>
              <li>Interrupção de negócios</li>
              <li>Perda de lucros ou receita</li>
              <li>Custo de serviços substitutos</li>
            </ul>
            <p>
              Nossos serviços são fornecidos "como estão" e "conforme disponíveis" 
              sem garantias de qualquer tipo.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Suspensão e Rescisão</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Reservamo-nos o direito de suspender ou encerrar sua conta e acesso aos 
              serviços, a nosso exclusivo critério, por qualquer motivo, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violação destes Termos de Uso</li>
              <li>Uso fraudulento ou abusivo da plataforma</li>
              <li>Não pagamento de taxas devidas</li>
              <li>Inatividade prolongada da conta</li>
            </ul>
            <p>
              Você pode encerrar sua conta a qualquer momento entrando em contato conosco 
              ou através das configurações da conta.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Modificações dos Termos</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. Quando fizermos alterações, 
              atualizaremos a data de "última atualização" no topo desta página e 
              notificaremos você através da plataforma ou por email.
            </p>
            <p>
              Seu uso continuado da plataforma após a publicação das alterações 
              constitui sua aceitação dos novos termos.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Lei Aplicável</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, 
              sem consideração aos conflitos de disposições legais.
            </p>
            <p>
              Qualquer disputa decorrente ou relacionada a estes termos será resolvida 
              exclusivamente nos tribunais competentes do Brasil.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Contato</h2>
          <div className="space-y-4 text-sm md:text-base">
            <p>
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <ul className="list-none space-y-2">
              <li><strong>Email:</strong> legal@crazycode.com</li>
              <li><strong>Endereço:</strong> [Endereço da empresa]</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}