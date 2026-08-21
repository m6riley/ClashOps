import csv
import json
import re
import time
from pathlib import Path

import requests

CARD_DECKS_BASE_URL = "https://royaletracker.gg/best-decks/with"
TAG_DECKS_BASE_URL = "https://royaletracker.gg/decks"
CARDS_CSV_PATH = Path(__file__).with_name("cards.csv")
FEATURES_CSV_PATH = Path(__file__).with_name("features.csv")
JSON_OUTPUT_PATH = Path(__file__).with_name("royale-tracker-decks.json")
CSV_OUTPUT_PATH = Path(__file__).with_name("royale-tracker-decks.csv")

TAG_CARD = "Card"

REQUEST_DELAY_SECONDS = 0.35

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

RSC_HEADERS = {
    **HEADERS,
    "Accept": "text/x-component",
    "RSC": "1",
}


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"yes", "y", "true", "1"}


def slugify(value: str) -> str:
    """Turn filter_options into a RoyaleTracker path slug (e.g. Ultimate Champion → ultimate-champion)."""
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def _extract_json_array(text: str, key: str) -> list[dict]:
    marker = f'"{key}":'
    start = text.find(marker)
    if start < 0:
        raise ValueError(f'Could not find "{key}" in page payload')

    i = text.find("[", start + len(marker))
    if i < 0:
        raise ValueError(f'Could not find "{key}" array start')

    depth = 0
    in_string = False
    escape = False
    for j, char in enumerate(text[i:], i):
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return json.loads(text[i : j + 1])

    raise ValueError(f'Unbalanced JSON array for "{key}"')


def load_scrape_slugs(cards_path: Path) -> list[str]:
    """Build RoyaleTracker URL slugs from cards.csv (base + evo-/hero- variants)."""
    slugs: list[str] = []
    seen: set[str] = set()

    with cards_path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            name = (row.get("royaleapi_card_name") or "").strip()
            if not name:
                continue

            candidates = [name]
            if _truthy(row.get("hasEvo")):
                # Site routes use evo-<slug> (evolved- returns 404).
                candidates.append(f"evo-{name}")
            if _truthy(row.get("hasHero")):
                candidates.append(f"hero-{name}")

            for slug in candidates:
                if slug not in seen:
                    seen.add(slug)
                    slugs.append(slug)

    return slugs


def load_tag_scrape_targets(features_path: Path) -> list[tuple[str, str]]:
    """
    Build (tag, url) pairs from features.csv rows where search_field is Tag.
    Tag is the exact filter_options value (for frontend matching); URL uses a slugified path.
    """
    targets: list[tuple[str, str]] = []
    seen_slugs: set[str] = set()

    with features_path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if (row.get("search_field") or "").strip().lower() != "tag":
                continue

            filter_options = (row.get("filter_options") or "").strip()
            if not filter_options:
                continue

            slug = slugify(filter_options)
            if not slug or slug in seen_slugs:
                continue

            seen_slugs.add(slug)
            targets.append((filter_options, f"{TAG_DECKS_BASE_URL}/{slug}"))

    return targets


def fetch_decks(
    session: requests.Session,
    url: str,
    array_keys: str | list[str],
) -> list[dict]:
    """Pull a deck array from a RoyaleTracker page. Returns [] when none are present."""
    keys = [array_keys] if isinstance(array_keys, str) else list(array_keys)

    for headers in (RSC_HEADERS, HEADERS):
        response = session.get(url, headers=headers, timeout=30)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        for key in keys:
            try:
                decks = _extract_json_array(response.text, key)
            except (ValueError, json.JSONDecodeError):
                continue
            return decks or []

    return []


def card_label(card: dict) -> str:
    name = card.get("name") or "Unknown"
    if card.get("isHero"):
        return f"hero-{name}"
    if card.get("isEvolved"):
        return f"evolved-{name}"
    return name


def deck_identity(deck: dict) -> frozenset[str]:
    """Order-insensitive identity that still distinguishes evo/hero variants."""
    return frozenset(card_label(card) for card in deck.get("cards") or [])


def deck_rank_key(deck: dict) -> tuple[float, int]:
    return (
        float(deck.get("winRate") or 0),
        int(deck.get("totalBattles") or 0),
    )


def merge_unique_decks(
    existing: dict[tuple[str, frozenset[str]], dict],
    new_decks: list[dict],
    tag: str,
) -> int:
    """Merge decks into existing map keyed by (tag, cards); keep stronger stats. Returns added count."""
    added = 0
    for deck in new_decks:
        identity = deck_identity(deck)
        if not identity:
            continue
        tagged = {**deck, "tag": tag}
        key = (tag, identity)
        if key not in existing:
            existing[key] = tagged
            added += 1
            continue
        if deck_rank_key(tagged) > deck_rank_key(existing[key]):
            existing[key] = tagged
    return added


def decks_to_rows(decks: list[dict]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for index, deck in enumerate(decks, start=1):
        cards = [card_label(card) for card in deck.get("cards") or []]
        rows.append(
            {
                "deck_id": index,
                "cards": "; ".join(cards),
                "win_rate": deck.get("winRate"),
                "num_battles": deck.get("totalBattles"),
                "usage": deck.get("popularityPercent"),
                "tag": deck.get("tag"),
            }
        )
    return rows


def write_csv(rows: list[dict[str, object]], path: Path) -> None:
    fieldnames = ["deck_id", "cards", "win_rate", "num_battles", "usage", "tag"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    if not CARDS_CSV_PATH.exists():
        raise SystemExit(f"Missing cards file: {CARDS_CSV_PATH}")
    if not FEATURES_CSV_PATH.exists():
        raise SystemExit(f"Missing features file: {FEATURES_CSV_PATH}")

    slugs = load_scrape_slugs(CARDS_CSV_PATH)
    if not slugs:
        raise SystemExit(f"No scrape slugs found in {CARDS_CSV_PATH}")

    tag_targets = load_tag_scrape_targets(FEATURES_CSV_PATH)

    session = requests.Session()
    session.trust_env = False

    unique_decks: dict[tuple[str, frozenset[str]], dict] = {}
    pages_with_decks = 0
    pages_failed = 0

    print(f"Scraping {len(slugs)} RoyaleTracker card pages...")
    for index, slug in enumerate(slugs, start=1):
        try:
            decks = fetch_decks(
                session,
                f"{CARD_DECKS_BASE_URL}/{slug}",
                "initialTopDecks",
            )
            added = merge_unique_decks(unique_decks, decks, TAG_CARD)
            if decks:
                pages_with_decks += 1
            print(
                f"[{index}/{len(slugs)}] {slug}: "
                f"{len(decks)} decks (+{added} new) | unique={len(unique_decks)}"
            )
        except Exception as exc:  # keep going across transient page failures
            pages_failed += 1
            print(f"[{index}/{len(slugs)}] {slug}: ERROR {exc}")

        if index < len(slugs) or tag_targets:
            time.sleep(REQUEST_DELAY_SECONDS)

    if tag_targets:
        print(f"Scraping {len(tag_targets)} tagged feature page(s) from features.csv...")
        for index, (tag, url) in enumerate(tag_targets, start=1):
            try:
                decks = fetch_decks(session, url, ["initialDecks", "initialTopDecks"])
                added = merge_unique_decks(unique_decks, decks, tag)
                if decks:
                    pages_with_decks += 1
                print(
                    f"[tag {index}/{len(tag_targets)}] {tag} ({url}): "
                    f"{len(decks)} decks (+{added} new) | unique={len(unique_decks)}"
                )
            except Exception as exc:
                pages_failed += 1
                print(f"[tag {index}/{len(tag_targets)}] {tag}: ERROR {exc}")

            if index < len(tag_targets):
                time.sleep(REQUEST_DELAY_SECONDS)
    else:
        print("No Tag features found in features.csv; skipping tagged pages.")

    if not unique_decks:
        raise SystemExit("No decks collected from any source")

    sorted_decks = sorted(
        unique_decks.values(),
        key=deck_rank_key,
        reverse=True,
    )

    JSON_OUTPUT_PATH.write_text(json.dumps(sorted_decks, indent=2), encoding="utf-8")
    rows = decks_to_rows(sorted_decks)
    write_csv(rows, CSV_OUTPUT_PATH)

    tag_counts: dict[str, int] = {}
    for deck in sorted_decks:
        tag = deck.get("tag") or "unknown"
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    tag_summary = " ".join(f"{name}={count}" for name, count in sorted(tag_counts.items()))

    print(
        f"Done. pages_with_decks={pages_with_decks} failed={pages_failed} "
        f"{tag_summary} unique_decks={len(rows)} -> {CSV_OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
