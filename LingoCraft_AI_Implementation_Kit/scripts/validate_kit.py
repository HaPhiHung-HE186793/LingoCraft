#!/usr/bin/env python3
"""Offline contract/reference-policy checks. This is not an app/security test."""
from __future__ import annotations
import copy
import json
import re
from pathlib import Path
from collections import Counter
try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError as exc:
    raise SystemExit("Missing jsonschema. Install it in an approved virtual environment.") from exc

ROOT = Path(__file__).resolve().parents[1]
CHECKS = 0

def check(value: bool, message: str) -> None:
    global CHECKS
    if not value:
        raise AssertionError(message)
    CHECKS += 1

def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def semantic_validate(game: dict, key: dict, allowed_sources: set[tuple[str, str]]) -> None:
    check(game["game_id"] == key["game_id"], "game/key ID mismatch")
    tids = [t["id"] for t in game["tokens"]]
    check(len(set(tids)) == len(tids), "duplicate token IDs")
    nodes = [n["id"] for n in game["scene"]["nodes"]]
    check(len(set(nodes)) == len(nodes), "duplicate scene node IDs")
    for edge in game["scene"]["edges"]:
        check(edge["from"] in nodes and edge["to"] in nodes, "unknown scene edge endpoint")
    for ref in game["source_refs"]:
        check((ref["item_id"], ref["revision_id"]) in allowed_sources, "unauthorized source fixture")
    for seq in key["accepted_token_sequences"]:
        check(len(seq) <= game["interaction"]["max_answer_tokens"], "answer exceeds max tokens")
        counts = Counter(seq)
        check(all(t in tids and n <= 1 for t, n in counts.items()), "unknown/reused token")
    check(sorted(h["level"] for h in key["hints"]) == [1, 2, 3, 4], "invalid hint levels")
    check(key["memory_effect"] == "practice_only", "reference game must remain practice-only")
    check(key["review_status"] == "draft", "fixtures were not human-reviewed in this project")
    check(not ({"canonical_text", "accepted_token_sequences", "hints"} & game.keys()), "private fields exposed")

def classify_reference(case: dict) -> str:
    """Eligibility demonstration only. Does not call FSRS or write memory state."""
    if case["task"] != "free_recall" or case["hint_before_first"]:
        return "NO_UPDATE"
    verdict = case["first_verdict"]
    if verdict == "incorrect":
        return "Again"
    if verdict != "correct":
        return "NO_UPDATE"
    if case.get("self_rating") == "Hard":
        return "Hard"
    if case.get("self_rating") == "Easy":
        return "Easy"
    return "Good"

def expect_rejected(callable_check, message: str) -> None:
    global CHECKS
    try:
        callable_check()
    except Exception:
        CHECKS += 1
        return
    raise AssertionError(message)

def main() -> None:
    validators = {}
    for kind, path in [("public", "game-spec"), ("private", "private-answer-key")]:
        schema = load(f"contracts/{path}.schema.json")
        Draft202012Validator.check_schema(schema)
        validators[kind] = Draft202012Validator(schema, format_checker=FormatChecker())
    fixtures = []
    for stem in ["ja-school-by-bicycle", "en-directions"]:
        game = load(f"fixtures/{stem}.public.json")
        key = load(f"fixtures/{stem}.private.json")
        validators["public"].validate(game)
        validators["private"].validate(key)
        allowed = {(r["item_id"], r["revision_id"]) for r in game["source_refs"]}
        semantic_validate(game, key, allowed)
        fixtures.append((game, key, allowed))
    game, key, allowed = fixtures[0]
    bad = copy.deepcopy(game); bad["html"] = "not allowed"
    expect_rejected(lambda: validators["public"].validate(bad), "HTML field accepted")
    bad_template = copy.deepcopy(game); bad_template["template_id"] = "untrusted_template"
    expect_rejected(lambda: validators["public"].validate(bad_template), "unknown template accepted")
    duplicate = copy.deepcopy(game); duplicate["tokens"].append(duplicate["tokens"][0])
    expect_rejected(lambda: semantic_validate(duplicate, key, allowed), "duplicate token accepted")
    foreign = copy.deepcopy(game); foreign["source_refs"][0]["item_id"] = "99999999-9999-4999-8999-999999999999"
    expect_rejected(lambda: semantic_validate(foreign, key, allowed), "foreign source accepted")
    bad_edge = copy.deepcopy(game); bad_edge["scene"]["edges"][0]["to"] = "node_missing"
    expect_rejected(lambda: semantic_validate(bad_edge, key, allowed), "missing edge endpoint accepted")
    for case in load("fixtures/review-policy-cases.json"):
        check(classify_reference(case) == case["expected"], f"policy failed: {case['id']}")
    skill_paths = list((ROOT / ".agents/skills").glob("*/SKILL.md"))
    check(len(skill_paths) == 12, "expected 12 project skills")
    for path in skill_paths:
        text = path.read_text(encoding="utf-8")
        check(text.startswith("---\nname: "), f"bad frontmatter: {path}")
        check("\ndescription: " in text, f"description missing: {path}")
        check(f"name: {path.parent.name}\n" in text, f"skill name mismatch: {path}")
    spec = (ROOT / "PROJECT_SPEC.md").read_text(encoding="utf-8")
    ids = {s["id"] for s in load("docs/sources.json")}
    cited = set(re.findall(r"\[(S\d{2})\]", spec))
    check(cited <= ids, "unknown source reference")
    check("cite" not in spec and "turn449" not in spec, "internal citation markup leaked")
    check("daigaku" in spec and "gakkō" in spec, "Japanese distinction missing")
    print(f"PASS: {CHECKS} offline reference checks; 2 game/key fixture pairs; 10 review-policy cases; 12 skills.")
    print("NOT TESTED: app code, live providers, human language approval, database/RLS, real FSRS, E2E, hosting, device behavior, load/security.")

if __name__ == "__main__":
    main()
