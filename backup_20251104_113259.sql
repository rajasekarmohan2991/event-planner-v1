--
-- PostgreSQL database dump
--

\restrict fMNqe6acTiqx6J9i8oLb9T37J3sHBXvRe2Cc3Xd17ZjUWY5UkMcmaBtFllz2qqJ

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: EventStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EventStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."EventStatus" OWNER TO postgres;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'CHECKED_IN'
);


ALTER TYPE public."RegistrationStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'ORGANIZER',
    'USER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    location text,
    status public."EventStatus" DEFAULT 'DRAFT'::public."EventStatus" NOT NULL,
    "organizerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO postgres;

--
-- Name: Registration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Registration" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "eventId" text NOT NULL,
    "ticketId" text NOT NULL,
    status public."RegistrationStatus" DEFAULT 'PENDING'::public."RegistrationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Registration" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    quantity integer NOT NULL,
    "eventId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: event_attendees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_attendees (
    id bigint NOT NULL,
    answers jsonb,
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(255),
    status character varying(255) NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.event_attendees OWNER TO postgres;

--
-- Name: event_attendees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_attendees ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_attendees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: event_planning; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_planning (
    id bigint NOT NULL,
    budget_inr double precision,
    created_at timestamp(6) with time zone NOT NULL,
    expected_attendees integer,
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL,
    location_id bigint
);


ALTER TABLE public.event_planning OWNER TO postgres;

