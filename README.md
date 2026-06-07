# BiblioFlix — Frontend

Interface web da biblioteca digital BiblioFlix: catálogo de livros, empréstimos
com QR Code, leitura de código de barras pela câmera e painel administrativo.

A aplicação é um cliente Next.js que consome exclusivamente o
[API Gateway](../biblioflix-backend) do backend. Toda a persistência,
autenticação e regra de negócio ficam nos microsserviços; o frontend apenas
apresenta os dados e envia as ações do usuário ao gateway.

## Sumário

- [Perfis de acesso](#perfis-de-acesso)
- [Recursos](#recursos)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Execução local](#execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy na Vercel](#deploy-na-vercel)
- [Problemas comuns](#problemas-comuns)

## Perfis de acesso

| Perfil          | Permissões                                                                   |
| --------------- | ---------------------------------------------------------------------------- |
| Visitante       | Navega pelo catálogo e pela página inicial.                                  |
| Leitor          | Cria a própria conta, faz login, realiza empréstimos (com QR Code) e acompanha as devoluções. |
| Bibliotecário   | Tudo do leitor, além de cadastrar, editar e excluir livros e registrar devoluções. |
| Administrador   | Tudo do bibliotecário, além de criar e excluir usuários, incluindo outros administradores. |

## Recursos

- **Leitura pela câmera** (Painel Admin → Escanear): lê o código de barras (ISBN)
  ou o QR do livro para registrar empréstimo, devolução ou cadastro. Ao cadastrar
  por ISBN, os dados podem ser preenchidos automaticamente via Open Library. O
  acesso à câmera exige HTTPS, disponível no site publicado e em `localhost`, mas
  não em endereços `http://` por IP de rede.
- **Etiquetas QR**: geração de um QR por livro, para impressão e fixação no
  exemplar.
- **Upload de capa**: ao cadastrar ou editar um livro, é possível enviar uma
  imagem — redimensionada no próprio navegador — ou informar uma URL.
- **Categorias editáveis** (Painel Admin → Categorias): criação, renomeação (com
  ajuste automático dos livros vinculados) e exclusão.
- **Gestão de empréstimos** (Painel Admin → Gerenciar Empréstimos): registro de
  devoluções e acompanhamento do acervo.

## Tecnologias

- **Next.js 16** e **React 19**.
- **TypeScript**.
- **Tailwind CSS 4** com componentes baseados em **Radix UI**.
- **lucide-react** (ícones), **recharts** (gráficos dos relatórios) e
  **sonner** (notificações).
- **@zxing/browser** para leitura de código de barras e **qrcode.react** para
  geração de QR.

## Estrutura do projeto

```
app/          rotas e páginas (home, catálogo, empréstimos, painel admin)
components/   componentes de UI e de domínio (modal de livro, carrossel, scanner)
contexts/     estado da aplicação e integração com o API Gateway
hooks/        hooks reutilizáveis
lib/          tipos, utilitários e camada de dados
public/       ativos estáticos
```

## Pré-requisitos

- **Node.js 20.9 ou superior** (verifique com `node -v`).
- O **backend em execução** e acessível. Para subir os microsserviços
  localmente, consulte o README do repositório `biblioflix-backend`.

## Execução local

```bash
npm install
cp .env.example .env.local     # defina NEXT_PUBLIC_API_URL
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

Com o backend rodando via Docker Compose, o gateway responde em
`http://localhost:8080` — valor já sugerido no `.env.example`. Faça login com as
credenciais de administrador definidas no seed do backend.

Scripts disponíveis:

| Script          | Descrição                          |
| --------------- | ---------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento.       |
| `npm run build` | Build de produção.                 |
| `npm run start` | Serve o build de produção.         |
| `npm run lint`  | Análise estática com ESLint.       |

## Variáveis de ambiente

| Variável              | Descrição                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL pública do API Gateway. Local: `http://localhost:8080`. Em produção, a URL do gateway publicado. |

Por ser `NEXT_PUBLIC_*`, essa variável é embutida no bundle do cliente e não deve
conter segredos.

## Deploy na Vercel

1. Importe o repositório do GitHub na Vercel.
2. Em **Settings → Environment Variables**, defina `NEXT_PUBLIC_API_URL` com a
   URL do gateway em produção.
3. Faça o deploy. A cada alteração dessa variável, refaça o deploy para que o
   novo valor seja incorporado ao bundle.

No gateway, lembre-se de incluir a URL da Vercel em `FRONTEND_ORIGIN` para
liberar o CORS.

## Problemas comuns

- **Nenhum dado carrega ou erros de rede no console.** Verifique se o backend
  está no ar e se `NEXT_PUBLIC_API_URL` aponta para o gateway correto.
- **A câmera não abre na tela Escanear.** O navegador só libera a câmera em HTTPS
  ou em `localhost`. Acessos por IP de rede em `http://` são bloqueados.
- **Bloqueio de CORS.** Confirme que `FRONTEND_ORIGIN`, no gateway, corresponde
  exatamente à origem em que o frontend está sendo servido.
- **Alteração de variável não surtiu efeito em produção.** Variáveis
  `NEXT_PUBLIC_*` são fixadas no build; é necessário refazer o deploy.
