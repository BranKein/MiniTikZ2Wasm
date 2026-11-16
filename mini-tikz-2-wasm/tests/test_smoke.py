import pytest

import mini_tikz_2_wasm
from mini_tikz_2_wasm import Diagnostic, STEPS


def test_package_imports():
    assert mini_tikz_2_wasm


def test_step_names():
    assert [name for name, _ in STEPS] == ["lex", "parse", "analyze", "codegen"]


@pytest.mark.parametrize("_name, step", STEPS)
def test_steps_are_stubs(_name, step):
    with pytest.raises(NotImplementedError):
        step("dummy")


def test_diagnostic_dict():
    assert Diagnostic("syntax", "msg", 1, 2).to_dict() == {
        "kind": "syntax", "message": "msg", "line": 1, "column": 2,
    }
