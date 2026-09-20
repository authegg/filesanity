import asyncio, sys
from playwright.async_api import async_playwright
OUT="/home/arde/projects/authegg/filesanity/shots/critic"
BASE="https://filesanity.com"
PAGES=["/","/batch","/pricing","/cli","/api","/extension","/blog","/faq","/security","/about","/contact","/privacy"]
async def shoot(browser, name, vp, pages):
    ctx=await browser.new_context(viewport=vp)
    pg=await ctx.new_page()
    for path in pages:
        await pg.goto(BASE+path, wait_until="networkidle")
        await pg.wait_for_timeout(900)
        slug=path.strip("/").replace("/","-") or "home"
        await pg.screenshot(path=f"{OUT}/{name}-{slug}.png")
    # first blog post
    await pg.goto(BASE+"/blog", wait_until="networkidle")
    href=await pg.evaluate("Array.from(document.querySelectorAll('a[href^=\"/blog/\"]')).map(a=>a.getAttribute('href'))[0]")
    print(name,"post",href)
    await pg.goto(BASE+href, wait_until="networkidle"); await pg.wait_for_timeout(900)
    await pg.screenshot(path=f"{OUT}/{name}-post.png")
    await ctx.close()
async def main():
    async with async_playwright() as p:
        c=await p.chromium.launch()
        await shoot(c,"c1440",{"width":1440,"height":900},PAGES)
        await shoot(c,"c390",{"width":390,"height":844},PAGES)
        await c.close()
        f=await p.firefox.launch()
        await shoot(f,"ff1917",{"width":1917,"height":870},PAGES)
        await f.close()
asyncio.run(main())
