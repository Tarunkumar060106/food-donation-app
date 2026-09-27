-- Mutual acceptance: a collector asks for food (REQUEST) or a donor offers it (OFFER),
-- and the pickup only starts once the other side accepts.
create table match_requests (
    id            uuid primary key default gen_random_uuid(),
    donation_id   uuid         not null references donations (id),
    collector_id  uuid         not null references users (id),
    direction     varchar(10)  not null check (direction in ('REQUEST', 'OFFER')),
    status        varchar(12)  not null default 'PENDING'
        check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'CLOSED')),
    message       varchar(300),
    pickup_id     uuid references pickups (id),
    created_at    timestamptz  not null default now(),
    responded_at  timestamptz,
    version       bigint       not null default 0
);

-- One open conversation per donation and collector, whichever side started it.
create unique index uq_match_requests_one_pending
    on match_requests (donation_id, collector_id)
    where status = 'PENDING';

create index idx_match_requests_collector on match_requests (collector_id, created_at desc);
create index idx_match_requests_donation on match_requests (donation_id, created_at desc);

alter table match_requests enable row level security;

-- Opening hours for homes and centres, as IST wall-clock times. Both null means always open.
-- closes_at earlier than opens_at means the place is open overnight.
alter table users add column opens_at time;
alter table users add column closes_at time;
alter table users add constraint opening_hours_pair
    check ((opens_at is null) = (closes_at is null) and (opens_at is null or opens_at <> closes_at));

-- One-time donors sign in with a verified phone number instead of email and password.
alter table users alter column email drop not null;
alter table users alter column password_hash drop not null;
alter table users add column verified_phone varchar(20) unique;
alter table users add constraint users_can_sign_in
    check ((email is not null and password_hash is not null) or verified_phone is not null);
