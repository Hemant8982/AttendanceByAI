from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

if SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_ROLE_KEY != "your_service_role_key_here":
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    supabase_admin = supabase
