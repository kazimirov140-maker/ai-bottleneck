import json
import os

path = r'C:\Users\kazim\.gemini\antigravity-ide\brain\0f704e9a-b33b-45cb-bc99-a9d932527eb1\.system_generated\logs\transcript_full.jsonl'
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') in ['PLANNER_RESPONSE', 'VIEW_FILE']:
                if 'page.tsx' in str(data) or 'package.json' in str(data):
                    print("Found relevant tool call:", str(data)[:500])
        except Exception as e:
            pass
