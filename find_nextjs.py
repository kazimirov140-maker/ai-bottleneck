import json
import os

brain_dir = r'C:\Users\kazim\.gemini\antigravity-ide\brain'
found = False
for root, dirs, files in os.walk(brain_dir):
    for f_name in files:
        if f_name == 'transcript_full.jsonl':
            path = os.path.join(root, f_name)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if 'page.tsx' in line or 'package.json' in line or 'Next.js' in line:
                            # Try parsing to see what it is
                            try:
                                data = json.loads(line)
                                if data.get('type') in ['PLANNER_RESPONSE', 'VIEW_FILE']:
                                    if 'page.tsx' in str(data) or 'package.json' in str(data):
                                        print(f"FOUND Next.js related content in {path}")
                                        found = True
                                        break
                            except:
                                pass
                if found: break
            except:
                pass
    if found: break
if not found:
    print("No Next.js files found in history.")
