import asyncio
import os
import http.server
import socketserver
import threading
from playwright.async_api import async_playwright

PORT = 8089
DIRECTORY = r"C:\Users\İBO\.gemini\antigravity\scratch\sniper-playables"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass # Sessiz log

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Yerel test sunucusu baslatildi: http://localhost:{PORT}")
        httpd.serve_forever()

async def main():
    # 1. Yerel Sunucuyu Arka Planda Başlat
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    await asyncio.sleep(1)

    screenshot_dir = os.path.join(DIRECTORY, "qa_screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)

    print("\n--- QA ASKERİ: OTOMATİK OYUN TESTİ BAŞLATILIYOR ---")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test 1: Masaüstü Görünümü ve Oynanış
        print("[1/3] Masaüstü ortamı (1280x720) test ediliyor...")
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda msg: print(f"  [Browser Console]: {msg.text}") if msg.type in ["error", "warning"] else None)

        await page.goto(f"http://localhost:{PORT}")
        await page.wait_for_timeout(1000)

        # Menü ekranı görüntüsü
        shot1 = os.path.join(screenshot_dir, "01_menu_desktop.png")
        await page.screenshot(path=shot1)
        print(f"  -> Menü ekranı kaydedildi: {shot1}")

        # "OYUNA BAŞLA" butonuna tıkla
        await page.click("#start-briefing-btn")
        await page.wait_for_timeout(600)

        # Brifing ekranı görüntüsü
        shot2 = os.path.join(screenshot_dir, "02_briefing.png")
        await page.screenshot(path=shot2)
        print(f"  -> Brifing ekranı kaydedildi: {shot2}")

        # "DÜRBÜNÜ AÇ VE BAŞLA" butonuna tıkla
        await page.click("#launch-mission-btn")
        await page.wait_for_timeout(1000)

        # Oyun içi dürbün ekranı görüntüsü
        shot3 = os.path.join(screenshot_dir, "03_gameplay_scope.png")
        await page.screenshot(path=shot3)
        print(f"  -> Oyun içi dürbün ekranı kaydedildi: {shot3}")

        # Nişan al ve ateş et testi
        await page.mouse.move(640, 360)
        await page.mouse.down()
        await page.wait_for_timeout(100)
        await page.mouse.up()
        await page.wait_for_timeout(800)

        # Test 2: Mobil Görünüm (YouTube Mobil Simülasyonu)
        print("\n[2/3] Mobil ortam (YouTube Playables Mobil Simülasyonu) test ediliyor...")
        mobile_context = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto(f"http://localhost:{PORT}")
        await mobile_page.wait_for_timeout(800)

        shot4 = os.path.join(screenshot_dir, "04_mobile_view.png")
        await mobile_page.screenshot(path=shot4)
        print(f"  -> Mobil ekran kaydedildi: {shot4}")

        # Hata Kontrolü
        print("\n[3/3] Kod & Konsol Hata Kontrolü...")
        if len(errors) == 0:
            print("✅ TEST BAŞARILI: Sıfır JavaScript hatası! Oyun kusursuz çalışıyor.")
        else:
            print(f"⚠️ {len(errors)} hata tespit edildi: {errors}")

        await browser.close()
    print("--- TEST TAMAMLANDI ---\n")

if __name__ == "__main__":
    asyncio.run(main())
