import asyncio
import edge_tts
import os

VOICE = "tr-TR-AhmetNeural"
OUTPUT_DIR = r"C:\Users\İBO\.gemini\antigravity\scratch\sniper-playables\audio"

LINES = {
    "start.mp3": "Kartal bir, hedef bölgesindesin. Hedefi tespit et ve atış yap.",
    "target_hit.mp3": "Harika atış! Hedef etkisiz hale getirildi.",
    "headshot.mp3": "Kusursuz! Tam kafadan vuruş!",
    "miss.mp3": "Atış ıska geçti! Hedef alarma geçti, dikkatli ol!",
    "failed.mp3": "Görev başarısız! Bölgeden derhal çekil.",
    "hostage_hit.mp3": "Sivili vurdun! Ateşkes, görev iptal!"
}

async def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for filename, text in LINES.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"Ses üretiliyor: {filename} -> '{text}'")
        # rate='+5%' for military urgency, pitch='-2Hz' for deep military commander tone
        communicate = edge_tts.Communicate(text, VOICE, rate="+8%", pitch="-3Hz")
        await communicate.save(filepath)
    print("Tüm sesler başarıyla üretildi!")

if __name__ == "__main__":
    asyncio.run(generate())
