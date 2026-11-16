"""MiniTikZ-to-Wasm compiler package."""

from .codegen import codegen
from .errors import CompileError, Diagnostic
from .lexer import lex
from .parser import parse
from .semantic import analyze

STEPS = [("lex", lex), ("parse", parse), ("analyze", analyze), ("codegen", codegen)]

__all__ = ["Diagnostic", "CompileError", "STEPS", "lex", "parse", "analyze", "codegen"]
