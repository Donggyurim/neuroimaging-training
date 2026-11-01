"""Validate published notebook structure and code without running MRI analyses."""
import ast
from pathlib import Path
import nbformat

root = Path(__file__).resolve().parent.parent
notebooks = sorted((root / "notebooks").glob("*.ipynb"))
if not notebooks:
    raise SystemExit("No course notebooks found")
for path in notebooks:
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    code_cells = [cell for cell in notebook.cells if cell.cell_type == "code"]
    if not code_cells:
        raise SystemExit(f"{path.name}: no executable tutorial cells")
    for index, cell in enumerate(notebook.cells, 1):
        if cell.cell_type == "code":
            ast.parse(cell.source, filename=f"{path.name}:cell-{index}")
            if cell.outputs or cell.execution_count is not None:
                raise SystemExit(f"{path.name}:cell-{index}: saved runtime output in public copy")
    if "widgets" in notebook.metadata:
        raise SystemExit(f"{path.name}: saved widget state in public copy")
    print(f"PASS: {path.name}: notebook schema and {len(code_cells)} code-cell syntax checks; no saved outputs")
print("MRI downloads, inference, Drive authentication, and visual QC were not executed.")
