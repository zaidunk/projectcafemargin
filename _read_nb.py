import json

with open(r'C:\Users\farsya\Downloads\DataProcessingSeharga1JT (1).ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

with open(r'C:\Users\farsya\ProjectCafeMargin\_nb_output.txt', 'w', encoding='utf-8') as out:
    for i, cell in enumerate(nb['cells']):
        cell_type = cell.get('cell_type', 'unknown')
        source = ''.join(cell.get('source', []))
        out.write(f"=== CELL {i} [{cell_type}] ===\n{source}\n\n")
    out.write(f"TOTAL CELLS: {len(nb['cells'])}\n")

print("Done")
