"""MiniTikZ-to-Wasm compiler package."""

from .ast_builder import build_ast
from .codegen import codegen
from .errors import CompileError, Diagnostic, StepResult
from .lexer import lex
from .parser import parse
from .semantic import analyze

# TODO: add ("ast", build_ast) between "parse" and "analyze" once the step list is agreed
# (the smoke and backend tests still expect these 4 names).
STEPS = [("lex", lex), ("parse", parse), ("analyze", analyze), ("codegen", codegen)]

__all__ = [
    "Diagnostic", "CompileError", "StepResult", "STEPS",
    "lex", "parse", "build_ast", "analyze", "codegen",
]
