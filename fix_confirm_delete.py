import re

def remove_confirm(filepath, var_confirm):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the confirm block
    pattern = r"if \(confirm\(`Yakin ingin menghapus semua data.*?`\)\) \{(.*?)\n  \}"
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        inner_block = match.group(1)
        # dedent inner block by 2 spaces for formatting (optional, but good)
        inner_block_dedented = "\n".join([line[2:] if line.startswith("  ") else line for line in inner_block.split("\n")])
        content = content.replace(match.group(0), inner_block_dedented)
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"Pattern not found in {filepath}")

remove_confirm('src/views/Nilai.vue', 'penilaian')
remove_confirm('src/views/Hasil.vue', 'data')

