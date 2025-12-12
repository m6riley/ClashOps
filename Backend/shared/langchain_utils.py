"""
LangChain utilities for building RAG (Retrieval-Augmented Generation) chains.

This module provides functions to build LangChain chains that combine
Pinecone vector retrieval with OpenAI chat models for context-aware responses.
"""
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from shared.pinecone_utils import index




embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """
    Chunk text into chunks.
    
    Args:
        text: The text to chunk
        chunk_size: The size of each chunk
        chunk_overlap: The overlap between chunks
    
    Returns:
        A list of chunks
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, 
        chunk_overlap=chunk_overlap)
    return text_splitter.split_text(text)


def build_chain(
    *,
    default_namespace: str = "",
    model: str = "gpt-5"
) -> object:
    """
    Build a LangChain RAG chain with optional vector retrieval.
    
    The chain supports multi-pass retrieval from multiple Pinecone namespaces
    and combines retrieved context with user input for LLM responses.
    
    Args:
        default_namespace: Default namespace for vector retrieval (default: "")
        model: OpenAI model name to use (default: "gpt-5")
    
    Returns:
        A LangChain chain that can be invoked with:
        {
            "system_instructions": str,
            "user_input": str,
            "retrievers": list[dict] | None  # Optional list of retriever configs
        }
    """
    # ---- LLM ----
    llm = ChatOpenAI(model=model, temperature=0)

    # ---- Prompt Template ----
    template = """
    {system_instructions}

    Context:
    {context}

    User Input:
    {user_input}

    Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    # ---- Format list[Document] → string ----
    def _format_docs(docs: list) -> str:
        """Format a list of documents into a single string."""
        return "\n\n".join(d.page_content for d in docs)

    # ---- MULTI-PASS RETRIEVAL LOGIC ----
    def _build_context(inputs: dict) -> str:
        """
        Build context string from multiple vector retrievers.
        
        Supports retrieval from multiple Pinecone namespaces with different
        configurations. Deduplicates results by page_content.
        
        Args:
            inputs: Dictionary containing "user_input" and optional "retrievers"
        
        Returns:
            Formatted context string, or empty string if no retrieval
        """
        all_docs = []
        user_input = inputs["user_input"]

        retriever_configs = inputs.get("retrievers", None)

        # Case 1: retrievers omitted entirely → treat as no retrieval
        if retriever_configs is None:
            return ""   # no context

        # Case 2: retrievers provided but empty list → also no retrieval
        if len(retriever_configs) == 0:
            return ""   # no context

        for cfg in retriever_configs:
            # namespace override?
            namespace = cfg.pop("namespace", default_namespace)

            # build vectorstore for this namespace
            vector_store = PineconeVectorStore(
                index=index,
                embedding=embedding_model,
                text_key="text",
                namespace=namespace
            )

            retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs=cfg
            )

            docs = retriever.invoke(user_input)
            all_docs.extend(docs)

        # Deduplicate by page_content
        seen = set()
        unique_docs = []
        for d in all_docs:
            if d.page_content not in seen:
                unique_docs.append(d)
                seen.add(d.page_content)

        return _format_docs(unique_docs)

    # ---- Chain ----
    chain = (
        {
            "context": _build_context,
            "user_input": lambda inputs: inputs["user_input"],
            "system_instructions": lambda inputs: inputs["system_instructions"],
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain