INSERT INTO auth_users (id, email, password_hash, role, name, campaign_id)
VALUES
  (
    'info-dania',
    'dania@info.gob',
    '5f6317c441e78342c4eed2ef8962e26c.cf182c364a4d9b3a13d6291d5c2b35d8abd69f111bbe6ae06b82e9f83942f0bdb60e5aad8127933fa902b7221750a9d7e6c8e0fd7528fe727181572736819950',
    'candidato',
    'Dania',
    NULL
  ),
  (
    'info-milagros',
    'milagros@info.gob',
    '5f6317c441e78342c4eed2ef8962e26c.cf182c364a4d9b3a13d6291d5c2b35d8abd69f111bbe6ae06b82e9f83942f0bdb60e5aad8127933fa902b7221750a9d7e6c8e0fd7528fe727181572736819950',
    'candidato',
    'Milagros',
    NULL
  ),
  (
    'info-jazmin',
    'jazmin@info.gob',
    '5f6317c441e78342c4eed2ef8962e26c.cf182c364a4d9b3a13d6291d5c2b35d8abd69f111bbe6ae06b82e9f83942f0bdb60e5aad8127933fa902b7221750a9d7e6c8e0fd7528fe727181572736819950',
    'candidato',
    'Jazmin',
    NULL
  ),
  (
    'info-naomi',
    'naomi@info.gob',
    '5f6317c441e78342c4eed2ef8962e26c.cf182c364a4d9b3a13d6291d5c2b35d8abd69f111bbe6ae06b82e9f83942f0bdb60e5aad8127933fa902b7221750a9d7e6c8e0fd7528fe727181572736819950',
    'candidato',
    'Naomi',
    NULL
  ),
  (
    'info-reghina',
    'reghina@info.gob',
    '5f6317c441e78342c4eed2ef8962e26c.cf182c364a4d9b3a13d6291d5c2b35d8abd69f111bbe6ae06b82e9f83942f0bdb60e5aad8127933fa902b7221750a9d7e6c8e0fd7528fe727181572736819950',
    'candidato',
    'Reghina',
    NULL
  )
ON CONFLICT (email)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  campaign_id = EXCLUDED.campaign_id,
  updated_at = now();
