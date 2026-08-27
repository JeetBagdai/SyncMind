import os
import chromadb
from chromadb.utils import embedding_functions

def search_knowledge_base(query: str, n_results: int = 3) -> str:
    """
    Searches the local ChromaDB vector store for relevant knowledge base snippets.
    Returns a formatted string containing the retrieved chunks.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "data", "chroma_db")
    
    if not os.path.exists(db_dir):
        return "Error: Database not found. Please run the ingestion script first."
        
    try:
        client = chromadb.PersistentClient(path=db_dir)
        emb_fn = embedding_functions.DefaultEmbeddingFunction()
        collection = client.get_collection(name="mrpl_sops", embedding_function=emb_fn)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if not results['documents'][0]:
            return "No relevant documents found in the knowledge base."
            
        formatted_results = "Here are the most relevant excerpts from the organization's knowledge base:\n\n"
        
        for idx, (doc, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            source = meta.get('source', 'Unknown Document')
            formatted_results += f"--- Source: {source} ---\n{doc}\n\n"
            
        return formatted_results
        
    except Exception as e:
        return f"An error occurred while searching the knowledge base: {str(e)}"

if __name__ == "__main__":
    # Test the search function
    print("Testing search...")
    res = search_knowledge_base("What is the procedure for replacing the pressure valve A-403?")
    print(res)
