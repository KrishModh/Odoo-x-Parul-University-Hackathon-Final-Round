import subprocess
import sys
import os
from urllib.parse import urlparse

from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

url = urlparse(DATABASE_URL)
user = url.username
password = url.password
host = url.hostname
port = url.port or 5432
dbname = url.path[1:]

print(f"[1/4] Checking database '{dbname}'...")
try:
    conn = psycopg2.connect(user=user, password=password, host=host, port=port, database="postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
    if not cur.fetchone():
        cur.execute(f'CREATE DATABASE "{dbname}"')
        print(f"    Database '{dbname}' created!")
    else:
        print(f"    Database '{dbname}' already exists, skipping.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR creating database: {e}")
    sys.exit(1)

print("[2/4] Checking migrations folder...")
if not os.path.exists("migrations"):
    print("    Migrations folder not found, initializing...")
    result = subprocess.run([sys.executable, "-m", "flask", "db", "init"])
    if result.returncode != 0:
        print("ERROR: flask db init failed.")
        sys.exit(1)
    print("    Migrations initialized!")
    
    print("    Generating migration...")
    result = subprocess.run([sys.executable, "-m", "flask", "db", "migrate", "-m", "initial migration"])
    if result.returncode != 0:
        print("ERROR: flask db migrate failed.")
        sys.exit(1)
    print("    Migration generated!")
else:
    print("    Migrations folder exists, skipping init.")

print("[3/4] Running migrations...")
result = subprocess.run([sys.executable, "-m", "flask", "db", "upgrade"])
if result.returncode != 0:
    print("ERROR: Migrations failed.")
    sys.exit(1)
print("    Migrations done!")

print("[4/5] Seeding defaults...")
result = subprocess.run([sys.executable, "-m", "flask", "seed"])
if result.returncode != 0:
    print("ERROR: Seeding failed.")
    sys.exit(1)
print("    Defaults ready!")

print("[5/5] Starting server...")
subprocess.run([sys.executable, "run.py"])
