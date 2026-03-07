#!/usr/bin/env python3
import re
import sys
from pathlib import Path

CONFLICT_FILES = [
    "apps/web/app/routes/_app/dashboard.tsx",
    "apps/web/app/routes/_app/pipeline.tsx",
    "apps/web/app/routes/_app/contacts/index.tsx",
    "apps/web/app/components/layout/Sidebar.tsx",
    "apps/web/app/components/ui/CommandPalette.tsx",
    "apps/web/app/components/ui/Table.tsx",
]

def resolve_conflict(content: str) -> str:
    parts = re.split(
        r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>>',
        content,
        flags=re.DOTALL
    )

    if len(parts) == 1:
        return content

    result = parts[0]
    for i in range(0, len(parts) - 1, 3):
        head_version = parts[i + 1]
        other_version = parts[i + 2]
        tail = parts[i + 3] if i + 3 < len(parts) else ""

        head_score = 0
        other_score = 0

        if '"' in other_version and "'" in head_version:
            other_score += 1
        elif "'" in other_version and '"' in head_version:
            head_score += 1

        other_len = len(other_version.strip())
        head_len = len(head_version.strip())
        if other_len > head_len:
            other_score += 1
        elif head_len > other_len:
            head_score += 1

        winner = other_version if other_score > head_score else head_version
        winner = winner.replace("'", '"')

        result += winner + tail

    return result


def normalize_quotes(content: str) -> str:
    lines = content.split('\n')
    result = []

    for line in lines:
        if line.strip().startswith('//'):
            result.append(line)
            continue
        if line.strip().startswith('*'):
            result.append(line)
            continue

        line = re.sub(r"=(\s+)'([^']+)'", r'="\1\2"', line)

        result.append(line)

    return '\n'.join(result)


def process_file(filepath: Path) -> None:
    print(f"Processing: {filepath}")

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        print(f"  ERROR: {e}")
        return

    original_content = content
    content = resolve_conflict(content)
    content = normalize_quotes(content)

    if '<<<<<<<' in content:
        print(f"  WARNING: Conflict markers still present!")
        return

    if content != original_content:
        try:
            filepath.write_text(content, encoding='utf-8')
            print(f"  ✓ Resolved")
        except Exception as e:
            print(f"  ERROR: {e}")
    else:
        print(f"  No changes needed")


def main():
    print("=" * 60)
    print("Resolving Git Merge Conflicts")
    print("=" * 60)
    print()

    for file_path in CONFLICT_FILES:
        path = Path(file_path)
        if path.exists():
            process_file(path)
        else:
            print(f"File not found: {file_path}")

    print()
    print("=" * 60)
    print("Complete")
    print("=" * 60)


if __name__ == "__main__":
    main()
