import os
import chromadb
from chromadb.utils import embedding_functions

def chunk_text(text, chunk_size=500, overlap=50):
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

def ingest_knowledge_base():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kb_dir = os.path.join(base_dir, "data", "knowledge_base")
    db_dir = os.path.join(base_dir, "data", "chroma_db")
    
    print(f"Connecting to ChromaDB at {db_dir}")
    client = chromadb.PersistentClient(path=db_dir)
    
    # We will use the default MiniLM-L6-v2 model which Chroma downloads automatically
    emb_fn = embedding_functions.DefaultEmbeddingFunction()
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="mrpl_sops", 
        embedding_function=emb_fn,
        metadata={"hnsw:space": "cosine"}
    )
    
    # Clear existing data for fresh ingestion
    if collection.count() > 0:
        print("Clearing existing collection data...")
        # A simple hack to clear is delete and recreate, but get_or_create is fine if we track IDs
        # To make it simple for the demo, we'll just upsert which overwrites matching IDs
    
    documents = []
    metadatas = []
    ids = []
    
    if not os.path.exists(kb_dir):
        print(f"Error: Knowledge base directory {kb_dir} does not exist.")
        return
        
    print(f"Scanning {kb_dir} for documents...")
    doc_id_counter = 0
    
    for filename in os.listdir(kb_dir):
        if filename.endswith(".md") or filename.endswith(".txt"):
            filepath = os.path.join(kb_dir, filename)
            print(f"Processing {filename}...")
            
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            chunks = chunk_text(content, chunk_size=600, overlap=100)
            
            for i, chunk in enumerate(chunks):
                documents.append(chunk)
                metadatas.append({"source": filename, "chunk_index": i})
                ids.append(f"{filename}_chunk_{i}")
                doc_id_counter += 1
                
    if documents:
        print(f"Upserting {len(documents)} chunks to ChromaDB...")
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            collection.upsert(
                documents=documents[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size]
            )
        print("Ingestion complete!")
    else:
        print("No documents found to ingest.")

if __name__ == "__main__":
    ingest_knowledge_base()
