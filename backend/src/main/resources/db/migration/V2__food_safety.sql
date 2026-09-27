-- When the food was cooked or prepared, and whether it must stay cold until delivery.
alter table donations add column prepared_at timestamptz;
alter table donations add column requires_refrigeration boolean not null default false;
alter table donations add constraint prepared_before_expiry
    check (prepared_at is null or prepared_at <= expiry_time);

-- Whether a collector (volunteer or NGO) can keep food cold in transit or on site.
alter table users add column has_cool_box boolean not null default false;
