-- Migration: Système de notifications basé sur les rôles
-- Date: 2025-12-17

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- L'utilisateur qui a fait l'action
  type VARCHAR(50) NOT NULL, -- 'document_created', 'document_signed', 'user_action', etc.
  title TEXT NOT NULL,
  message TEXT,
  data JSONB, -- Données additionnelles
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les admins et super_admins voient TOUTES les notifications
CREATE POLICY "Admins see all notifications"
  ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_level IN ('admin', 'super_admin')
    )
  );

-- Policy: Les secrétaires voient uniquement LEURS notifications
CREATE POLICY "Secretaries see only their notifications"
  ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_level = 'secretary'
    )
  );

-- Policy: Tous les utilisateurs authentifiés peuvent créer des notifications
CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Les utilisateurs peuvent marquer leurs propres notifications comme lues
-- Et les admins peuvent marquer toutes les notifications comme lues
CREATE POLICY "Users can update their notifications"
  ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_level IN ('admin', 'super_admin')
    )
  );

-- Policy: Les admins peuvent supprimer toutes les notifications
-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete notifications"
  ON notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_level IN ('admin', 'super_admin')
    )
  );

-- Fonction pour créer des notifications pour les admins quand une action est effectuée
CREATE OR REPLACE FUNCTION notify_admins(
  p_actor_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Créer une notification pour chaque admin et super_admin
  INSERT INTO notifications (user_id, actor_id, type, title, message, data)
  SELECT 
    u.id,
    p_actor_id,
    p_type,
    p_title,
    p_message,
    p_data
  FROM users u
  WHERE u.role_level IN ('admin', 'super_admin');
  
  -- Créer aussi une notification pour l'acteur lui-même
  INSERT INTO notifications (user_id, actor_id, type, title, message, data)
  VALUES (p_actor_id, p_actor_id, p_type, p_title, p_message, p_data);
END;
$$;

-- Trigger pour notifier les admins lors de la création d'un document DocEase
CREATE OR REPLACE FUNCTION trigger_notify_document_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Récupérer le nom de l'utilisateur
  SELECT name INTO v_user_name FROM users WHERE email = NEW.user_email;
  
  -- Notifier les admins et l'utilisateur
  PERFORM notify_admins(
    (SELECT id FROM users WHERE email = NEW.user_email),
    'document_created',
    'Nouveau document généré',
    v_user_name || ' a généré un document ' || NEW.document_type,
    jsonb_build_object(
      'document_id', NEW.id,
      'document_type', NEW.document_type,
      'title', NEW.title
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_document_created ON docease_documents;
CREATE TRIGGER notify_on_document_created
  AFTER INSERT ON docease_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_document_created();

-- Trigger pour notifier les admins lors d'une signature
CREATE OR REPLACE FUNCTION trigger_notify_signature_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Récupérer le nom de l'utilisateur
  SELECT name INTO v_user_name FROM users WHERE email = NEW.user_email;
  
  -- Notifier les admins et l'utilisateur
  PERFORM notify_admins(
    (SELECT id FROM users WHERE email = NEW.user_email),
    'signature_created',
    'Nouvelle signature',
    v_user_name || ' a signé un document',
    jsonb_build_object(
      'signature_id', NEW.id,
      'document_name', NEW.document_name
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_signature_created ON signatures;
CREATE TRIGGER notify_on_signature_created
  AFTER INSERT ON signatures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_signature_created();

-- Activer Realtime pour les notifications et docease_documents
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE docease_documents;

COMMENT ON TABLE notifications IS 'Notifications pour les utilisateurs, filtrées par rôle';
COMMENT ON FUNCTION notify_admins IS 'Crée des notifications pour tous les admins et l\'acteur';
