#!/usr/bin/env python3
import re
from pathlib import Path

def remove_conflict_markers(content: str) -> str:
    lines = []
    skip_to_end = False

    for line in content.split('\n'):
        if '<<<<<<< HEAD' in line:
            continue
        elif '=======' in line:
            continue
        elif line.startswith('>>>>>>>'):
            continue
        elif skip_to_end:
            if line.startswith('>>>>>>>'):
                skip_to_end = False
            continue
        else:
            lines.append(line)

    return '\n'.join(lines)

files = [
    'apps/web/app/routes/_app/pipeline.tsx',
    'apps/web/app/routes/_app/contacts/index.tsx',
    'apps/web/app/routes/_app/tasks.tsx',
    'apps/web/app/routes/_app/teams/index.tsx',
    'apps/web/app/routes/_app/training.tsx',
    'apps/web/app/components/ui/LayoutCards.tsx',
]

for file in files:
    path = Path(file)
    if path.exists():
        content = path.read_text(encoding='utf-8')
        content = remove_conflict_markers(content)
        path.write_text(content, encoding='utf-8')
        print(f"Fixed: {file}")

print("\nAll conflicts resolved!")
