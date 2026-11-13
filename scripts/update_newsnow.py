#!/usr/bin/env python3
"""Refresh the static intel NewsNow snapshot from public NewsNow gateway APIs.

Runs in GitHub Actions (or locally) with no login and no local collector.
Only public hot-list data is read; if one board fails, its previous snapshot is kept.
"""
from __future__ import annotations

import datetime as dt
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "intel" / "data" / "api" / "newsnow.json"
GATEWAY = "https://newsnow.busiyi.world/api/s?id="
UA = "Mozilla/5.0 (compatible; guijiyeren-site-updater/1.0; +https://guijiyeren.github.io/)"
NOW = dt.datetime.now(dt.timezone.utc)


def get_json(board_id: str) -> dict:
    req = urllib.request.Request(GATEWAY + urllib.parse.quote(board_id), headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status}")
        return json.loads(resp.read().decode("utf-8"))


def parse_time(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return dt.datetime.fromtimestamp(value / 1000, dt.timezone.utc).isoformat().replace("+00:00", "Z")
        except (ValueError, OSError):
            return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S"):
        try:
            parsed = dt.datetime.strptime(text.replace("Z", "+0000"), fmt) if fmt.endswith("%z") else dt.datetime.strptime(text, fmt)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=dt.timezone.utc)
            return parsed.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
        except ValueError:
            pass
    return None


def refresh_board(old: dict) -> dict:
    board_id = str(old.get("id") or "")
    fresh = dict(old)
    try:
        payload = get_json(board_id)
        items = payload.get("items") or []
        if not isinstance(items, list) or not items:
            raise RuntimeError("empty items")
        rows = []
        for rank, item in enumerate(items[:30], 1):
            title = str(item.get("title") or "").strip()
            url = str(item.get("url") or item.get("mobileUrl") or "").strip()
            if not title or not url:
                continue
            rows.append({
                "id": str(item.get("id") or f"{board_id}-{rank}"),
                "rank": rank,
                "title": title,
                "url": url,
                "category": "发现线索",
                "relevant": False,
                "link_kind": "link",
                "published_at": parse_time(item.get("pubDate") or item.get("published_at")),
            })
        if not rows:
            raise RuntimeError("no usable rows")
        updated = parse_time(payload.get("updatedTime")) or NOW.isoformat().replace("+00:00", "Z")
        fresh.update({
            "status": payload.get("status") or "cache",
            "updated_at": updated,
            "fetched_at": NOW.isoformat().replace("+00:00", "Z"),
            "stale": False,
            "items": rows,
        })
        print(f"ok   {board_id}: {len(rows)} items")
    except Exception as exc:  # keep old items on failure
        fresh["status"] = "cache"
        fresh["fetched_at"] = NOW.isoformat().replace("+00:00", "Z")
        fresh["stale"] = True
        print(f"warn {board_id}: {exc} (keeping previous snapshot)", file=sys.stderr)
    return fresh


def main() -> int:
    old = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    data = old.setdefault("data", {})
    boards = data.get("boards") or []
    if not boards:
        print("no boards in snapshot", file=sys.stderr)
        return 1
    new_boards = [refresh_board(board) for board in boards]
    item_count = sum(len(board.get("items") or []) for board in new_boards)
    data.update({
        "url": "https://newsnow.busiyi.world/c/hottest",
        "transport": "github-actions",
        "strategy": "public_api_gateway",
        "gateway_count": 1,
        "boards": new_boards,
        "available": sum(1 for board in new_boards if not board.get("stale")),
        "board_count": len(new_boards),
        "item_count": item_count,
        "source": "newsnow.busiyi.world",
        "running": False,
        "minimum_interval_minutes": 60,
        "refreshed_by": "github-actions",
        "refreshed_at": NOW.isoformat().replace("+00:00", "Z"),
    })
    old["server_time_utc"] = NOW.isoformat().replace("+00:00", "Z")
    DATA_FILE.write_text(json.dumps(old, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {DATA_FILE} boards={len(new_boards)} items={item_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
