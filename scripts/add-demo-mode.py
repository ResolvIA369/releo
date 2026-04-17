#!/usr/bin/env python3
"""Add isDemo support to all 9 game components (WordFlash already has it)."""
import re

BASE = "/home/cesar/proyectos/doman-v4/saas-factory/src/features/games/components"

GAMES = [
    {
        "file": "WordImageMatch.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// Game end",
        "condition": 'gamePhase === "playing" && !feedbackType && !!currentWord',
        "target_id": "currentWord?.id",
        "delay": 1500,
        "btn_attr": ("onClick={(e) => handleSelect(word, e)}", "data-word-id={word.id} onClick={(e) => handleSelect(word, e)}"),
    },
    {
        "file": "WordRain.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// Game end",
        "condition": 'gamePhase === "dropping" && !!targetWord && !feedbackType',
        "target_id": "targetWord?.id",
        "delay": 1000,
        "btn_attr": ("onClick={(e) => handleTap(drop, e)}", "data-word-id={drop.word.id} onClick={(e) => handleTap(drop, e)}"),
    },
    {
        "file": "WordFishing.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// Game end",
        "condition": 'gamePhase === "fishing" && !!target',
        "target_id": "target?.id",
        "delay": 1500,
        "btn_attr": ("onClick={(e) => handleTap(fish, e)}", "data-word-id={fish.word.id} onClick={(e) => handleTap(fish, e)}"),
    },
    {
        "file": "BitsReading.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// Game end",
        "condition": 'gamePhase === "popping" && !!target && !feedbackType',
        "target_id": "target?.id",
        "delay": 1500,
        "btn_attr": ("onClick={(e) => handlePop(bubble, e)}", "data-word-id={bubble.word.id} onClick={(e) => handlePop(bubble, e)}"),
    },
    {
        "file": "CategoryGame.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// Game end",
        "condition": 'gamePhase === "playing" && !feedbackType && !!currentWord',
        "target_id": None,
        "delay": 1500,
        "btn_attr": ("onClick={(e) => handleCategoryTap(cat, e)}", "data-category={cat} onClick={(e) => handleCategoryTap(cat, e)}"),
        "custom_action": """() => {
    const cat = currentWord?.categoryDisplay;
    if (!cat) return;
    const btn = document.querySelector(`[data-category="${cat}"]`) as HTMLElement;
    if (btn) btn.click();
  }""",
    },
    {
        "file": "MemoryCards.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// ─── Game end",
        "condition": 'gamePhase === "playing" && !feedbackType && placed.length < syllables.length',
        "target_id": None,
        "delay": 800,
        "btn_attr": ("onClick={(e) => handlePieceTap(piece, e)}", "data-piece-idx={piece.index} onClick={(e) => handlePieceTap(piece, e)}"),
        "custom_action": """() => {
    const nextIdx = placed.length;
    const btn = document.querySelector(`[data-piece-idx="${nextIdx}"]`) as HTMLElement;
    if (btn) btn.click();
  }""",
    },
    {
        "file": "BuildSentence.tsx",
        "import_after": "import { GameShell }",
        "props_old": "{ words, phase = 1, onComplete, onBack }",
        "props_new": "{ words, phase = 1, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// ─── Game end",
        "condition": 'gamePhase === "playing" && !feedbackType && !isAdvancing',
        "target_id": None,
        "delay": 800,
        "btn_attr": ("onClick={() => handleWordTap(i)}", "data-build-word={word} onClick={() => handleWordTap(i)}"),
        "custom_action": """() => {
    if (!currentSentence) return;
    const expected = currentSentence.words[placed.length];
    if (!expected) return;
    const btns = document.querySelectorAll("[data-build-word]");
    for (const b of btns) {
      if ((b as HTMLElement).dataset.buildWord === expected) { (b as HTMLElement).click(); break; }
    }
  }""",
    },
    {
        "file": "StoryReader.tsx",
        "import_after": "import { useGameState }",
        "props_old": "{ words, phase = 1, worldId, onComplete, onBack }",
        "props_new": "{ words, phase = 1, worldId, onComplete, onBack, isDemo = false }",
        "intro_add": 'isDemo={isDemo} ',
        "hook_anchor": "// ─── Auto-play",
        "condition": 'gamePhase === "reading" && !isSpeaking && !storyDone',
        "target_id": None,
        "delay": 500,
        "btn_attr": None,
        "custom_action": """() => {
    if (nextWord < story.words.length) readWordAt(nextWord);
  }""",
    },
]

for g in GAMES:
    path = f"{BASE}/{g['file']}"
    code = open(path).read()
    changed = False

    # 1. Add import if missing
    if "useDemoAutoplay" not in code:
        code = code.replace(
            g["import_after"],
            f'{g["import_after"]}\nimport {{ useDemoAutoplay }} from "../hooks/useDemoAutoplay";',
            1,
        )
        changed = True

    # 2. Update props
    if g["props_old"] != g["props_new"] and g["props_old"] in code:
        code = code.replace(g["props_old"], g["props_new"], 1)
        changed = True

    # 3. Add isDemo to GameIntro
    if g["intro_add"] and "isDemo={isDemo}" not in code:
        code = code.replace("onReady={() => setGamePhase", f'{g["intro_add"]}onReady={{() => setGamePhase')
        changed = True

    # 4. Add auto-play hook before anchor
    if "useDemoAutoplay(isDemo" not in code:
        if g.get("custom_action"):
            action = g["custom_action"]
        else:
            action = f"""() => {{
    const btn = document.querySelector(`[data-word-id="${{{g['target_id']}}}"]`) as HTMLElement;
    if (btn) btn.click();
  }}"""

        hook = f"""
  // Demo: auto-select correct answer
  useDemoAutoplay(isDemo, {g['condition']}, {action}, {g['delay']});

"""
        code = code.replace(f"  {g['hook_anchor']}", f"{hook}  {g['hook_anchor']}", 1)
        changed = True

    # 5. Add data attribute to buttons
    if g["btn_attr"] and g["btn_attr"][0] in code and g["btn_attr"][1] not in code:
        code = code.replace(g["btn_attr"][0], g["btn_attr"][1])
        changed = True

    if changed:
        open(path, "w").write(code)
        print(f"✓ {g['file']}")
    else:
        print(f"  {g['file']} (no changes needed)")
