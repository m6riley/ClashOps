from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from shared.pinecone_utils import index



def build_chain(
    *,
    default_namespace: str = "",
    model: str = "gpt-5" # Default model is gpt-5
):

    # ---- LLM ----
    llm = ChatOpenAI(model=model, temperature=0)

    # ---- Embeddings for query embedding ----
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")


    # ---- Prompt ----
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
    def format_docs(docs):
        return "\n\n".join(d.page_content for d in docs)

    # ---- MULTI-PASS RETRIEVAL LOGIC ----
    def build_context(inputs):
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
                embedding=embeddings,
                text_key="text",
                namespace=namespace
            )

            retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs=cfg
            )

            docs = retriever.invoke(user_input)
            all_docs.extend(docs)

        # Deduplicate by page_content (optional)
        seen = set()
        unique_docs = []
        for d in all_docs:
            if d.page_content not in seen:
                unique_docs.append(d)
                seen.add(d.page_content)

        return format_docs(unique_docs)

    # ---- Chain ----
    chain = (
        {
            "context": build_context,
            "user_input": lambda inputs: inputs["user_input"],
            "system_instructions": lambda inputs: inputs["system_instructions"],
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain