UPDATE users target
SET encoded_password = source.encoded_password,
    enabled = TRUE
FROM users source
WHERE target.email = 'admin@shipyard.com'
  AND source.email = 'operator@shipyard.com';

