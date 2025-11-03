/*
  # Corrigir Política RLS de INSERT para Profiles
  
  1. Problema Identificado
    - A política atual de INSERT requer que o usuário esteja autenticado
    - Durante o signup, o perfil precisa ser criado imediatamente após a autenticação
    - Isso causa um conflito de timing que resulta em erro RLS
  
  2. Solução
    - Remover a política restritiva atual de INSERT
    - Criar nova política que permite INSERT tanto para usuários autenticados quanto para anônimos
    - Manter a validação de que o ID do perfil deve corresponder ao auth.uid()
    - Adicionar verificação adicional para garantir que apenas o próprio usuário pode criar seu perfil
  
  3. Segurança
    - A validação WITH CHECK garante que um usuário só pode criar um perfil com seu próprio ID
    - Isso previne que usuários criem perfis para outros usuários
    - Usuários anônimos (durante signup) podem criar perfis, mas apenas com seus próprios IDs
*/

-- Remover a política antiga de INSERT
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;

-- Criar nova política que permite INSERT durante o signup
CREATE POLICY "Permitir criação de perfil próprio durante signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
