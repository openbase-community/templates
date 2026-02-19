import click

from $${name_snake}._version import __version__
# from $${name_snake}.cli_helpers import common_command_wrapper


def print_version(ctx, param, value):
    if not value or ctx.resilient_parsing:
        return
    click.echo(f"cursor-multi {__version__}")
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
    """
    pass


## main.add_command(common_command_wrapper(merge_branch_cmd))

if __name__ == "__main__":
    main()
