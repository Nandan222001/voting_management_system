import os
import re

directory = r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src'
patterns = [
    (re.compile(re.escape('#1066B1'), re.IGNORECASE), 'rgb(16 102 177)'),
    (re.compile(re.escape('#1B4FD8'), re.IGNORECASE), 'rgb(16 102 177)'),
    (re.compile(re.escape('#0051D5'), re.IGNORECASE), 'rgb(16 102 177)')
]

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.html')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in patterns:
                new_content = pattern.sub(replacement, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated: {path}')
