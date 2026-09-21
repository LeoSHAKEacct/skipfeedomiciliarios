-- Run once in your EXISTING Supabase project (the one already used for the
-- bikini store — "lina bikini"): Project → SQL Editor → New query → paste → Run.
-- Table is namespaced skipfee_* so it can't collide with that project's own tables.

create table if not exists skipfee_applications (
  id bigint generated always as identity primary key,
  radicado text unique not null,
  created_at timestamptz not null default now(),

  full_name text not null,
  document_type text not null,
  document_number text not null,
  birth_date date,
  phone text not null,
  email text,
  address text,
  neighborhood text,
  city text default 'Medellín',

  vehicle_type text not null,
  plate text,
  license_number text,
  soat_expiry date,
  tecnomecanica_expiry date,

  availability jsonb,

  eps text,
  arl text,
  emergency_contact_name text,
  emergency_contact_phone text,

  payment_method text,
  payment_account text,

  agreement_accepted boolean not null default false,
  agreement_signature text not null,
  agreement_accepted_at timestamptz,

  raw jsonb
);

-- Row Level Security stays ON with no policies: skipfee_applications is
-- reachable only through the service_role key used server-side in
-- api/apply.js. The public anon key this project already uses for the
-- bikini store gets zero access to this table, so one courier applicant
-- can never read another applicant's cédula, phone, or bank account —
-- and the bikini store's own client code can't see it either.
alter table skipfee_applications enable row level security;

create index if not exists skipfee_applications_created_at_idx on skipfee_applications (created_at desc);
