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
import logging




embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")


def chunk_text(text: str, chunk_size: int, chunk_overlap: int, separators: list[str]) -> list[str]:
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
        chunk_overlap=chunk_overlap,
        separators=separators)
    return text_splitter.split_text(text)


def build_chain(
    *,
    default_namespace: str = "__default__",
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
        configurations. Groups retrieved text by namespace and formats as:
        "NamespaceName:\n*text1\n*text2..."
        
        Args:
            inputs: Dictionary containing "user_input" and optional "retrievers"
        
        Returns:
            Formatted context string organized by namespace, or empty string if no retrieval
        """
        user_input = inputs["user_input"]
        retriever_configs = inputs.get("retrievers", None)

        # Case 1: retrievers omitted entirely → treat as no retrieval
        if retriever_configs is None:
            return ""   # no context

        # Case 2: retrievers provided but empty list → also no retrieval
        if len(retriever_configs) == 0:
            return ""   # no context

        # Dictionary to store docs grouped by namespace
        namespace_docs = {}
        # Dictionary to track seen texts per namespace for deduplication
        namespace_seen = {}

        for cfg in retriever_configs:
            # Create a copy of cfg to avoid mutating the original
            search_kwargs = cfg.copy()
            
            # Extract desired namespace filter from metadata.namespace or fall back to namespace field
            metadata = search_kwargs.pop("metadata", {})
            filter_namespace = metadata.get("namespace") if isinstance(metadata, dict) else None
            if filter_namespace is None:
                filter_namespace = search_kwargs.pop("namespace", default_namespace)

            # Always use "__default__" as the actual Pinecone namespace
            # Filter by metadata.namespace field instead
            # Merge with existing filter if present
            if "filter" not in search_kwargs:
                search_kwargs["filter"] = {}
            elif not isinstance(search_kwargs["filter"], dict):
                # If filter exists but isn't a dict, create a new dict
                search_kwargs["filter"] = {}
            
            # Add metadata filter for namespace field (merge with existing filters)
            search_kwargs["filter"]["namespace"] = {"$eq": filter_namespace}

            # build vectorstore using "__default__" namespace
            vector_store = PineconeVectorStore(
                index=index,
                embedding=embedding_model,
                text_key="text",
                namespace="__default__"
            )

            retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs=search_kwargs
            )

            docs = retriever.invoke(user_input)
            logging.info(f"Facts for {filter_namespace}: {docs}")
            
            # Initialize namespace list and seen set if not exists
            if filter_namespace not in namespace_docs:
                namespace_docs[filter_namespace] = []
                namespace_seen[filter_namespace] = set()
            
            # Add docs to namespace group (deduplicate by page_content within namespace)
            for doc in docs:
                if doc.page_content not in namespace_seen[filter_namespace]:
                    namespace_docs[filter_namespace].append(doc.page_content)
                    namespace_seen[filter_namespace].add(doc.page_content)

        # Format output: "Namespace:\n*text1\n*text2..."
        context_parts = []
        for namespace, texts in namespace_docs.items():
            if texts:  # Only add if there are texts
                namespace_header = f"{namespace}:"
                formatted_texts = "\n".join(f"*{text}" for text in texts)
                context_parts.append(f"{namespace_header}\n{formatted_texts}")

        return "\n\n".join(context_parts)

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