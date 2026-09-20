import asyncio
from playwright.async_api import async_playwright
from PIL import Image
OUT="/home/arde/projects/authegg/filesanity/shots/critic"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={"width":1440,"height":900})
        await pg.goto("https://filesanity.com/",wait_until="networkidle")
        await pg.wait_for_timeout(1500)
        h=await pg.evaluate("document.body.scrollHeight")
        for y in range(0,h,600):
            await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(120)
        await pg.evaluate("window.scrollTo(0,document.body.scrollHeight)"); await pg.wait_for_timeout(800)
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f"{OUT}/home-1440-full.png",full_page=True)
        await b.close()
    im=Image.open(f"{OUT}/home-1440-full.png")
    w,h=im.size
    im.resize((300,int(h*300/w)),Image.LANCZOS).save(f"{OUT}/home-1440-full-300.png")
    print(w,h)
asyncio.run(main())
