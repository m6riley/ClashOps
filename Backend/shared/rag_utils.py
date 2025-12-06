def card_to_namespace(card: str):
    return (
        "evolved_"
        + card.lower()
        .replace(" ", "_")
        .replace("[", "")
        .replace("]", "")
    )

def build_context(matches):
    return [
        {
            "Name": m.metadata.get("troop"),
            "Fact": m.metadata.get("text")
        }
        for m in matches
    ]
