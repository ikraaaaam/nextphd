-- Seed script for local development

-- 1. Insert a test user
insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) values (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'test@nextphd.local',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
), (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'test2@nextphd.local',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
);

insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) values (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'test@nextphd.local',
    format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'test@nextphd.local')::jsonb,
    'email',
    now(),
    now(),
    now()
);

-- 2. Seed deterministic data for Universities
insert into universities (id, owner_id, name, country, verified) values 
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MBZUAI', 'UAE', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'KFUPM', 'Saudi Arabia', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'KAUST', 'Saudi Arabia', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'GIST', 'South Korea', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DGIST', 'South Korea', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'UNIST', 'South Korea', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'KAIST', 'South Korea', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Monash Malaysia', 'Malaysia', true),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'UTM', 'Malaysia', true);
