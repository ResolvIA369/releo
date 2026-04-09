#!/usr/bin/env python3
"""Generate MP3s for new Argentine-Spanish word replacements."""

import asyncio
import os
import edge_tts

VOICE = "es-MX-DaliaNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "sofia")

NEW_WORDS = [
    ("media", "media"),
    ("abrigo", "abrigo"),
    ("piyama", "piyama"),
    ("pollera", "pollera"),
    ("marrón", "marrón"),
    ("violeta", "violeta"),
    ("autos", "autos"),
]

async def gen(name, text):
    out = os.path.join(OUTPUT_DIR, f"palabra-{name}.mp3")
    if os.path.exists(out):
        return f"  SKIP palabra-{name}"
    try:
        c = edge_tts.Communicate(text, VOICE, rate="-5%", pitch="+2Hz")
        await c.save(out)
        return f"  ✓ palabra-{name}"
    except Exception as e:
        return f"  ✗ palabra-{name}: {e}"

async def main():
    print(f"Generating {len(NEW_WORDS)} word MP3s...")
    for name, text in NEW_WORDS:
        print(await gen(name, text))
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
