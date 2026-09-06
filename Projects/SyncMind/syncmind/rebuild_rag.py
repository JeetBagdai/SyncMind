import os
import shutil
import asyncio
import httpx
import chromadb
from bs4 import BeautifulSoup
from document_processor import DocumentProcessor
from rag.search import add_document_to_rag

PDFS = [
    r"C:\Users\Jeet\Desktop\rti.pdf",
    r"C:\Users\Jeet\Desktop\compliance.pdf",
    r"C:\Users\Jeet\Desktop\phase 3 expansion.pdf",
    r"C:\Users\Jeet\Desktop\hazardous waste managment.pdf",
    r"C:\Users\Jeet\Desktop\MRPL_Sustainability_report_FY_2024-25.pdf",
    r"C:\Users\Jeet\Desktop\anual report 24-25.pdf"
]

URL = "https://www.mrpl.co.in/en/RecentResult"

async def main():
    print("Clearing old knowledge base via API...")
    db_dir = os.path.join("data", "chroma_db")
    client = chromadb.PersistentClient(path=db_dir)
    try:
        client.delete_collection("mrpl_sops")
        print("Deleted old collection.")
    except Exception as e:
        print(f"Collection didn't exist or error: {e}")

    os.makedirs(os.path.join("data", "uploads"), exist_ok=True)

    for pdf_path in PDFS:
        if os.path.exists(pdf_path):
            filename = os.path.basename(pdf_path)
            dest = os.path.join("data", "uploads", filename)
            
            print(f"Moving {filename} to uploads...")
            shutil.copy2(pdf_path, dest)
            
            print(f"Processing {filename}...")
            text = await DocumentProcessor.process_file(dest)
            
            if text and not text.startswith("Error"):
                add_document_to_rag(text, filename)
                print(f"Ingested {filename}.")
                os.remove(pdf_path)
            else:
                print(f"Failed to process {filename}: {text}")
        else:
            print(f"File not found: {pdf_path}")

    print(f"Fetching URL: {URL}")
    try:
        async with httpx.AsyncClient(verify=False) as client_http:
            resp = await client_http.get(URL)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            text = soup.get_text(separator="\n", strip=True)
            add_document_to_rag(text, "MRPL_Recent_Results_Webpage")
            print("Ingested webpage.")
    except Exception as e:
        print(f"Failed to fetch webpage: {e}")

    print("Knowledge base revamp complete!")

if __name__ == "__main__":
    asyncio.run(main())
