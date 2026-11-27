"""Lexing stage (docs/compiler-steps/01-lexer)."""

from .errors import StepResult


def lex(source: str) -> StepResult:
    """MiniTikZ source -> token list in `output`.

    Each token is `{"kind": str, "lexeme": str, "line": int, "column": int}`.
    """
    raise NotImplementedError("lexer: TODO")
