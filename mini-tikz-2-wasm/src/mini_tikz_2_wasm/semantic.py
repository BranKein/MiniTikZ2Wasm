"""Semantic analysis stage (docs/compiler-steps/04-semantic)."""

from .errors import StepResult


def analyze(ast: dict) -> StepResult:
    """AST from `build_ast` -> `{"ast": <analyzed AST>, "symbols": [...]}` in `output`.

    Each symbol is `{"kind": "node" | "loopVariable", "name": str, "line": int, "column": int}`.
    Any error blocks code generation.
    """
    raise NotImplementedError("semantic analysis: TODO")
