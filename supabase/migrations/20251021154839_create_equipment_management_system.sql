/*
  # Sistema de Gestão de Equipamentos Audiovisuais

  1. Tabelas Criadas
    - `profiles`
      - `id` (uuid, primary key, referencia auth.users)
      - `email` (text, único)
      - `full_name` (text)
      - `team` (text, com check constraint para "Academia PX" ou "Design e Criação")
      - `whatsapp` (text)
      - `photo_url` (text, URL da foto do usuário)
      - `created_at` (timestamptz)
    
    - `equipment`
      - `id` (uuid, primary key)
      - `name` (text, nome do equipamento)
      - `description` (text)
      - `photo_url_1` (text, primeira foto obrigatória)
      - `photo_url_2` (text, segunda foto obrigatória)
      - `photo_url_3` (text, terceira foto obrigatória)
      - `photo_url_4` (text, quarta foto obrigatória)
      - `status` (text, valores: "disponível", "reservado", "em uso")
      - `created_at` (timestamptz)
      - `created_by` (uuid, referencia profiles)
    
    - `kits`
      - `id` (uuid, primary key)
      - `name` (text, nome do kit ex: "Kit Copa Truck")
      - `description` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, referencia profiles)
    
    - `kit_equipment`
      - `id` (uuid, primary key)
      - `kit_id` (uuid, referencia kits)
      - `equipment_id` (uuid, referencia equipment)
      - Tabela de relacionamento many-to-many entre kits e equipamentos
    
    - `reservations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referencia profiles)
      - `equipment_id` (uuid, referencia equipment, nullable)
      - `kit_id` (uuid, referencia kits, nullable)
      - `start_date` (date)
      - `end_date` (date)
      - `reason` (text, motivo do uso)
      - `status` (text, valores: "agendado", "em uso", "concluído", "cancelado")
      - `pickup_photos` (text[], array de URLs das fotos de retirada)
      - `return_photos` (text[], array de URLs das fotos de devolução)
      - `created_at` (timestamptz)
    
    - `purchase_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referencia profiles)
      - `equipment_name` (text)
      - `reason` (text, motivo da solicitação)
      - `reference_link_1` (text)
      - `reference_link_2` (text)
      - `reference_link_3` (text)
      - `status` (text, valores: "pendente", "aprovado", "rejeitado")
      - `created_at` (timestamptz)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para cada operação (SELECT, INSERT, UPDATE, DELETE)
    - Usuários autenticados podem gerenciar seus próprios dados
    - Todos podem visualizar equipamentos e kits disponíveis
    - Apenas o dono pode editar/deletar seus registros

  3. Índices
    - Índices criados para melhorar performance de queries frequentes
    - Índices em chaves estrangeiras e campos de busca

  4. Constraints
    - Check constraints para validar valores de campos específicos
    - Foreign keys para manter integridade referencial
    - Validações de datas para garantir que end_date >= start_date
*/

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  team text NOT NULL CHECK (team IN ('Academia PX', 'Design e Criação')),
  whatsapp text NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  photo_url_1 text NOT NULL,
  photo_url_2 text NOT NULL,
  photo_url_3 text NOT NULL,
  photo_url_4 text NOT NULL,
  status text NOT NULL DEFAULT 'disponível' CHECK (status IN ('disponível', 'reservado', 'em uso')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Criar tabela de kits
CREATE TABLE IF NOT EXISTS kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Criar tabela de relacionamento kit-equipamento
CREATE TABLE IF NOT EXISTS kit_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  UNIQUE(kit_id, equipment_id)
);

-- Criar tabela de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  kit_id uuid REFERENCES kits(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em uso', 'concluído', 'cancelado')),
  pickup_photos text[] DEFAULT '{}',
  return_photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK ((equipment_id IS NOT NULL AND kit_id IS NULL) OR (equipment_id IS NULL AND kit_id IS NOT NULL))
);

-- Criar tabela de solicitações de compra
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  reason text NOT NULL,
  reference_link_1 text NOT NULL,
  reference_link_2 text NOT NULL,
  reference_link_3 text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON equipment(created_by);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_kit_equipment_kit_id ON kit_equipment(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_equipment_equipment_id ON kit_equipment(equipment_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para equipment
CREATE POLICY "Todos podem ver equipamentos"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar equipamentos"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem atualizar seus equipamentos"
  ON equipment FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem deletar seus equipamentos"
  ON equipment FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Políticas para kits
CREATE POLICY "Todos podem ver kits"
  ON kits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar kits"
  ON kits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem atualizar seus kits"
  ON kits FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem deletar seus kits"
  ON kits FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Políticas para kit_equipment
CREATE POLICY "Todos podem ver relacionamentos kit-equipamento"
  ON kit_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Criadores de kits podem adicionar equipamentos"
  ON kit_equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kits
      WHERE kits.id = kit_id
      AND kits.created_by = auth.uid()
    )
  );

CREATE POLICY "Criadores de kits podem remover equipamentos"
  ON kit_equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kits
      WHERE kits.id = kit_id
      AND kits.created_by = auth.uid()
    )
  );

-- Políticas para reservations
CREATE POLICY "Usuários podem ver suas reservas"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar reservas"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas reservas"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas reservas"
  ON reservations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para purchase_requests
CREATE POLICY "Usuários podem ver suas solicitações"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar solicitações"
  ON purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas solicitações"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas solicitações"
  ON purchase_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
