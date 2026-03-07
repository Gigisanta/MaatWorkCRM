import re
import glob

def resolve_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if '<<<<<<<' not in content and '=======' not in content and '>>>>>>>' not in content:
        return

    # We'll just take the HEAD content
    # A simple regex to replace the conflict markers and keep HEAD
    pattern = re.compile(r'<<<<<<<.*?\n(.*?)\n=======\n.*?\n>>>>>>>.*?\n', re.DOTALL)

    new_content = pattern.sub(r'\1\n', content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Resolved conflicts in {filepath}")

files = glob.glob('apps/web/app/**/*.tsx', recursive=True) + glob.glob('apps/web/app/**/*.ts', recursive=True)
for f in files:
    resolve_file(f)
