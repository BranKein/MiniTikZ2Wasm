"""AST conversion stage (docs/compiler-steps/03-ast)."""

from .errors import StepResult


def build_ast(parse_tree: dict) -> StepResult:
    """Parse tree from `parse` -> AST in `output`.

    The root is a `Program` node `{"kind": "Program", "body": [...], "line": int, "column": int}`;
    node shapes are listed in the 03-ast doc.
    """
    raise NotImplementedError("ast conversion: TODO")
