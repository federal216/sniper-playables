import requests
import json
import os

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5-coder:latest"

PROMPT = """
You are a Tactical Game Mission Designer for a 2.5D Sniper Game.
Generate 1 brand new, creative sniper mission in JSON format.
The mission must include:
- title: Turkish title (e.g. "Bölüm X: VIP Yat Baskını")
- briefing: Tactical briefing in Turkish
- clue: Visual clue to spot the target (clothing, accessory) in Turkish
- reward: Integer money (e.g. 5000)
- distance: Integer meters (200 - 700)
- wind: Float between -8.0 and 8.0
- timeLimit: Seconds (15 - 40)
- target: object with x (200-800), y (200-500), speed (-1.5 to 1.5), type, clothes (hat, jacket, pants, accessory)
- civilians: array of 1-3 civilian objects with x, y, speed, clothes

Respond with ONLY the raw JSON object, no markdown, no explanation.
"""

def generate_mission():
    print(f"Ollama ({MODEL_NAME}) üzerinden yeni taktik görev üretiliyor...")
    payload = {
        "model": MODEL_NAME,
        "prompt": PROMPT,
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        data = response.json()
        mission_json = json.loads(data["response"])
        
        output_file = r"C:\Users\İBO\.gemini\antigravity\scratch\sniper-playables\generated_missions.json"
        
        existing = []
        if os.path.exists(output_file):
            with open(output_file, "r", encoding="utf-8") as f:
                try:
                    existing = json.load(f)
                except:
                    existing = []
        
        existing.append(mission_json)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)

        print("✅ Yeni görev başarıyla üretildi ve kaydedildi!")
        print(f"Başlık: {mission_json.get('title')}")
        print(f"İpucu: {mission_json.get('clue')}")
        print(f"Ödül: ${mission_json.get('reward')}")

    except Exception as e:
        print("Hata:", e)

if __name__ == "__main__":
    generate_mission()
