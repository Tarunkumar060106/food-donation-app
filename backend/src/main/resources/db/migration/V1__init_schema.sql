create table organizations (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(120) not null,
    type        varchar(40)  not null,
    address     varchar(255),
    contact     varchar(40),
    created_at  timestamptz  not null default now()
);

create table users (
    id                 uuid primary key default gen_random_uuid(),
    name               varchar(120) not null,
    email              varchar(160) not null unique,
    password_hash      varchar(100) not null,
    role               varchar(20)  not null check (role in ('DONOR', 'VOLUNTEER', 'NGO', 'ADMIN')),
    phone              varchar(20),
    latitude           double precision check (latitude between -90 and 90),
    longitude          double precision check (longitude between -180 and 180),
    capacity_servings  integer check (capacity_servings > 0),
    accepts_non_veg    boolean      not null default true,
    organization_id    uuid references organizations (id),
    created_at         timestamptz  not null default now()
);

create table donations (
    id                    uuid primary key default gen_random_uuid(),
    donor_id              uuid         not null references users (id),
    food_name             varchar(120) not null,
    category              varchar(20)  not null check (category in ('COOKED_MEAL', 'BAKERY', 'PRODUCE', 'PACKAGED', 'DAIRY', 'OTHER')),
    dietary               varchar(10)  not null check (dietary in ('VEG', 'NON_VEG')),
    quantity_description  varchar(120),
    servings              integer      not null check (servings > 0),
    description           varchar(1000),
    image_url             varchar(500),
    pickup_address        varchar(255) not null,
    pickup_lat            double precision not null check (pickup_lat between -90 and 90),
    pickup_lng            double precision not null check (pickup_lng between -180 and 180),
    pickup_deadline       timestamptz  not null,
    expiry_time           timestamptz  not null,
    status                varchar(20)  not null default 'AVAILABLE'
        check (status in ('AVAILABLE', 'CLAIMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED')),
    version               bigint       not null default 0,
    created_at            timestamptz  not null default now(),
    updated_at            timestamptz  not null default now(),
    constraint pickup_before_expiry check (pickup_deadline <= expiry_time)
);

create index idx_donations_status_expiry on donations (status, expiry_time);
create index idx_donations_donor on donations (donor_id);

create table pickups (
    id                uuid primary key default gen_random_uuid(),
    donation_id       uuid        not null references donations (id),
    collector_id      uuid        not null references users (id),
    status            varchar(20) not null
        check (status in ('CLAIMED', 'ARRIVED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    sharing_location  boolean     not null default false,
    last_lat          double precision,
    last_lng          double precision,
    last_location_at  timestamptz,
    claimed_at        timestamptz not null default now(),
    arrived_at        timestamptz,
    picked_up_at      timestamptz,
    in_transit_at     timestamptz,
    delivered_at      timestamptz,
    cancelled_at      timestamptz,
    version           bigint      not null default 0
);

-- Backstop for the atomic claim: at most one live pickup per donation.
create unique index uq_pickups_one_active_per_donation
    on pickups (donation_id)
    where status not in ('DELIVERED', 'CANCELLED');

create index idx_pickups_collector on pickups (collector_id);

create table location_updates (
    id           bigserial primary key,
    pickup_id    uuid             not null references pickups (id),
    latitude     double precision not null check (latitude between -90 and 90),
    longitude    double precision not null check (longitude between -180 and 180),
    recorded_at  timestamptz      not null default now()
);

create index idx_location_updates_pickup on location_updates (pickup_id, recorded_at desc);

create table notifications (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid         not null references users (id),
    type        varchar(30)  not null,
    title       varchar(120) not null,
    message     varchar(500) not null,
    read_at     timestamptz,
    created_at  timestamptz  not null default now()
);

create index idx_notifications_user on notifications (user_id, created_at desc);

-- Supabase exposes the public schema over its Data API. The app only talks to the
-- database through Spring (as the table owner, which bypasses RLS), so enabling RLS
-- with no policies blocks all direct API access to these tables.
alter table organizations    enable row level security;
alter table users            enable row level security;
alter table donations        enable row level security;
alter table pickups          enable row level security;
alter table location_updates enable row level security;
alter table notifications    enable row level security;
