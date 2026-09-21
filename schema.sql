-- Run in your Supabase project's SQL Editor → New query → paste → Run.
-- Safe to re-run: creates the table if missing, and adds/renames columns
-- if you already ran an earlier version of this file.

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
  city text default 'Medellín',
  neighborhood text,

  vehicle_type text not null,
  plate text,
  vehicle_model text,
  license_expiry date,
  soat_expiry date,
  tecnomecanica_expiry date,

  availability jsonb,

  eps text,
  arl text,
  emergency_contact_name text,
  emergency_contact_phone text,

  payment_method text,
  payment_account text,
  payment_account_holder text,

  agreement_accepted boolean not null default false,
  agreement_signature text not null,
  agreement_accepted_at timestamptz,

  raw jsonb
);

-- Migration for a table created from an earlier version of this file.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'skipfee_applications' and column_name = 'address') then
    alter table skipfee_applications drop column address;
  end if;
  if exists (select 1 from information_schema.columns
             where table_name = 'skipfee_applications' and column_name = 'license_number')
     and not exists (select 1 from information_schema.columns
             where table_name = 'skipfee_applications' and column_name = 'license_expiry') then
    alter table skipfee_applications rename column license_number to license_expiry;
    alter table skipfee_applications alter column license_expiry type date using null;
  end if;
end $$;

alter table skipfee_applications add column if not exists vehicle_model text;
alter table skipfee_applications add column if not exists payment_account_holder text;

-- Row Level Security stays ON with no policies: skipfee_applications is
-- reachable only through the service_role key used server-side in
-- api/apply.js and api/admin.js. The public anon key this project already
-- uses for the bikini store gets zero access to this table, so one courier
-- applicant can never read another applicant's cédula, phone, or bank
-- account — and the bikini store's own client code can't see it either.
alter table skipfee_applications enable row level security;

create index if not exists skipfee_applications_created_at_idx on skipfee_applications (created_at desc);
