import asyncio
import edge_tts
import os

VOICE = "en-US-ChristopherNeural" # Deep, authoritative military commander
OUTPUT_DIR = r"C:\Users\İBO\.gemini\antigravity\scratch\sniper-playables\audio"

LINES = {
    "start.mp3": "Eagle One, you are in position. Identify the target and take the shot.",
    "target_hit.mp3": "Good shot! Target neutralized. Area is secure.",
    "headshot.mp3": "Flawless headshot! Clean kill, Eagle One.",
    "miss.mp3": "Shot missed! The target is alerted and fleeing, stay sharp!",
    "failed.mp3": "Mission failed. Abort and disengage immediately.",
    "hostage_hit.mp3": "Civilian down! Ceasefire! Mission compromised!"
}

async def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for filename, text in LINES.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating English military audio: {filename} -> '{text}'")
        communicate = edge_tts.Communicate(text, VOICE, rate="+6%", pitch="-2Hz")
        await communicate.save(filepath)
    print("All English tactical voiceovers generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate())
