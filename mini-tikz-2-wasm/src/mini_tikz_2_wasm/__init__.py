"""MiniTikZ-to-Wasm compiler package."""

from .ast_builder import build_ast
from .codegen import codegen
from .errors import CompileError, Diagnostic, StepResult
from .lexer import lex
from .parser import parse
from .semantic import analyze

STEPS = [("lex", lex), ("parse", parse), ("ast", build_ast), ("analyze", analyze), ("codegen", codegen)]

__all__ = [
    "Diagnostic", "CompileError", "StepResult", "STEPS",
    "lex", "parse", "build_ast", "analyze", "codegen",
]
