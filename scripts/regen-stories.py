#!/usr/bin/env python3
"""Regenerate all 44 historia-N.mp3 from current curriculum.ts."""
import asyncio, os, re, edge_tts

VOICE = "es-AR-ElenaNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio", "sofia")
CURRICULUM = os.path.join(ROOT, "src", "features", "session", "config", "curriculum.ts")

def load_stories():
    with open(CURRICULUM, "r", encoding="utf-8") as f:
        text = f.read()
    stories = {}
    pattern = re.compile(r'^\s*(\d+):\s*\{\s*\n\s*story5:\s*"((?:[^"\\]|\\.)*)"', re.M)
    for m in pattern.finditer(text):
        idx = int(m.group(1))
        raw = m.group(2).replace('\\"', '"').replace('\\n', ' ').replace("\\'", "'")
        stories[idx] = raw
    return stories

async def gen(name, text):
    out = os.path.join(OUT, f"{name}.mp3")
    try:
        c = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
        await c.save(out)
        return f"  ✓ {name}"
    except Exception as e:
        return f"  ✗ {name}: {e}"

async def main():
    stories = load_stories()
    print(f"Regenerating {len(stories)} story MP3s with {VOICE}...")
    for idx in sorted(stories.keys()):
        print(await gen(f"historia-{idx}", stories[idx]))
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
