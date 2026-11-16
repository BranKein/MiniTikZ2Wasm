"""Symbol table support; a BST implementation is allowed."""


class SymbolTable:
    """Stores names and their associated information."""

    def define(self, name, info):
        pass

    def lookup(self, name):
        raise NotImplementedError("symbol table: TODO")
