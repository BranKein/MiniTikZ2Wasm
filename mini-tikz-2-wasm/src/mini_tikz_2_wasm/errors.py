"""Compiler diagnostics and the common step result."""

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class Diagnostic:
    kind: str
    message: str
    line: Optional[int] = None
    column: Optional[int] = None

    def to_dict(self):
        return {"kind": self.kind, "message": self.message, "line": self.line, "column": self.column}


class CompileError(Exception):
    def __init__(self, diagnostics: list[Diagnostic]):
        self.diagnostics = diagnostics
        super().__init__("compilation failed")


@dataclass
class StepResult:
    """What every step returns (docs/compiler-steps/README.md: `{ output, errors }`).

    `output` is the step's data (JSON-compatible, except codegen's bytes), possibly a recovered
    partial result; `None` when there is nothing to return. `errors` is empty when there are none.
    Steps report compile errors here instead of raising; they do not raise `CompileError`.
    """

    output: Any = None
    errors: list[Diagnostic] = field(default_factory=list)

    def to_dict(self):
        return {"output": self.output, "errors": [item.to_dict() for item in self.errors]}
