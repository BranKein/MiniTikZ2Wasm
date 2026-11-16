"""Compiler diagnostics."""

from dataclasses import dataclass


@dataclass
class Diagnostic:
    kind: str
    message: str
    line: int
    column: int

    def to_dict(self):
        return {"kind": self.kind, "message": self.message, "line": self.line, "column": self.column}


class CompileError(Exception):
    def __init__(self, diagnostics: list[Diagnostic]):
        self.diagnostics = diagnostics
        super().__init__("compilation failed")
