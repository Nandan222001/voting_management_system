import os
import re

files_to_fix = [
    r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src\pages\DashboardPage.jsx',
    r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src\components\layout\Sidebar.jsx',
    r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src\pages\ElectionsPage.jsx',
    r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src\pages\CandidatesPage.jsx',
    r'C:\Users\ADMIN\OneDrive\Desktop\projects\voting_management_system\frontend\src\pages\TenantsPage.jsx'
]

brand_color = 'rgb(16 102 177)'
brand_color_alt = '[rgb(16_102_177)]'

replacements = [
    (r'blue-500', brand_color_alt),
    (r'blue-600', brand_color_alt),
    (r'indigo-500', brand_color_alt),
    (r'indigo-600', brand_color_alt),
    (r'blue-50', '[#e6edfb]'),
    (r'indigo-50', '[#e6edfb]'),
    (r'blue-100', '[rgb(16_102_177)]/10'),
    (r'indigo-100', '[rgb(16_102_177)]/10'),
    (r'blue-200', '[rgb(16_102_177)]/20'),
    (r'indigo-200', '[rgb(16_102_177)]/20'),
    (r'indigo-300', '[rgb(16_102_177)]/30'),
    (r'shadow-indigo-200', 'shadow-[rgb(16_102_177)]/20'),
    (r'shadow-blue-200', 'shadow-[rgb(16_102_177)]/20'),
]

for path in files_to_fix:
    if not os.path.exists(path):
        print(f"Skipping {path}, not found.")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # First, let's unify rgb(16 102 177) to [rgb(16_102_177)] for consistency in Tailwind classes
    # But only if it's inside a className-like string
    
    for old, new in replacements:
        # Use regex to replace only when it looks like a tailwind class (e.g. bg-blue-500, text-blue-500, etc.)
        new_content = re.sub(r'(\b)(bg|text|border|ring|shadow|hover:bg|hover:text|hover:border|group-hover:bg|focus:ring|focus:border)-' + old + r'(\b)', r'\1\2-' + new + r'\3', new_content)

    # Also handle things like color="indigo" or color="blue" if they are props
    new_content = new_content.replace('color="indigo"', 'color="blue"') # Both map to brand color in StatsCard
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated: {path}')
    else:
        print(f'No changes for: {path}')
