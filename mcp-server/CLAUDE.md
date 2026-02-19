Do NOT use try/except UNLESS you are implementing genuine fallback behavior (printing/logging doesn't count!). No needlessly swallowing errors! Let them propagate!

Prefer `class MyNamedTuple(NamedTuple)` definitions over dictionaries for return types of internal functions.

When using multi-line triple-quoted strings, place them inline and wrap them with `dedent_strip_format`, which combines the functions with those names, or else simply use `dedent_strip` if no interpolation is required. Do not use f-strings for multi-line triple-quoted strings. Example:

```python
def my_func(a, b, c):
    system_prompt = dedent_strip_format(
        """\
        This is a long multi-line triple quoted string.
        We need to interpolate some values:
        {a}
        {b}, {c}
        """,
        a=a,
        b=b,
        c=c
    )
```

Avoid defining simple same-file helper functions that would only ever be invoked once per parent function, and have no/minimal control structure of their own. In this case, for readability it is better to inline and have a longer parent function body.

Leave `__init__.py` files empty unless you have a good reason not to.

Do not use local imports unless you have to.
