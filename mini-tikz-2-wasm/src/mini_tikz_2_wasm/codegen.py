"""WebAssembly code generation stage (docs/compiler-steps/05-codegen)."""

from .errors import StepResult


def codegen(analyzed: dict) -> StepResult:
    """`output` of `analyze` (`{"ast", "symbols"}`) -> WebAssembly binary (`bytes`) in `output`.

    `output` is `None` when generation fails. The backend base64-encodes the bytes for JSON.
    """
    raise NotImplementedError("codegen: TODO")
