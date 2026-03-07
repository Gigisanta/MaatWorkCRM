import re

filepath = 'apps/web/app/routes/_app/contacts/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# First, properly resolve all conflict blocks by picking the HEAD version
pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [^\n]+\n', re.DOTALL)
content = pattern.sub(r'\1\n', content)

# Second, add useMemo import if it's not there
if 'useMemo' not in content:
    content = content.replace('import React, { useState } from "react";', 'import React, { useState, useMemo } from "react";')

# Third, wrap columns
content = content.replace('const columns = [\n    {', 'const columns = useMemo(() => [\n    {')

# End wrap
end_idx = content.find('  ];\n\n  if (isLoading && !contacts) {')
if end_idx != -1:
    content = content[:end_idx] + '  ], []);\n\n  if (isLoading && !contacts) {' + content[end_idx + len('  ];\n\n  if (isLoading && !contacts) {'):]

with open(filepath, 'w') as f:
    f.write(content)

print("Rewrite done")
