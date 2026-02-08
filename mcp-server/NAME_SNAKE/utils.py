from textwrap import dedent
from typing import Any


def dedent_strip_format(template: str, **kwargs: Any) -> str:
    """Dedent and strip the format of a template string."""
    return dedent(template).strip().format(**kwargs)


def dedent_strip(text: str) -> str:
    """Dedent and strip the text."""
    return dedent(text).strip()
