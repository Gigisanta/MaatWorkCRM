import re
import glob

def resolve_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We'll just take the HEAD content
    # Handle the cases with >>>>>>> alone or ======= alone if regex fails.
    # We will just do the same clean-up pattern as before, but a bit more robustly

    # Clean up standalone merge markers that got left behind
    lines = content.split('\n')
    cleaned = []
    skip = False
    for i, line in enumerate(lines):
        if line.startswith('<<<<<<<'):
            skip = False # we keep HEAD
            continue
        if line.startswith('======='):
            skip = True # skip the remote part
            continue
        if line.startswith('>>>>>>>'):
            skip = False # resume
            continue

        if not skip:
            cleaned.append(line)

    new_content = '\n'.join(cleaned)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Cleaned standalone markers in {filepath}")

files = glob.glob('apps/web/app/**/*.tsx', recursive=True) + glob.glob('apps/web/app/**/*.ts', recursive=True)
for f in files:
    resolve_file(f)
