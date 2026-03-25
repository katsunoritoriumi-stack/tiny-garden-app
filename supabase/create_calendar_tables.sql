-- ============================================================
-- TINY GARDEN カレンダー機能用テーブル
-- Supabase SQL Editor でこのファイルの内容を実行してください
-- ============================================================

-- ① 宿泊記録テーブル
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date  DATE        NOT NULL,           -- 宿泊日（チェックイン日）
  area_id       TEXT        NOT NULL,           -- エリアID (例: comfort, lodge)
  room_id       TEXT        NOT NULL,           -- 部屋ID (例: E08, 201)
  room_name     TEXT,                           -- 部屋名（表示用）
  check_in_at   TIMESTAMPTZ,                    -- チェックイン日時
  check_out_at  TIMESTAMPTZ,                    -- チェックアウト日時
  num_adults    INTEGER     NOT NULL DEFAULT 0, -- 大人人数
  num_children  INTEGER     NOT NULL DEFAULT 0, -- 子供人数
  notes         TEXT,                           -- メモ・備考
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ② 設備利用記録テーブル
CREATE TABLE IF NOT EXISTS facility_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date   DATE        NOT NULL,           -- 利用日
  facility_name  TEXT        NOT NULL,           -- 設備名 (例: 女湯, 男湯, キャビンサウナ)
  area_id        TEXT,                           -- 関連エリアID
  status         TEXT        NOT NULL DEFAULT 'unused'
                             CHECK (status IN ('used', 'unused', 'maintenance')),
  used_at        TIMESTAMPTZ,                    -- 利用開始日時
  notes          TEXT,                           -- 備考
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス（日付検索の高速化）
CREATE INDEX IF NOT EXISTS bookings_session_date_idx
  ON bookings (session_date);

CREATE INDEX IF NOT EXISTS facility_logs_session_date_idx
  ON facility_logs (session_date);

-- Row Level Security（匿名クライアントからの読み書きを許可）
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_all_bookings" ON bookings;
CREATE POLICY "public_all_bookings" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_facility_logs" ON facility_logs;
CREATE POLICY "public_all_facility_logs" ON facility_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 確認クエリ（実行後にテーブル一覧を確認）
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('bookings', 'facility_logs', 'task_states', 'room_states')
ORDER BY table_name;
