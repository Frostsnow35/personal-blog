-- =============================================================
-- Supabase 安全修复：为 public 模式所有表启用 Row-Level Security
--
-- 告警原文（Security Advisor / Database Linter）：
--   "Table publicly accessible — Anyone with your project URL can
--    read, edit, and delete all data in this table because
--    Row-Level Security is not enabled."
--
-- 成因：public 模式下的表未启用 RLS 时，持有项目 URL + anon key
-- 的任何人都可以通过 PostgREST（REST 接口）对表内数据做任意增删改查。
--
-- 本项目数据访问全部经由 Flask 后端以表属主（postgres）经
-- Supabase Transaction Pooler 直连完成，前端不使用 supabase-js /
-- PostgREST。因此采用"默认拒绝"方案：
--   * 启用 RLS、不为 anon/authenticated 创建任何策略
--     -> PostgREST 侧读写删全部被拒（SELECT 返回空集，写入报 42501）
--   * 应用自身以表属主身份直连，表属主默认绕过 RLS
--     （本脚本刻意不加 FORCE ROW LEVEL SECURITY）
--     -> 线上服务读写零影响
--
-- 用法：Supabase Dashboard -> SQL Editor -> 整段执行。
-- 脚本幂等，可重复运行；只补开缺失的 RLS，不改动已有策略与数据。
-- =============================================================

-- 1) 为 public 下所有尚未启用 RLS 的普通表启用 RLS
--    （动态遍历，覆盖 models 建出的全部表及历史遗留表）
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.relname AS tbl
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND NOT c.relrowsecurity
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tbl) || ' ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS enabled on public.%', r.tbl;
    END LOOP;
END $$;

-- 2)（可选加固）收回 anon / authenticated 的表权限，
--    让 PostgREST 连表结构都不可见。默认注释不执行；
--    RLS 默认拒绝已足够消除告警，此项只在需要额外收紧时打开。
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
-- REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3) 验证 A：必须返回 0 行（不存在未开 RLS 的表）
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity;

-- 4) 验证 B：查看 public 全部表的 RLS 状态（rowsecurity 应全为 true）
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;
