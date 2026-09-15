select grantee, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'service_role'
  and table_schema = 'public'
  and privilege_type not in ('TRUNCATE', 'REFERENCES', 'TRIGGER');