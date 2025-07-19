#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎨 Whitelabel Configuration Setup');
console.log('================================\n');

const questions = [
  {
    key: 'NEXT_PUBLIC_BRAND_NAME',
    question: 'Nome da sua marca: ',
    default: 'Minha Marca'
  },
  {
    key: 'NEXT_PUBLIC_BRAND_TAGLINE', 
    question: 'Slogan principal: ',
    default: 'Construa algo incrível com Minha Marca'
  },
  {
    key: 'NEXT_PUBLIC_BRAND_DESCRIPTION',
    question: 'Descrição da aplicação: ', 
    default: 'Crie aplicações e websites conversando com IA'
  },
  {
    key: 'NEXT_PUBLIC_PRIMARY_COLOR',
    question: 'Cor primária (hex): ',
    default: '#a48fff'
  },
  {
    key: 'NEXT_PUBLIC_LOGO_MAIN',
    question: 'Caminho do logo principal: ',
    default: '/logo.svg'
  },
  {
    key: 'NEXT_PUBLIC_LOGO_ALT',
    question: 'Texto alternativo do logo: ',
    default: 'Logo da Marca'
  },
  {
    key: 'NEXT_PUBLIC_META_TITLE',
    question: 'Título da página: ',
    default: 'Gerador de Código IA'
  },
  {
    key: 'NEXT_PUBLIC_META_DESCRIPTION',
    question: 'Descrição meta: ',
    default: 'Gere código e aplicações usando IA'
  },
  {
    key: 'NEXT_PUBLIC_CONTACT_EMAIL',
    question: 'Email de contato (opcional): ',
    default: ''
  },
  {
    key: 'NEXT_PUBLIC_CONTACT_WEBSITE', 
    question: 'Website principal (opcional): ',
    default: ''
  }
];

async function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question}(${defaultValue}) ` : question;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function main() {
  const config = {};
  
  console.log('Responda as perguntas abaixo (pressione Enter para usar o valor padrão):\n');
  
  for (const { key, question, default: defaultValue } of questions) {
    const answer = await askQuestion(question, defaultValue);
    if (answer) {
      config[key] = answer;
    }
  }
  
  console.log('\n🔧 Escolha o formato de configuração:');
  console.log('1. Arquivo .env.local (recomendado)');
  console.log('2. Arquivo JSON (whitelabel.config.json)');
  console.log('3. Ambos');
  
  const formatChoice = await askQuestion('\nEscolha (1-3): ', '1');
  
  // Gerar arquivo .env.local
  if (formatChoice === '1' || formatChoice === '3') {
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Arquivo .env.local criado com sucesso!`);
  }
  
  // Gerar arquivo JSON
  if (formatChoice === '2' || formatChoice === '3') {
    const jsonConfig = {
      brand: {
        name: config.NEXT_PUBLIC_BRAND_NAME,
        tagline: config.NEXT_PUBLIC_BRAND_TAGLINE,
        description: config.NEXT_PUBLIC_BRAND_DESCRIPTION
      },
      colors: {
        primary: config.NEXT_PUBLIC_PRIMARY_COLOR
      },
      logos: {
        main: config.NEXT_PUBLIC_LOGO_MAIN,
        alt: config.NEXT_PUBLIC_LOGO_ALT
      },
      meta: {
        title: config.NEXT_PUBLIC_META_TITLE,
        description: config.NEXT_PUBLIC_META_DESCRIPTION
      },
      contact: {
        email: config.NEXT_PUBLIC_CONTACT_EMAIL || undefined,
        website: config.NEXT_PUBLIC_CONTACT_WEBSITE || undefined
      }
    };
    
    // Remove valores undefined
    Object.keys(jsonConfig).forEach(key => {
      if (typeof jsonConfig[key] === 'object') {
        Object.keys(jsonConfig[key]).forEach(subKey => {
          if (jsonConfig[key][subKey] === undefined) {
            delete jsonConfig[key][subKey];
          }
        });
      }
    });
    
    const jsonPath = path.join(process.cwd(), 'whitelabel.config.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonConfig, null, 2));
    console.log(`\n✅ Arquivo whitelabel.config.json criado com sucesso!`);
  }
  
  console.log('\n🎉 Configuração whitelabel criada com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Substitua o logo em /public/logo.svg pelo seu logo');
  console.log('2. Substitua o favicon em /public/favicon.ico');
  console.log('3. Execute npm run dev para ver as mudanças');
  console.log('\n📖 Veja WHITELABEL.md para documentação completa');
  
  rl.close();
}

main().catch(console.error);