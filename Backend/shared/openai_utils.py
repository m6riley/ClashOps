import os
from openai import AsyncOpenAI

OPENAI_KEY = os.getenv("OPENAI_KEY")
EMBEDDING_MODEL = "text-embedding-3-large"

client = AsyncOpenAI(api_key=OPENAI_KEY)

async def run_chat(model: str, system: str, user: str, max_tokens=6000):
    result = await client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        max_completion_tokens=max_tokens
    )
    return result.choices[0].message.content

async def embed(text: str):
    result = await client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return result.data[0].embedding