--
-- Name: event_planning_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_planning ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_planning_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: event_registration_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_registration_settings (
    id bigint NOT NULL,
    capacity integer,
    confirmation_template_id bigint,
    created_at timestamp(6) with time zone NOT NULL,
    deadline_at timestamp(6) with time zone,
    is_open boolean NOT NULL,
    require_rsvp boolean NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    waitlist_enabled boolean NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.event_registration_settings OWNER TO postgres;

--
-- Name: event_registration_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_registration_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_registration_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_rsvps (
    id bigint NOT NULL,
    answers_json text,
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(150),
    name character varying(100),
    plus_one integer,
    status character varying(16) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL,
    CONSTRAINT event_rsvps_status_check CHECK (((status)::text = ANY ((ARRAY['ACCEPTED'::character varying, 'DECLINED'::character varying, 'MAYBE'::character varying])::text[])))
);


ALTER TABLE public.event_rsvps OWNER TO postgres;

--
-- Name: event_rsvps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_rsvps ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_rsvps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: event_team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_team_members (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    event_id bigint NOT NULL,
    invited_at timestamp(6) with time zone,
    joined_at timestamp(6) with time zone,
    name character varying(255) NOT NULL,
    progress integer,
    role character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    CONSTRAINT event_team_members_status_check CHECK (((status)::text = ANY ((ARRAY['INVITED'::character varying, 'JOINED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.event_team_members OWNER TO postgres;

--
-- Name: event_team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_team_members ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_team_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    address character varying(255),
    banner_url character varying(255),
    budget_inr integer,
    category character varying(255),
    city character varying(255),
    created_at timestamp(6) with time zone NOT NULL,
    description character varying(255),
    ends_at timestamp(6) with time zone NOT NULL,
    event_mode character varying(255) NOT NULL,
    expected_attendees integer,
    latitude double precision,
    longitude double precision,
    name character varying(255) NOT NULL,
    price_inr integer,
    starts_at timestamp(6) with time zone NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    venue character varying(255),
    CONSTRAINT events_event_mode_check CHECK (((event_mode)::text = ANY ((ARRAY['IN_PERSON'::character varying, 'VIRTUAL'::character varying, 'HYBRID'::character varying])::text[]))),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'LIVE'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'TRASHED'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    address character varying(300),
    city character varying(120),
    country character varying(120),
    created_at timestamp(6) with time zone NOT NULL,
    display_name character varying(255),
    lat double precision,
    lon double precision,
    name character varying(200) NOT NULL,
    place_id character varying(255),
    state character varying(120),
    timezone character varying(64),
    updated_at timestamp(6) with time zone NOT NULL,
    venue_type character varying(64)
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.locations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: microsite_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.microsite_sections (
    id bigint NOT NULL,
    content text,
    created_at timestamp(6) with time zone NOT NULL,
    "position" integer NOT NULL,
    title character varying(255),
    type character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    visible boolean NOT NULL,
    event_id bigint NOT NULL,
    CONSTRAINT microsite_sections_type_check CHECK (((type)::text = ANY ((ARRAY['HERO'::character varying, 'ABOUT'::character varying, 'SCHEDULE'::character varying, 'SPEAKERS'::character varying, 'SPONSORS'::character varying, 'FAQ'::character varying, 'CUSTOM'::character varying])::text[])))
);


ALTER TABLE public.microsite_sections OWNER TO postgres;

--
-- Name: microsite_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.microsite_sections ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.microsite_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: microsite_themes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.microsite_themes (
    id bigint NOT NULL,
    background_color character varying(255),
    created_at timestamp(6) with time zone NOT NULL,
    font_family character varying(255),
    hero_image_url character varying(255),
    primary_color character varying(255),
    secondary_color character varying(255),
    text_color character varying(255),
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.microsite_themes OWNER TO postgres;

--
-- Name: microsite_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.microsite_themes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.microsite_themes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_settings (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    tax_rate_percent integer,
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.payment_settings OWNER TO postgres;

--
-- Name: payment_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payment_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    stripe_payment_intent_id character varying(255),
    amount_in_minor integer NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    status character varying(24) DEFAULT 'PENDING'::character varying NOT NULL,
    metadata character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_codes (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20) DEFAULT 'PERCENT'::character varying NOT NULL,
    discount_amount integer NOT NULL,
    max_uses integer DEFAULT '-1'::integer NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    max_uses_per_user integer DEFAULT 1 NOT NULL,
    min_order_amount integer DEFAULT 0 NOT NULL,
    applicable_ticket_ids character varying(255),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.promo_codes OWNER TO postgres;

--
-- Name: promo_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.promo_codes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.promo_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registration_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_approvals (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    ticket_class character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.registration_approvals OWNER TO postgres;

--
-- Name: registration_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registration_approvals ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registration_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registration_custom_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_custom_fields (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    field_key character varying(64) NOT NULL,
    label character varying(255) NOT NULL,
    logic character varying(255),
    options character varying(255),
    order_index integer NOT NULL,
    required boolean NOT NULL,
    field_type character varying(24) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    visibility character varying(24) NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.registration_custom_fields OWNER TO postgres;

--
-- Name: registration_custom_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registration_custom_fields ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registration_custom_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registration_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_settings (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    require_approval boolean DEFAULT false NOT NULL,
    auto_approve_free_registrations boolean DEFAULT true NOT NULL,
    require_approval_reason boolean DEFAULT false NOT NULL,
    send_confirmation_emails boolean DEFAULT true NOT NULL,
    send_reminder_emails boolean DEFAULT false NOT NULL,
    reminder_days_before integer DEFAULT 1 NOT NULL,
    send_approval_notifications boolean DEFAULT true NOT NULL,
    send_rejection_notifications boolean DEFAULT true NOT NULL,
    allow_data_export boolean DEFAULT true NOT NULL,
    export_includes_personal_data boolean DEFAULT false NOT NULL,
    require_export_approval boolean DEFAULT false NOT NULL,
    data_retention_days integer DEFAULT 365 NOT NULL,
    allow_waitlist boolean DEFAULT true NOT NULL,
    max_waitlist_size integer DEFAULT 100 NOT NULL,
    show_remaining_spots boolean DEFAULT true NOT NULL,
    allow_registration_editing boolean DEFAULT true NOT NULL,
    registration_deadline_enforced boolean DEFAULT false NOT NULL,
    require_captcha boolean DEFAULT false NOT NULL,
    max_registrations_per_ip integer DEFAULT 10 NOT NULL,
    registration_rate_limit_minutes integer DEFAULT 15 NOT NULL,
    webhook_url character varying(255),
    webhook_events character varying(255),
    enable_analytics_tracking boolean DEFAULT false NOT NULL,
    google_analytics_id character varying(255),
    facebook_pixel_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.registration_settings OWNER TO postgres;

--
-- Name: registration_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registration_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registration_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registrations (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    data_json text,
    event_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT registrations_type_check CHECK (((type)::text = ANY ((ARRAY['GENERAL'::character varying, 'VIP'::character varying, 'VIRTUAL'::character varying, 'SPEAKER'::character varying, 'EXHIBITOR'::character varying])::text[])))
);


ALTER TABLE public.registrations OWNER TO postgres;

--
-- Name: registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: session_speakers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_speakers (
    session_id bigint NOT NULL,
    speaker_id bigint NOT NULL
);


ALTER TABLE public.session_speakers OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    capacity integer,
    created_at timestamp(6) with time zone NOT NULL,
    description text,
    end_time timestamp(6) with time zone NOT NULL,
    room character varying(255),
    start_time timestamp(6) with time zone NOT NULL,
    title character varying(255) NOT NULL,
    track character varying(255),
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sessions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: speakers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.speakers (
    id bigint NOT NULL,
    bio text,
    created_at timestamp(6) with time zone NOT NULL,
    name character varying(255) NOT NULL,
    photo_url character varying(255),
    title character varying(255),
    updated_at timestamp(6) with time zone NOT NULL,
    event_id bigint NOT NULL
);


ALTER TABLE public.speakers OWNER TO postgres;

--
-- Name: speakers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.speakers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.speakers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sponsors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsors (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    logo_url character varying(255),
    name character varying(255) NOT NULL,
    tier character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    website character varying(255),
    event_id bigint NOT NULL,
    CONSTRAINT sponsors_tier_check CHECK (((tier)::text = ANY ((ARRAY['PLATINUM'::character varying, 'GOLD'::character varying, 'SILVER'::character varying, 'BRONZE'::character varying, 'PARTNER'::character varying])::text[])))
);


ALTER TABLE public.sponsors OWNER TO postgres;

--
-- Name: sponsors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sponsors ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sponsors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    name character varying(120) NOT NULL,
    group_id character varying(64),
    is_free boolean DEFAULT false NOT NULL,
    price_in_minor integer DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    sold integer DEFAULT 0 NOT NULL,
    requires_approval boolean DEFAULT false NOT NULL,
    status character varying(24) DEFAULT 'Open'::character varying NOT NULL,
    sales_start_at timestamp with time zone,
    sales_end_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tickets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name character varying(255),
    email character varying(255),
    email_verified timestamp(3) without time zone,
    password text,
    role character varying(255) DEFAULT 'USER'::public."UserRole" NOT NULL,
    image text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    gender character varying(255),
    password_hash character varying(255) NOT NULL,
    selected_city text,
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['MALE'::character varying, 'FEMALE'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Name: 27596; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27596');


ALTER LARGE OBJECT 27596 OWNER TO postgres;

--
-- Name: 27597; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27597');


ALTER LARGE OBJECT 27597 OWNER TO postgres;

--
-- Name: 27598; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27598');


ALTER LARGE OBJECT 27598 OWNER TO postgres;

--
-- Name: 27599; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27599');


ALTER LARGE OBJECT 27599 OWNER TO postgres;

--
-- Name: 27600; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27600');


ALTER LARGE OBJECT 27600 OWNER TO postgres;

--
-- Name: 27601; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27601');


ALTER LARGE OBJECT 27601 OWNER TO postgres;

--
-- Name: 27602; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27602');


ALTER LARGE OBJECT 27602 OWNER TO postgres;

--
-- Name: 27603; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27603');


ALTER LARGE OBJECT 27603 OWNER TO postgres;

--
-- Name: 27604; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27604');


ALTER LARGE OBJECT 27604 OWNER TO postgres;

--
-- Name: 27605; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27605');


ALTER LARGE OBJECT 27605 OWNER TO postgres;

--
-- Name: 27606; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27606');


ALTER LARGE OBJECT 27606 OWNER TO postgres;

--
-- Name: 27607; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27607');


ALTER LARGE OBJECT 27607 OWNER TO postgres;

--
-- Name: 27608; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27608');


ALTER LARGE OBJECT 27608 OWNER TO postgres;

--
-- Name: 27609; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27609');


ALTER LARGE OBJECT 27609 OWNER TO postgres;

--
-- Name: 27610; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('27610');


ALTER LARGE OBJECT 27610 OWNER TO postgres;

--
-- Name: 35801; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('35801');


ALTER LARGE OBJECT 35801 OWNER TO postgres;

--
-- Name: 35802; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('35802');


ALTER LARGE OBJECT 35802 OWNER TO postgres;

--
-- Name: 35803; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('35803');


ALTER LARGE OBJECT 35803 OWNER TO postgres;

--
-- Name: 35804; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('35804');


ALTER LARGE OBJECT 35804 OWNER TO postgres;

--
-- Name: 35805; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('35805');


ALTER LARGE OBJECT 35805 OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Event" (id, title, description, "startDate", "endDate", location, status, "organizerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Registration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Registration" (id, "userId", "eventId", "ticketId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, name, description, price, quantity, "eventId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
486c6439-6cca-458c-995a-88db5a777836	8a1efd838a031dd0c80b3c548c23bca0cbdcc2a2df3edc5d44ab8e3fd2053c90	2025-11-03 10:37:34.383736+00	20250918085015_init	\N	\N	2025-11-03 10:37:34.301209+00	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, "userId", action, metadata, ip_address, user_agent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_attendees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_attendees (id, answers, created_at, email, name, phone, status, event_id) FROM stdin;
\.


--
-- Data for Name: event_planning; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_planning (id, budget_inr, created_at, expected_attendees, updated_at, event_id, location_id) FROM stdin;
\.


--
-- Data for Name: event_registration_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_registration_settings (id, capacity, confirmation_template_id, created_at, deadline_at, is_open, require_rsvp, updated_at, waitlist_enabled, event_id) FROM stdin;
\.


--
-- Data for Name: event_rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_rsvps (id, answers_json, created_at, email, name, plus_one, status, updated_at, event_id) FROM stdin;
\.


--
-- Data for Name: event_team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_team_members (id, email, event_id, invited_at, joined_at, name, progress, role, status) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, address, banner_url, budget_inr, category, city, created_at, description, ends_at, event_mode, expected_attendees, latitude, longitude, name, price_inr, starts_at, status, updated_at, venue) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, address, city, country, created_at, display_name, lat, lon, name, place_id, state, timezone, updated_at, venue_type) FROM stdin;
\.


--
-- Data for Name: microsite_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.microsite_sections (id, content, created_at, "position", title, type, updated_at, visible, event_id) FROM stdin;
\.


--
-- Data for Name: microsite_themes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.microsite_themes (id, background_color, created_at, font_family, hero_image_url, primary_color, secondary_color, text_color, updated_at, event_id) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, email, token, expires, "createdAt") FROM stdin;
\.


--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_settings (id, created_at, tax_rate_percent, updated_at, event_id) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, event_id, ticket_id, stripe_payment_intent_id, amount_in_minor, currency, status, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_codes (id, event_id, code, discount_type, discount_amount, max_uses, used_count, max_uses_per_user, min_order_amount, applicable_ticket_ids, start_date, end_date, is_active, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: registration_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_approvals (id, event_id, name, email, ticket_class, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: registration_custom_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_custom_fields (id, created_at, field_key, label, logic, options, order_index, required, field_type, updated_at, visibility, event_id) FROM stdin;
\.


--
-- Data for Name: registration_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_settings (id, event_id, require_approval, auto_approve_free_registrations, require_approval_reason, send_confirmation_emails, send_reminder_emails, reminder_days_before, send_approval_notifications, send_rejection_notifications, allow_data_export, export_includes_personal_data, require_export_approval, data_retention_days, allow_waitlist, max_waitlist_size, show_remaining_spots, allow_registration_editing, registration_deadline_enforced, require_captcha, max_registrations_per_ip, registration_rate_limit_minutes, webhook_url, webhook_events, enable_analytics_tracking, google_analytics_id, facebook_pixel_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registrations (id, created_at, data_json, event_id, type) FROM stdin;
\.


--
-- Data for Name: session_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_speakers (session_id, speaker_id) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, capacity, created_at, description, end_time, room, start_time, title, track, updated_at, event_id) FROM stdin;
\.


--
-- Data for Name: speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.speakers (id, bio, created_at, name, photo_url, title, updated_at, event_id) FROM stdin;
\.


--
-- Data for Name: sponsors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sponsors (id, created_at, logo_url, name, tier, updated_at, website, event_id) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, event_id, name, group_id, is_free, price_in_minor, currency, quantity, sold, requires_approval, status, sales_start_at, sales_end_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified, password, role, image, created_at, updated_at, gender, password_hash, selected_city) FROM stdin;
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: event_attendees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_attendees_id_seq', 1, false);


--
-- Name: event_planning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_planning_id_seq', 1, false);


--
-- Name: event_registration_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_registration_settings_id_seq', 1, false);


--
-- Name: event_rsvps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_rsvps_id_seq', 1, false);


--
-- Name: event_team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_team_members_id_seq', 1, false);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, false);


--
-- Name: microsite_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.microsite_sections_id_seq', 1, false);


--
-- Name: microsite_themes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.microsite_themes_id_seq', 1, false);


--
-- Name: payment_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_settings_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: promo_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_codes_id_seq', 1, false);


--
-- Name: registration_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_approvals_id_seq', 1, false);


--
-- Name: registration_custom_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_custom_fields_id_seq', 1, false);


--
-- Name: registration_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_settings_id_seq', 1, false);


--
-- Name: registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registrations_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: speakers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.speakers_id_seq', 1, false);


--
-- Name: sponsors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sponsors_id_seq', 1, false);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 1, false);


--
-- Data for Name: BLOBS; Type: BLOBS; Schema: -; Owner: -
--

BEGIN;

SELECT pg_catalog.lo_open('27596', 131072);
SELECT pg_catalog.lowrite(0, '\x7b22707265666978223a224d52222c2266697273744e616d65223a22424953484f59222c226c6173744e616d65223a224e414d42494152222c2270726566657272656450726f6e6f756e73223a224e494c222c22656d61696c223a2273616d706c65406578616d706c652e636f6d222c22776f726b50686f6e65223a223032393338373637313839222c2263656c6c50686f6e65223a22393338373238393338222c226a6f625469746c65223a2256454c53222c22636f6d70616e79223a2256454c53222c22666c696768744172726976616c223a22392e3130222c22666c69676874446570617274757265223a22392e3536222c227069636b75704c6f636174696f6e223a22414952504f5254222c2264726f706f66664c6f636174696f6e223a224348454e4e4149222c2273706f757365496e666f223a22594553222c227669704e6574776f726b696e67223a22596573222c226576656e744769667473223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27597', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27598', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27599', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27600', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27601', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27602', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27603', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27604', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2267726f222c226c6173744e616d65223a226c616e222c22656d61696c223a2267726f40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2239323834383438333833222c22656d657267656e6379436f6e74616374223a2233383338333833222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27605', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a226268626468222c226c6173744e616d65223a2268646864222c22656d61696c223a2264677940676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223435363533343534222c22656d657267656e6379436f6e74616374223a22222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27606', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a226268626468222c226c6173744e616d65223a2268646864222c22656d61696c223a2264677940676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223435363533343534222c22656d657267656e6379436f6e74616374223a22222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27607', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a226268626468222c226c6173744e616d65223a2268646864222c22656d61696c223a2264677940676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223435363533343534222c22656d657267656e6379436f6e74616374223a22222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27608', 131072);
SELECT pg_catalog.lowrite(0, '\x7b22707265666978223a22686468222c2266697273744e616d65223a22756575686575222c226c6173744e616d65223a2262646275222c2270726566657272656450726f6e6f756e73223a226a6264756475222c22656d61696c223a2262756a647540676d61696c2e636f6d222c22776f726b50686f6e65223a223239333837343733323839222c2263656c6c50686f6e65223a22393338373433383239222c226a6f625469746c65223a227469746c65222c22636f6d70616e79223a2268696668696f6873222c22666c696768744172726976616c223a22392e3039222c22666c69676874446570617274757265223a22386c3033222c227069636b75704c6f636174696f6e223a22726839696269222c2264726f706f66664c6f636174696f6e223a22646975686469222c2273706f757365496e666f223a22222c227669704e6574776f726b696e67223a22596573222c226576656e744769667473223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27609', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a22706572736f6e31222c226c6173744e616d65223a226576656e74222c22656d61696c223a22706572736f6e3140676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223939393339333333222c22656d657267656e6379436f6e74616374223a22222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a224e6f227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('27610', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2272616a6173656b6172222c226c6173744e616d65223a226d6f68616e222c22656d61696c223a2273616d706c6540676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223038383037343437333134222c2274696d655a6f6e65223a22222c227368697070696e6741646472657373223a22706c6f74206e6f203135202c61767220626c6f73736f6d222c226164614163636f6d6d6f646174696f6e73223a22222c22766f6c756e746565724d6f64657261746f72223a22596573222c22617474656e6457697468223a22227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('35801', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2272616a222c226c6173744e616d65223a226d616e61222c22656d61696c223a2272616a40676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2232393338343738333932222c22656d657267656e6379436f6e74616374223a22333934383534333932222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('35802', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a2272616a6173656b6172222c226c6173744e616d65223a226d6f68616e222c22656d61696c223a226e65776d61696c303140676d61696c2e636f6d222c2267656e646572223a22222c2270686f6e65223a223038383037343437333134222c22656d657267656e6379436f6e74616374223a22222c227061726b696e67223a22222c22726f6f6d507265666572656e6365223a22222c22646965746172795265737472696374696f6e73223a5b5d2c2261637469766974696573223a5b5d2c2273686f7750726f66696c65223a22227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('35803', 131072);
SELECT pg_catalog.lowrite(0, '\x7b22707265666978223a226d72222c2266697273744e616d65223a226861222c226c6173744e616d65223a226e69222c2270726566657272656450726f6e6f756e73223a22696f61222c22656d61696c223a22766970303140676d61696c2e636f6d222c22776f726b50686f6e65223a2232393338347535222c2263656c6c50686f6e65223a22303239333834222c226a6f625469746c65223a226e6f222c22636f6d70616e79223a226e6f222c22666c696768744172726976616c223a22222c22666c69676874446570617274757265223a22222c227069636b75704c6f636174696f6e223a22222c2264726f706f66664c6f636174696f6e223a22222c2273706f757365496e666f223a22222c227669704e6574776f726b696e67223a22596573222c226576656e744769667473223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('35804', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a22756a617561222c226c6173744e616d65223a2275737573222c22656d61696c223a2275617540676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a2232333435343332323334222c22656d657267656e6379436f6e74616374223a223539323832383232222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a2253696e676c6520526f6f6d222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b224177617264732047616c612044696e6e6572225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('35805', 131072);
SELECT pg_catalog.lowrite(0, '\x7b2266697273744e616d65223a226a736a737571222c226c6173744e616d65223a2233383338222c22656d61696c223a226975686940676d61696c2e636f6d222c2267656e646572223a224d616c65222c2270686f6e65223a223439393239393239323932222c22656d657267656e6379436f6e74616374223a2239383339323932313131222c227061726b696e67223a22596573222c22726f6f6d507265666572656e6365223a224e6f20526f6f6d204e6565646564222c22646965746172795265737472696374696f6e73223a5b224e6f6e65225d2c2261637469766974696573223a5b22546f776e2048616c6c225d2c2273686f7750726f66696c65223a22596573227d');
SELECT pg_catalog.lo_close(0);

COMMIT;

--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Registration Registration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: event_attendees event_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);


--
-- Name: event_planning event_planning_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_planning
    ADD CONSTRAINT event_planning_pkey PRIMARY KEY (id);


--
-- Name: event_registration_settings event_registration_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registration_settings
    ADD CONSTRAINT event_registration_settings_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: event_team_members event_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_team_members
    ADD CONSTRAINT event_team_members_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: microsite_sections microsite_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microsite_sections
    ADD CONSTRAINT microsite_sections_pkey PRIMARY KEY (id);


--
-- Name: microsite_themes microsite_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microsite_themes
    ADD CONSTRAINT microsite_themes_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: payment_settings payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: registration_approvals registration_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_approvals
    ADD CONSTRAINT registration_approvals_pkey PRIMARY KEY (id);


--
-- Name: registration_custom_fields registration_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_custom_fields
    ADD CONSTRAINT registration_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: registration_settings registration_settings_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_settings
    ADD CONSTRAINT registration_settings_event_id_key UNIQUE (event_id);


--
-- Name: registration_settings registration_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_settings
    ADD CONSTRAINT registration_settings_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: session_speakers session_speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_speakers
    ADD CONSTRAINT session_speakers_pkey PRIMARY KEY (session_id, speaker_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: speakers speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speakers
    ADD CONSTRAINT speakers_pkey PRIMARY KEY (id);


--
-- Name: sponsors sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: payment_settings uk3cje8n1g5n7crws8mbqkpkheh; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT uk3cje8n1g5n7crws8mbqkpkheh UNIQUE (event_id);


--
-- Name: locations uk3ft135ipc4iy1y3bx6w226qgx; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT uk3ft135ipc4iy1y3bx6w226qgx UNIQUE (place_id);


--
-- Name: event_registration_settings uk47gags0gwpuon6layy09p17pf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registration_settings
    ADD CONSTRAINT uk47gags0gwpuon6layy09p17pf UNIQUE (event_id);


--
-- Name: microsite_themes ukc2f6aahiwkq9t8tfu5rm4h21v; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microsite_themes
    ADD CONSTRAINT ukc2f6aahiwkq9t8tfu5rm4h21v UNIQUE (event_id);


--
-- Name: event_planning ukh3kg707k0bil98dde1ga4n6dp; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_planning
    ADD CONSTRAINT ukh3kg707k0bil98dde1ga4n6dp UNIQUE (event_id);


--
-- Name: registration_custom_fields uq_reg_field_event_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_custom_fields
    ADD CONSTRAINT uq_reg_field_event_key UNIQUE (event_id, field_key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: activity_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX activity_logs_action_idx ON public.activity_logs USING btree (action);


--
-- Name: activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree (created_at);


--
-- Name: activity_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activity_logs_userId_idx" ON public.activity_logs USING btree ("userId");


--
-- Name: idx_event_member_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_member_email ON public.event_team_members USING btree (email);


--
-- Name: idx_event_member_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_member_event ON public.event_team_members USING btree (event_id);


--
-- Name: idx_payments_stripe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_stripe ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: idx_promo_codes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promo_codes_active ON public.promo_codes USING btree (is_active);


--
-- Name: idx_promo_codes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promo_codes_code ON public.promo_codes USING btree (code);


--
-- Name: idx_promo_codes_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promo_codes_event ON public.promo_codes USING btree (event_id);


--
-- Name: idx_reg_approvals_event_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reg_approvals_event_status ON public.registration_approvals USING btree (event_id, status);


--
-- Name: idx_reg_settings_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reg_settings_event ON public.registration_settings USING btree (event_id);


--
-- Name: idx_tickets_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_event ON public.tickets USING btree (event_id);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_organizerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registration_settings fk27tjpt2lubmtqm4ljp10dy9ri; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_settings
    ADD CONSTRAINT fk27tjpt2lubmtqm4ljp10dy9ri FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: tickets fk3utafe14rupaypjocldjaj4ol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk3utafe14rupaypjocldjaj4ol FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_rsvps fk46d4781rhlidxpk7m9qg0eqsy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT fk46d4781rhlidxpk7m9qg0eqsy FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: microsite_sections fk6p7mfttdowgkge53fwc8n0kn9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microsite_sections
    ADD CONSTRAINT fk6p7mfttdowgkge53fwc8n0kn9 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_planning fk6v5xigny9lv6otogige0jq1li; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_planning
    ADD CONSTRAINT fk6v5xigny9lv6otogige0jq1li FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: payment_settings fk8dbk9o8u9367sikyuyb5viyq9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT fk8dbk9o8u9367sikyuyb5viyq9 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: microsite_themes fk8p8eytwhjovw9aa6nrcgukd96; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microsite_themes
    ADD CONSTRAINT fk8p8eytwhjovw9aa6nrcgukd96 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_planning fk9mip4bignswdw56h1qqnb5ea; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_planning
    ADD CONSTRAINT fk9mip4bignswdw56h1qqnb5ea FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: session_speakers fka5bgnuroeuhl6ebgy17bs8fvo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_speakers
    ADD CONSTRAINT fka5bgnuroeuhl6ebgy17bs8fvo FOREIGN KEY (speaker_id) REFERENCES public.speakers(id);


--
-- Name: session_speakers fkbsd81c224tlaepmsbqiwo3obg; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_speakers
    ADD CONSTRAINT fkbsd81c224tlaepmsbqiwo3obg FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: event_attendees fkg0w14vgqmpawqmil4fceac4yl; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_attendees
    ADD CONSTRAINT fkg0w14vgqmpawqmil4fceac4yl FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_registration_settings fki6qlhltdx67odep5ur5l4wqg1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registration_settings
    ADD CONSTRAINT fki6qlhltdx67odep5ur5l4wqg1 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: payments fkix2erkxpmt7dx3e8dhjnunm52; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fkix2erkxpmt7dx3e8dhjnunm52 FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: registration_custom_fields fkm7r5h6jwxdpgh6ty7ipnvd52a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_custom_fields
    ADD CONSTRAINT fkm7r5h6jwxdpgh6ty7ipnvd52a FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: payments fkmok6urmuf6s9wdl5hxv8nv3oy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fkmok6urmuf6s9wdl5hxv8nv3oy FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: sessions fkpeyjpa5p9rfg5ofhtwh8h61x7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fkpeyjpa5p9rfg5ofhtwh8h61x7 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: promo_codes fksi1hv7yvg0fhor50j26rl6kq7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT fksi1hv7yvg0fhor50j26rl6kq7 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: speakers fkssjp34bs2oghuq689b5liqlpn; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speakers
    ADD CONSTRAINT fkssjp34bs2oghuq689b5liqlpn FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: sponsors fksx58y3fcf4wa78qrwa756flgf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT fksx58y3fcf4wa78qrwa756flgf FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: verification_tokens verification_tokens_identifier_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_identifier_fkey FOREIGN KEY (identifier) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict fMNqe6acTiqx6J9i8oLb9T37J3sHBXvRe2Cc3Xd17ZjUWY5UkMcmaBtFllz2qqJ

