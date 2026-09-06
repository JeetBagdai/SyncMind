import os
import base64
import asyncio
from io import BytesIO
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
from router import call_llm

class DocumentProcessor:
    @staticmethod
    async def process_pdf(file_path: str) -> str:
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error in pdfplumber extraction: {e}")
            
        if len(text.strip()) < 100:
            print(f"Document {file_path} seems to be scanned (extracted {len(text)} chars). Falling back to OCR...")
            return await DocumentProcessor.process_scanned_pdf(file_path)
            
        return text.strip()

    @staticmethod
    async def process_scanned_pdf(file_path: str) -> str:
        text = ""
        try:
            # Note: requires poppler installed and in PATH
            images = convert_from_path(file_path)
            for i, img in enumerate(images):
                print(f"OCRing page {i+1}/{len(images)} of {file_path}")
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                prompt = "Extract all text, numbers, labels, and technical annotations from this engineering document image. Return structured text."
                messages = [{"role": "user", "content": prompt, "images": [img_b64]}]
                
                res = await call_llm(messages, use_vision=True)
                text += f"--- Page {i+1} ---\n{res}\n\n"
        except Exception as e:
            text += f"Error during scanned PDF OCR: {e}"
        return text.strip()
        
    @staticmethod
    async def process_image(file_path: str) -> str:
        try:
            with Image.open(file_path) as img:
                buffered = BytesIO()
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.save(buffered, format="JPEG")
                img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
            prompt = "Extract all text, numbers, labels, and technical annotations from this engineering document image. Return structured text."
            messages = [{"role": "user", "content": prompt, "images": [img_b64]}]
            return await call_llm(messages, use_vision=True)
        except Exception as e:
            return f"Error during image OCR: {e}"
        
    @staticmethod
    async def process_file(file_path: str) -> str:
        sidecar = file_path + ".txt"
        if os.path.exists(sidecar):
            with open(sidecar, "r", encoding="utf-8") as f:
                return f.read()
                
        ext = file_path.lower().split('.')[-1]
        text = ""
        if ext == "pdf":
            text = await DocumentProcessor.process_pdf(file_path)
        elif ext in ["png", "jpg", "jpeg", "tiff", "bmp"]:
            text = await DocumentProcessor.process_image(file_path)
        elif ext in ["csv", "txt", "md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        else:
            text = f"Unsupported extraction format for {ext}"
            
        # Cache it
        try:
            with open(sidecar, "w", encoding="utf-8") as f:
                f.write(text)
        except Exception as e:
            print(f"Failed to write sidecar cache: {e}")
            
        return text
