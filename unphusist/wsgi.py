import os
import shutil
from pathlib import Path
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unphusist.settings')

# Vercel has a read-only filesystem except /tmp.
# Copy the bundled SQLite DB to /tmp so Django can write to it.
if os.environ.get('VERCEL'):
    db_source = Path(__file__).resolve().parent.parent / 'db.sqlite3'
    db_target = Path('/tmp/db.sqlite3')
    if not db_target.exists() and db_source.exists():
        shutil.copy2(db_source, db_target)

application = get_wsgi_application()
