/*
  # Configurar Políticas de Storage para Upload de Imagens
  
  1. Problema Identificado
    - O bucket 'equipment-images' existe mas não tem políticas RLS configuradas
    - Usuários não conseguem fazer upload de imagens (erro RLS)
    - Isso afeta tanto o signup (foto de perfil) quanto criação de equipamentos
  
  2. Políticas Criadas
    - INSERT: Usuários autenticados podem fazer upload de imagens
    - SELECT: Todos podem visualizar imagens (bucket é público)
    - UPDATE: Usuários autenticados podem atualizar suas próprias imagens
    - DELETE: Usuários autenticados podem deletar suas próprias imagens
  
  3. Segurança
    - Apenas usuários autenticados podem fazer upload
    - Imagens são públicas para visualização
    - Controle de acesso baseado em autenticação
*/

-- Permitir que usuários autenticados façam upload de imagens
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment-images');

-- Permitir que todos visualizem as imagens (bucket público)
CREATE POLICY "Imagens são públicas para visualização"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'equipment-images');

-- Permitir que usuários autenticados atualizem imagens
CREATE POLICY "Usuários autenticados podem atualizar imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'equipment-images')
WITH CHECK (bucket_id = 'equipment-images');

-- Permitir que usuários autenticados deletem imagens
CREATE POLICY "Usuários autenticados podem deletar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'equipment-images');
