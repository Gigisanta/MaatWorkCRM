import re

filepath = 'apps/web/app/routes/_app/contacts/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Fix import
content = content.replace('import React, { useState } from "react";', 'import React, { useState, useMemo } from "react";')

# Wrap columns in useMemo
# Replace `const columns = [` with `const columns = useMemo(() => [`
content = content.replace('const columns = [\n    {', 'const columns = useMemo(() => [\n    {')

# Find the end of the columns array and replace `  ];` with `  ], []);`
# Be careful to only replace the first occurrence after columns =
end_idx = content.find('  ];\n\n  if (isLoading && !contacts) {')
if end_idx != -1:
    content = content[:end_idx] + '  ], []);\n\n  if (isLoading && !contacts) {' + content[end_idx + len('  ];\n\n  if (isLoading && !contacts) {'):]

with open(filepath, 'w') as f:
    f.write(content)
