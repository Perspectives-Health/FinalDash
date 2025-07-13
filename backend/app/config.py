import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_HOST = os.getenv("PROD_DB_HOST", "165.227.120.106")
DATABASE_PORT = int(os.getenv("PROD_DB_PORT", "5432"))
DATABASE_NAME = os.getenv("PROD_DB_NAME", "postgres")
DATABASE_USER = os.getenv("PROD_DB_USER", "postgres")
DATABASE_PASSWORD = os.getenv("PROD_DB_PASSWORD")

DATABASE_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"