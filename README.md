# Casa Check - Gerenciador de Tarefas Domésticas

Casa Check é um aplicativo PWA desenvolvido em Next.js que resolve o problema de coordenação e acompanhamento de tarefas domésticas quando você contrata alguém para limpar sua casa ou realizar serviços domésticos.

## 🏠 Funcionalidades

- **Gerenciamento de Listas**: Crie e organize listas de tarefas domésticas
- **Categorização**: Organize tarefas por tipo (Limpeza, Cozinha, Banheiro, etc.)
- **Colaboração**: Convide prestadores de serviços para acessar suas listas
- **Acessibilidade**: Text-to-speech para pessoas com dificuldades de leitura
- **Documentação Visual**: Adicione imagens e comentários às tarefas
- **Avaliações**: Sistema de rating para prestadores de serviços
- **PWA**: Funciona offline e pode ser instalado como app

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de UI
- **Supabase** - Backend e autenticação
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## ⚙️ Configuração

1. **Clone o repositório**

   ```bash
   git clone <url-do-repositorio>
   cd casa-check
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Renomeie `.env.local` e configure:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Configure o banco de dados Supabase**

   Execute os seguintes comandos SQL no Supabase:

   ```sql
   -- Tabela de usuários (estende auth.users)
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     name TEXT,
     phone TEXT,
     avatar_url TEXT,
     location TEXT,
     service_types TEXT[],
     rating DECIMAL(2,1) DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     PRIMARY KEY (id)
   );

   -- Tabela de listas de tarefas
   CREATE TABLE public.task_lists (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     is_favorite BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabela de tarefas
   CREATE TABLE public.tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     category TEXT NOT NULL,
     priority TEXT NOT NULL DEFAULT 'media',
     status TEXT NOT NULL DEFAULT 'pendente',
     assigned_to UUID REFERENCES public.profiles(id),
     images TEXT[],
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabela de colaboradores
   CREATE TABLE public.list_collaborators (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE,
     user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     role TEXT DEFAULT 'collaborator',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(list_id, user_id)
   );

   -- Tabela de comentários
   CREATE TABLE public.task_comments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
     user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tabela de avaliações
   CREATE TABLE public.ratings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     rated_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     task_list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE,
     rating INTEGER CHECK (rating >= 1 AND rating <= 5),
     comment TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(rater_id, rated_user_id, task_list_id)
   );

   -- Habilitar RLS (Row Level Security)
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

   -- Políticas de segurança básicas
   CREATE POLICY "Users can view own profile" ON public.profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON public.profiles
     FOR UPDATE USING (auth.uid() = id);
   ```

5. **Execute o projeto**

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000)

## 📱 Funcionalidades Implementadas

### ✅ Concluído

- [x] Estrutura básica do projeto Next.js
- [x] Configuração do Tailwind CSS e shadcn/ui
- [x] Página inicial com apresentação do app
- [x] Header de navegação responsivo
- [x] Página de listagem de listas de tarefas
- [x] Página de detalhes de lista com tarefas
- [x] Componente de cartão de tarefa
- [x] Dialog para adicionar novas tarefas
- [x] Página de perfil do usuário
- [x] Hook para text-to-speech
- [x] Configuração PWA básica
- [x] Tipos TypeScript definidos
- [x] Constantes para categorias e status

### 🚧 Em Desenvolvimento

- [ ] Integração completa com Supabase
- [ ] Sistema de autenticação
- [ ] Upload de imagens
- [ ] Sistema de comentários
- [ ] Convites e colaboração
- [ ] Sistema de avaliações
- [ ] Funcionalidade offline
- [ ] Notificações push

## 🎨 Design System

O projeto utiliza um design system baseado em:

- **Cores**: Paleta azul como cor primária
- **Tipografia**: Fonte Geist (sans-serif)
- **Componentes**: shadcn/ui com customizações
- **Ícones**: Lucide React
- **Layout**: Mobile-first, responsivo

## 🔧 Estrutura do Projeto

```
casa-check/
├── src/
│   ├── app/                 # App Router (Next.js 13+)
│   │   ├── listas/         # Páginas de listas
│   │   ├── perfil/         # Página de perfil
│   │   └── page.tsx        # Página inicial
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── layout/        # Componentes de layout
│   │   └── task/          # Componentes relacionados a tarefas
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários e configurações
│   └── types/             # Definições de tipos TypeScript
├── public/                # Arquivos estáticos
└── ...
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@casacheck.com
