"""Parsing stage (docs/compiler-steps/02-parser)."""

from .errors import StepResult


def parse(tokens: list[dict]) -> StepResult:
    """Token list from `lex` -> parse tree in `output`.

    The root is `{"rule": str, "children": [...], "line": int, "column": int}`; children are rule
    nodes or tokens. On syntax errors, return the partial tree and the diagnostics.
    """
    raise NotImplementedError("parser: TODO")
