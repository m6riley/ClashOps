from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from shared.openai_utils import OPENAI_KEY

_llm = ChatOpenAI(
    model = "gpt-5", 
    api_key = OPENAI_KEY,
    temperature = 0,
    max_completion_tokens = 6000,
    model_kwargs = {
        "response_format": {"type": "json_object"}
    }
    )
_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "{system_input}"),
        ("user", "{user_input}")
    ]
)

_chain = _prompt | _llm 

def send_chat(system_input: str, user_input: str):
    return _chain.invoke(
        {
            "system_input": system_input,
            "user_input": user_input
        }
    )