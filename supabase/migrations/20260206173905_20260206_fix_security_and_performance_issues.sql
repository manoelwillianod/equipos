/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes on Foreign Keys
    - `kits.created_by` - missing covering index
    - `purchase_requests.user_id` - missing covering index
    - `reservations.equipment_id` - missing covering index
    - `reservations.kit_id` - missing covering index
  
  2. Optimize RLS Policies
    - Replace `auth.uid()` and `auth.jwt()` with `(select auth.uid())` and `(select auth.jwt())` to improve query performance
    - This prevents re-evaluation of the function for each row
    - Affects policies across: profiles, equipment, kits, kit_equipment, reservations, purchase_requests
  
  3. Remove Unused Indexes
    - `idx_kit_equipment_equipment_id` - not used by query planner
    - `idx_reservations_dates` - not used by query planner
  
  4. Performance Notes
    - Foreign key indexes prevent inefficient sequential scans during joins
    - RLS function caching reduces query overhead at scale
*/

-- Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_kits_created_by ON kits(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment_id ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_kit_id ON reservations(kit_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_reservations_dates;
DROP INDEX IF EXISTS idx_kit_equipment_equipment_id;

-- Drop and recreate RLS policies with optimized function calls

-- profiles table policies
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- equipment table policies
DROP POLICY IF EXISTS "Usuários autenticados podem criar equipamentos" ON equipment;
CREATE POLICY "Usuários autenticados podem criar equipamentos"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Criadores podem atualizar seus equipamentos" ON equipment;
CREATE POLICY "Criadores podem atualizar seus equipamentos"
  ON equipment FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Criadores podem deletar seus equipamentos" ON equipment;
CREATE POLICY "Criadores podem deletar seus equipamentos"
  ON equipment FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- kits table policies
DROP POLICY IF EXISTS "Usuários autenticados podem criar kits" ON kits;
CREATE POLICY "Usuários autenticados podem criar kits"
  ON kits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Criadores podem atualizar seus kits" ON kits;
CREATE POLICY "Criadores podem atualizar seus kits"
  ON kits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Criadores podem deletar seus kits" ON kits;
CREATE POLICY "Criadores podem deletar seus kits"
  ON kits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- kit_equipment table policies
DROP POLICY IF EXISTS "Criadores de kits podem adicionar equipamentos" ON kit_equipment;
CREATE POLICY "Criadores de kits podem adicionar equipamentos"
  ON kit_equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kits
      WHERE kits.id = kit_id
      AND kits.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Criadores de kits podem remover equipamentos" ON kit_equipment;
CREATE POLICY "Criadores de kits podem remover equipamentos"
  ON kit_equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kits
      WHERE kits.id = kit_id
      AND kits.created_by = (select auth.uid())
    )
  );

-- reservations table policies
DROP POLICY IF EXISTS "Usuários podem ver suas reservas" ON reservations;
CREATE POLICY "Usuários podem ver suas reservas"
  ON reservations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem criar reservas" ON reservations;
CREATE POLICY "Usuários podem criar reservas"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas reservas" ON reservations;
CREATE POLICY "Usuários podem atualizar suas reservas"
  ON reservations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas reservas" ON reservations;
CREATE POLICY "Usuários podem deletar suas reservas"
  ON reservations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- purchase_requests table policies
DROP POLICY IF EXISTS "Usuários podem ver suas solicitações" ON purchase_requests;
CREATE POLICY "Usuários podem ver suas solicitações"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem criar solicitações" ON purchase_requests;
CREATE POLICY "Usuários podem criar solicitações"
  ON purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas solicitações" ON purchase_requests;
CREATE POLICY "Usuários podem atualizar suas solicitações"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas solicitações" ON purchase_requests;
CREATE POLICY "Usuários podem deletar suas solicitações"
  ON purchase_requests FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
