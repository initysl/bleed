-- AUTHORITATIVE SCHEMA BASELINE — generated, do not hand-edit.
--
-- Produced with:
--   pg_dump "$DATABASE_URL" --schema-only --schema=public \
--     --no-owner --no-privileges --no-comments -f supabase/000_baseline.sql
--
-- This is the real shape of the production database, dumped after migrations
-- 005-007 were applied. It supersedes schema.sql, which predates the ownership
-- model and describes tables with no user_id and no row-level security.
--
-- It exists because migrations 001 and 002 were never committed: every user_id
-- column, the profiles table, the signup trigger and every RLS policy lived
-- only in the live database, so nothing in the repo could be reviewed against
-- what was actually running. Regenerate this file after any future migration.
--
-- To recreate the database from scratch, apply THIS file, not schema.sql.

--
-- PostgreSQL database dump
--

\restrict Pg1vd6S27Tfwc0uzbH5VfsxA6dnC4ayTNkScthnWSO2y6WiiXC2Ylj8OfURakod

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  slug text;
begin
  slug := 'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  insert into public.profiles (id, email, inbound_address)
  values (new.id, new.email, slug);
  return new;
end;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: needs_review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.needs_review (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text,
    raw_email_snippet text,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved boolean DEFAULT false NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    inbound_address text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email_notifications_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: reminder_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_at timestamp with time zone NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    billing_cycle text NOT NULL,
    monthly_equivalent numeric(10,2) GENERATED ALWAYS AS (
CASE
    WHEN (billing_cycle = 'yearly'::text) THEN (price / (12)::numeric)
    ELSE price
END) STORED,
    renewal_date date NOT NULL,
    category text,
    last_used_at date,
    source text DEFAULT 'manual'::text NOT NULL,
    raw_email_snippet text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_at timestamp with time zone NOT NULL,
    notify_email boolean DEFAULT true NOT NULL,
    notify_push boolean DEFAULT true NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_anchor_date date NOT NULL,
    cycles_elapsed integer DEFAULT 0 NOT NULL,
    source_email_id text,
    CONSTRAINT at_least_one_channel CHECK ((notify_email OR notify_push)),
    CONSTRAINT currency_is_iso_format CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))),
    CONSTRAINT subscriptions_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'email'::text])))
);


--
-- Name: needs_review needs_review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.needs_review
    ADD CONSTRAINT needs_review_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_inbound_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_inbound_address_key UNIQUE (inbound_address);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: reminder_log reminder_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_pkey PRIMARY KEY (id);


--
-- Name: reminder_log reminder_log_subscription_id_reminder_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_subscription_id_reminder_at_key UNIQUE (subscription_id, reminder_at);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: idx_needs_review_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_needs_review_user_id ON public.needs_review USING btree (user_id);


--
-- Name: idx_push_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_subscriptions_reminder_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_reminder_at ON public.subscriptions USING btree (reminder_at);


--
-- Name: idx_subscriptions_renewal_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_renewal_date ON public.subscriptions USING btree (renewal_date);


--
-- Name: idx_subscriptions_source_email_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_subscriptions_source_email_id ON public.subscriptions USING btree (source_email_id) WHERE (source_email_id IS NOT NULL);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: subscriptions trg_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: needs_review needs_review_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.needs_review
    ADD CONSTRAINT needs_review_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reminder_log reminder_log_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_log
    ADD CONSTRAINT reminder_log_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: needs_review Users manage their own needs_review items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own needs_review items" ON public.needs_review USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users manage their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own push subscriptions" ON public.push_subscriptions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users manage their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own subscriptions" ON public.subscriptions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: reminder_log Users view their own reminder logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view their own reminder logs" ON public.reminder_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.subscriptions
  WHERE ((subscriptions.id = reminder_log.subscription_id) AND (subscriptions.user_id = auth.uid())))));


--
-- Name: needs_review; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.needs_review ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict Pg1vd6S27Tfwc0uzbH5VfsxA6dnC4ayTNkScthnWSO2y6WiiXC2Ylj8OfURakod

