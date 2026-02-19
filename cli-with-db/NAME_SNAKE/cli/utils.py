"""
CLI utility functions for $${name_snake}.

This module provides utilities for setting up the Django environment,
running migrations, and managing secrets.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path


def get_data_dir() -> Path:
    """Get the data directory for storing persistent data."""
    data_dir = Path(
        os.environ.get(
            "$${name_snake.upper()}_DATA_DIR", Path.home() / ".$${name_snake}"
        )
    )
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_env_file() -> Path:
    """Get the path to the .env file."""
    return get_data_dir() / ".env"


def generate_secret_key() -> str:
    """Generate a secure secret key for Django."""
    return secrets.token_urlsafe(50)


def generate_api_token() -> str:
    """Generate a secure API token."""
    return secrets.token_urlsafe(32)


def ensure_env_file() -> dict[str, str]:
    """
    Ensure the .env file exists with required secrets.

    Returns a dict of the environment variables that were loaded/generated.
    """
    env_file = get_env_file()
    env_vars = {}

    # Load existing env file if it exists
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()

    # Generate missing secrets
    secret_key_var = "$${name_snake.upper()}_SECRET_KEY"
    api_token_var = "$${name_snake.upper()}_API_TOKEN"

    if secret_key_var not in env_vars:
        env_vars[secret_key_var] = generate_secret_key()

    if api_token_var not in env_vars:
        env_vars[api_token_var] = generate_api_token()

    # Write back the env file
    with open(env_file, "w") as f:
        f.write("# Auto-generated environment file for $${name_snake}\n")
        f.write("# Do not commit this file to version control\n\n")
        for key, value in sorted(env_vars.items()):
            f.write(f"{key}={value}\n")

    return env_vars


def setup_django_environment() -> dict[str, str]:
    """
    Set up the Django environment.

    This function:
    1. Ensures the .env file exists with required secrets
    2. Loads environment variables
    3. Sets the Django settings module

    Returns the environment variables dict.
    """
    env_vars = ensure_env_file()

    # Set environment variables
    for key, value in env_vars.items():
        os.environ.setdefault(key, value)

    # Set Django settings module
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "$${name_snake}.config.settings")

    return env_vars


def run_migrations() -> None:
    """Run Django migrations."""
    import django
    from django.core.management import call_command

    django.setup()
    call_command("migrate", verbosity=1)


def run_collectstatic() -> None:
    """Run Django collectstatic."""
    import django
    from django.core.management import call_command

    django.setup()
    call_command("collectstatic", verbosity=0, interactive=False)
