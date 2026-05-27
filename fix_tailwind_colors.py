import os
import re

def replace_spaces_in_rgb(directory):
    # Regex to find [something rgb(16 102 177) something]
    # We want to catch instances like bg-[rgb(16 102 177)] or focus:ring-[rgb(16 102 177)]/5
    
    # Pattern for rgb(16 102 177) inside []
    pattern1 = re.compile(r'\[([^\]]*?)rgb\(16 102 177\)([^\]]*?)\]')
    # Pattern for rgb(12 85 148) inside []
    pattern2 = re.compile(r'\[([^\]]*?)rgb\(12 85 148\)([^\]]*?)\]')

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.js', '.css', '.html')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                # Replace pattern1
                while True:
                    match = pattern1.search(new_content)
                    if not match:
                        break
                    start, end = match.span()
                    matched_str = new_content[start:end]
                    replaced_str = matched_str.replace('rgb(16 102 177)', 'rgb(16_102_177)')
                    new_content = new_content[:start] + replaced_str + new_content[end:]
                
                # Replace pattern2
                while True:
                    match = pattern2.search(new_content)
                    if not match:
                        break
                    start, end = match.span()
                    matched_str = new_content[start:end]
                    replaced_str = matched_str.replace('rgb(12 85 148)', 'rgb(12_85_148)')
                    new_content = new_content[:start] + replaced_str + new_content[end:]
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")

if __name__ == "__main__":
    replace_spaces_in_rgb('frontend/src')
