import chromadb
from chromadb.utils import embedding_functions
import os
import uuid

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(text[start:end])
        if end == text_len:
            break
        start = end - overlap
    return chunks

def add_document_to_rag(text: str, filename: str, chat_id: str = None):
    """
    Dynamically adds a processed document to the RAG knowledge base.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "data", "chroma_db")
    os.makedirs(db_dir, exist_ok=True)
    
    try:
        client = chromadb.PersistentClient(path=db_dir)
        emb_fn = embedding_functions.DefaultEmbeddingFunction()
        collection = client.get_or_create_collection(name="mrpl_sops", embedding_function=emb_fn)
        
        chunks = chunk_text(text, chunk_size=600, overlap=100)
        documents = []
        metadatas = []
        ids = []
        
        base_id = str(uuid.uuid4())[:8]
        
        for i, chunk in enumerate(chunks):
            # Crucial: Prepend the filename so similarity search easily finds it if the LLM queries by filename!
            enriched_chunk = f"Source Document: {filename}\nContent:\n{chunk}"
            documents.append(enriched_chunk)
            meta = {"source": filename}
            if chat_id:
                meta["chat_id"] = chat_id
            metadatas.append(meta)
            ids.append(f"doc_{base_id}_{i}")
            
        if documents:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"Ingested {len(documents)} chunks from {filename} into RAG.")
    except Exception as e:
        print(f"RAG Ingestion Error: {e}")

def search_knowledge_base(query: str, n_results: int = 5, chat_id: str = None) -> str:
    """
    Searches the RAG database for relevant context.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "data", "chroma_db")
    
    if not os.path.exists(db_dir):
        return "Knowledge base not initialized or empty."
        
    try:
        client = chromadb.PersistentClient(path=db_dir)
        emb_fn = embedding_functions.DefaultEmbeddingFunction()
        collection = client.get_or_create_collection(name="mrpl_sops", embedding_function=emb_fn)
        
        # If the query exactly matches a known filename (e.g. sample_report.pdf), we could use 'where'
        # but the safest is just to fetch more results and rely on the enriched chunk texts.
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if not results['documents'] or not results['documents'][0]:
            return "No relevant documents found in the knowledge base."
            
        formatted_results = "Here are the most relevant excerpts from the organization's knowledge base:\n\n"
        
        for idx, (doc, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            formatted_results += f"--- Source: {meta.get('source', 'Unknown')} ---\n"
            formatted_results += f"{doc}\n\n"
            
        return formatted_results.strip()
    except Exception as e:
        return f"Error accessing knowledge base: {e}"
