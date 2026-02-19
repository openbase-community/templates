"""
Server command for $${name_snake}.

This module provides the CLI command to start the Django server.
"""

from __future__ import annotations

import os
import subprocess
import sys

import click

from $${name_snake}.cli.utils import (
    get_data_dir,
    run_collectstatic,
    run_migrations,
    setup_django_environment,
)


@click.command()
@click.option(
    "--host",
    default="127.0.0.1",
    help="Host to bind to.",
    show_default=True,
)
@click.option(
    "--port",
    default=8000,
    type=int,
    help="Port to bind to.",
    show_default=True,
)
@click.option(
    "--workers",
    default=1,
    type=int,
    help="Number of worker processes.",
    show_default=True,
)
@click.option(
    "--reload",
    "reload_",
    is_flag=True,
    help="Enable auto-reload for development.",
)
@click.option(
    "--skip-migrations",
    is_flag=True,
    help="Skip running migrations on startup.",
)
@click.option(
    "--skip-collectstatic",
    is_flag=True,
    help="Skip running collectstatic on startup.",
)
def server(
    host: str,
    port: int,
    workers: int,
    reload_: bool,
    skip_migrations: bool,
    skip_collectstatic: bool,
) -> None:
    """Start the $${name_pretty} server."""
    # Set up the Django environment
    env_vars = setup_django_environment()
    data_dir = get_data_dir()

    click.echo(f"Data directory: {data_dir}")
    click.echo(f"API Token: {env_vars.get('$${name_snake.upper()}_API_TOKEN', 'Not set')}")
    click.echo()

    # Run migrations
    if not skip_migrations:
        click.echo("Running migrations...")
        run_migrations()
        click.echo()

    # Run collectstatic
    if not skip_collectstatic:
        click.echo("Collecting static files...")
        run_collectstatic()
        click.echo()

    # Start the server
    click.echo(f"Starting server at http://{host}:{port}")
    click.echo("Press Ctrl+C to stop.")
    click.echo()

    # Build the gunicorn command
    cmd = [
        sys.executable,
        "-m",
        "gunicorn",
        "$${name_snake}.config.wsgi:application",
        "--bind",
        f"{host}:{port}",
        "--workers",
        str(workers),
        "--worker-class",
        "uvicorn.workers.UvicornWorker",
        "--access-logfile",
        "-",
        "--error-logfile",
        "-",
    ]

    if reload_:
        cmd.extend(["--reload"])

    # Run the server
    try:
        subprocess.run(cmd, env=os.environ, check=True)
    except KeyboardInterrupt:
        click.echo("\nServer stopped.")
    except subprocess.CalledProcessError as e:
        click.echo(f"Server exited with error: {e.returncode}", err=True)
        sys.exit(e.returncode)
