-- In-app messages between buyers and sellers. Run this once in the Supabase SQL editor.
--
-- One conversation per buyer per car. A premium seller answers their own
-- conversations; for a standard seller the Kampala Cars admins answer instead
-- (with_admin = true), so the seller's details stay private.
--
-- The tables are only reachable through the app's server (service role), which
-- checks who is signed in; RLS is on with no policies, so the public key sees nothing.

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(car_id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  with_admin BOOLEAN NOT NULL DEFAULT false,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  buyer_unread INTEGER NOT NULL DEFAULT 0,
  staff_unread INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (car_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC) WHERE NOT with_admin;
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON conversations(last_message_at DESC) WHERE with_admin;

CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- Each new message updates its conversation's preview and the other side's unread count.
CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations SET
    last_message = left(NEW.body, 200),
    last_message_at = NEW.created_at,
    buyer_unread = CASE WHEN NEW.sender_id = buyer_id THEN buyer_unread ELSE buyer_unread + 1 END,
    staff_unread = CASE WHEN NEW.sender_id = buyer_id THEN staff_unread + 1 ELSE staff_unread END
  WHERE conversation_id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_after_insert ON messages;
CREATE TRIGGER messages_after_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON conversations FROM anon, authenticated;
REVOKE ALL ON messages FROM anon, authenticated;
