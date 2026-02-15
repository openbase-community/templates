"""
CLI entry point for $${name_snake}.
"""

from __future__ import annotations

import click

from $${name_snake}._version import __version__
from $${name_snake}.cli.server import server


def print_version(ctx, param, value):
    if not value or ctx.resilient_parsing:
        return
    click.echo(f"$${cli_command} {__version__}")
    ctx.exit()


@click.group()
@click.option(
    "--version",
    is_flag=True,
    callback=print_version,
    expose_value=False,
    is_eager=True,
    help="Show the version and exit.",
)
def main():
    """$${name_pretty}

    $${description}
    """
    pass


main.add_command(server)


if __name__ == "__main__":
    main()
