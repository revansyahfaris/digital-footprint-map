import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv

# 1. Load .env file to read the database URL
load_dotenv()

# 2. Import SQLModel and our models
from sqlmodel import SQLModel
from app.models import user, footprint  # Required for Alembic to recognize the structure

# this is the Alembic Config object
config = context.config

# 3. Override the URL in alembic.ini with the URL from the .env file
config.set_main_option("sqlalchemy.url", os.environ.get("DATABASE_URL"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Set target metadata from SQLModel
target_metadata = SQLModel.metadata

# Standard Alembic run_migrations functions follow below

def run_migrations_offline() -> None:
    # ... kode bawaan alembic ...
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # ... kode bawaan alembic ...
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()