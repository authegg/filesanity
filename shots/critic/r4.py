import asyncio, re
from playwright.async_api import async_playwright
OUT="/home/arde/projects/authegg/filesanity/shots/critic"
BASE="https://filesanity.com"; T="/home/arde/projects/authegg/filesanity/tests/files/photo.jpg"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={"width":1440,"height":900}); pg=await ctx.new_page()
        for path in ["/batch","/cli","/api","/extension","/blog","/blog/what-a-jpeg-carries","/contact","/privacy","/terms","/about"]:
            await pg.goto(BASE+path+"?r4", wait_until="networkidle"); await pg.wait_for_timeout(700)
            slug=path.strip("/").replace("/","-")
            await pg.screenshot(path=f"{OUT}/r4-{slug}.png")
            await pg.screenshot(path=f"{OUT}/r4-{slug}-full.png", full_page=True)
            eyes=await pg.evaluate("Array.from(document.querySelectorAll('.eyebrow,.eyebrow-accent,[class*=eyebrow]')).map(e=>e.textContent.trim())")
            footer=await pg.evaluate("document.querySelectorAll('footer ul').length")
            lede=await pg.evaluate("document.querySelector('h1')?.parentElement?.innerText.slice(0,300)")
            txt=await pg.evaluate("document.body.innerText")
            flags=[w for w in ['client to','src/content','before launch','Client to supply','Nothing is uploaded','nothing phoned home','no upload'] if w.lower() in txt.lower()]
            print(path,"| eyebrows:",eyes,"| footer uls:",footer,"| flags:",flags)
            print("   lede:",lede.replace("\n"," / ") if lede else None)
        await pg.goto(BASE+"/?r4", wait_until="networkidle")
        closer=await pg.evaluate("Array.from(document.querySelectorAll('section')).map(s=>s.innerText).filter(t=>/Send the file/.test(t))[0]")
        print("home closer:",closer)
        await pg.set_input_files("input[type=file]", T); await pg.wait_for_timeout(1500)
        rows=await pg.evaluate("Array.from(document.querySelectorAll('tbody tr')).slice(0,14).map(r=>r.innerText.replace(/\\t+/g,' | '))")
        print("\n".join(rows))
        await pg.screenshot(path=f"{OUT}/r4-home-ready.png")
        await ctx.close(); await b.close()
asyncio.run(main())
