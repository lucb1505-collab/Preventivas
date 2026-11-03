# Operação Nemak — Gestão de Preventivas

Aplicação React em português, baseada no componente fornecido, para acompanhar os 35 equipamentos da operação. Inclui atualização de horímetros, ciclos de manutenção de 250 horas, alertas a 50 horas do vencimento, registro de preventivas, histórico, importação de leituras e exportação/restauração de backups JSON.

Os dados são compartilhados e persistidos no Netlify Database por uma função em `/api/state`. A revisão de cada gravação impede que uma sessão sobrescreva silenciosamente alterações de outra. O painel tem acesso público, como o componente original; todos os visitantes acessam a mesma operação.

Instale com `npm install`. Use `netlify dev --port 8889` para desenvolver com as funções da plataforma. `npm run check` verifica os arquivos TypeScript. A configuração de deploy está em `netlify.toml`.

O esquema está em `db/schema.ts`; as migrações em `netlify/database/migrations` são aplicadas pela plataforma durante o deploy. A primeira leitura inicializa os equipamentos com as leituras fornecidas, sem histórico de manutenção inventado.
