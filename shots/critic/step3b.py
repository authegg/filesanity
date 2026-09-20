import asyncio, json
from playwright.async_api import async_playwright
OUT="/home/arde/projects/authegg/filesanity/shots/critic"
BASE="https://filesanity.com"
T="/home/arde/projects/authegg/filesanity/tests/files/"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={"width":1440,"height":900})
        pg=await ctx.new_page()
        reqs=[]
        pg.on("request", lambda r: reqs.append(r.url))
        await pg.goto(BASE+"/", wait_until="networkidle"); await pg.wait_for_timeout(500)
        reqs.clear()
        await pg.set_input_files("input[type=file]", T+"photo.jpg")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f"{OUT}/c1440-home-ready.png")
        await pg.screenshot(path=f"{OUT}/c1440-home-ready-full.png", full_page=True)
        btn=pg.get_by_role("button", name="Remove all and download")
        async with pg.expect_download() as dl:
            await btn.click()
        d=await dl.value; await d.save_as(f"{OUT}/photo-clean.jpg")
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f"{OUT}/c1440-home-cleaned.png")
        print("home requests during read+clean:", [r for r in reqs if not r.startswith('blob:')])
        # batch
        await pg.goto(BASE+"/batch", wait_until="networkidle"); await pg.wait_for_timeout(500)
        reqs.clear()
        await pg.set_input_files("input[type=file][multiple]", [T+"photo.jpg", T+"offer.docx", T+"memo.pdf"])
        await pg.wait_for_timeout(2500)
        await pg.evaluate("document.querySelector('table')?.scrollIntoView({block:'center'})")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=f"{OUT}/c1440-batch-table.png")
        await pg.screenshot(path=f"{OUT}/c1440-batch-table-full.png", full_page=True)
        print("batch requests:", [r for r in reqs if not r.startswith('blob:')])
        # keyboard: policy checkboxes on batch
        await pg.goto(BASE+"/batch", wait_until="networkidle")
        cb=pg.locator("input[type=checkbox]").first
        await cb.focus(); await pg.wait_for_timeout(200)
        await cb.scroll_into_view_if_needed()
        info=await pg.evaluate("""()=>{const e=document.activeElement;const s=getComputedStyle(e);return {tag:e.tagName,outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor,shadow:s.boxShadow}}""")
        print("batch checkbox focus:", info)
        box=await cb.bounding_box()
        await pg.screenshot(path=f"{OUT}/c1440-batch-cbfocus.png", clip={"x":max(0,box['x']-40),"y":max(0,box['y']-40),"width":600,"height":120})
        # policy paragraph muted text contrast
        pol=await pg.evaluate("""()=>{const out=[];for(const el of document.querySelectorAll('section p, section span, section label, section li')){const s=getComputedStyle(el);if(parseFloat(s.fontSize)<=14 && el.textContent.trim().length>20) out.push({t:el.textContent.trim().slice(0,50),fs:s.fontSize,c:s.color,bg:(function bg(e){while(e){const b=getComputedStyle(e).backgroundColor;if(b&&b!=='rgba(0, 0, 0, 0)')return b;e=e.parentElement}return 'none'})(el)})} return out.slice(0,12)}""")
        print("batch small text:", json.dumps(pol,indent=0))
        # tool pages: pills focus + code line contrast
        for path in ["/cli","/api","/extension"]:
            await pg.goto(BASE+path, wait_until="networkidle")
            pills=await pg.evaluate("""()=>Array.from(document.querySelectorAll('a.pill,button.pill,.pill')).map(e=>{e.focus();const s=getComputedStyle(e);return {t:e.textContent.trim().slice(0,30),outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor,offset:s.outlineOffset}})""")
            print(path,"pill focus:",pills)
            code=await pg.evaluate("""()=>Array.from(document.querySelectorAll('code, pre, .mono, [class*=font-mono]')).slice(0,3).map(e=>{const s=getComputedStyle(e);return {t:e.textContent.trim().slice(0,30),fs:s.fontSize,c:s.color,ff:s.fontFamily.slice(0,30)}})""")
            small=await pg.evaluate("""()=>{const out=[];for(const el of document.querySelectorAll('main p, main span, main dd, main td')){const s=getComputedStyle(el);if(parseFloat(s.fontSize)<=14 && el.textContent.trim().length>12) out.push({t:el.textContent.trim().slice(0,40),fs:s.fontSize,c:s.color})} return out.slice(0,6)}""")
            print(path,"code:",code); print(path,"small:",small)
        # 320
        await ctx.close()
        ctx=await b.new_context(viewport={"width":320,"height":700})
        pg=await ctx.new_page()
        for path in ["/batch","/cli","/api"]:
            await pg.goto(BASE+path, wait_until="networkidle"); await pg.wait_for_timeout(400)
            sw=await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            print(path,"320 scrollWidth/clientWidth:",sw)
            await pg.screenshot(path=f"{OUT}/c320-{path.strip('/')}.png", full_page=True)
        await ctx.close()
        # reduced motion on blog
        ctx=await b.new_context(viewport={"width":1440,"height":900}, reduced_motion="reduce")
        pg=await ctx.new_page()
        await pg.goto(BASE+"/blog", wait_until="domcontentloaded")
        rm=await pg.evaluate("""()=>{const out=[];for(const el of document.querySelectorAll('body *')){const s=getComputedStyle(el);if(parseFloat(s.opacity)<1 || (s.transform!=='none' && s.transform!=='matrix(1, 0, 0, 1, 0, 0)')) out.push({tag:el.tagName,cls:String(el.className).slice(0,40),op:s.opacity,tr:s.transform})} return out.slice(0,10)}""")
        print("blog reduced-motion non-rest elements:", rm)
        await pg.screenshot(path=f"{OUT}/c1440-blog-rm.png")
        await ctx.close(); await b.close()
asyncio.run(main())
