import asyncio
from playwright.async_api import async_playwright
from rag.search import add_document_to_rag

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('https://www.mrpl.co.in/en/RecentResult', wait_until='networkidle')
        text = await page.evaluate('document.body.innerText')
        add_document_to_rag(text, "MRPL_Recent_Results_Webpage")
        print("Successfully ingested the webpage into RAG using Playwright.")
        await browser.close()

asyncio.run(run())
