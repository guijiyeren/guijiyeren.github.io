"""Verify the public site's update dates, or regenerate its local date manifest."""
import argparse
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "site-updates.json"
SHANGHAI = timezone(timedelta(hours=8))
CARD_PAGE = "https://guijiyeren.feishu.cn/wiki/HXjTwExuMixbmkkLFHBceN6SnMk"
CARD_HEADING = re.compile(r"(?:(\d{4})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*[｜|]\s*(.+)")
ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


def read_json(relative):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def read_shijue_summary():
    raw = (ROOT / "shijue/data.js").read_text(encoding="utf-8").strip()
    prefix = "window.SHIJUE_DATA ="
    if not raw.startswith(prefix):
        raise ValueError("视觉图鉴数据文件格式异常")
    payload = json.loads(raw[len(prefix):].strip().rstrip(";"))
    counts = payload["counts"]
    styles = len(payload["styles"])
    components = len(payload["components"])
    motions = len(payload["motions"])
    if styles != counts["styles"] or components != counts["components"] or motions != counts["motions"]:
        raise ValueError("视觉图鉴条数与计数摘要不符")
    return {
        "date": date.fromisoformat(payload["updatedAt"]).isoformat(),
        "count": styles + components + motions,
        "styles": styles,
        "components": components,
        "motions": motions,
    }


def source_summary(card):
    news = read_json("intel/data/api/newsnow.json")
    if not news["ok"] or not news["data"]:
        raise ValueError("公开榜单没有可用数据")
    intel_date = datetime.fromisoformat(news["server_time_utc"].replace("Z", "+00:00"))
    export = read_json("resource/data/items.json")
    meta = export["meta"]
    if len(export["items"]) != meta["count"]:
        raise ValueError("资源中心的条数与导出的条目不符")
    newest = max((item["a"] for item in export["items"]
                  if ISO_DATE.fullmatch(item.get("a") or "")), default="")
    return {
        "intel": {"date": intel_date.astimezone(SHANGHAI).date().isoformat()},
        "resource": {
            "date": date.fromisoformat(meta["generated"]).isoformat(),
            "count": meta["count"],
            "zones": len(meta["zones"]),
            "categories": sum(len(zone["cats"]) for zone in meta["zones"]),
            "newestEntry": newest,
        },
        "daily": card,
        "shijue": read_shijue_summary(),
    }


def latest_feishu_card():
    args = [
        "lark-cli", "docs", "+fetch", "--doc", CARD_PAGE, "--as", "user",
        "--scope", "outline", "--detail", "with-ids", "--format", "json",
    ]
    if sys.platform == "win32":
        args = ["cmd.exe", "/d", "/c"] + args
    result = subprocess.run(args, capture_output=True, encoding="utf-8", timeout=45, check=True)
    data = json.loads(result.stdout)["data"]["document"]
    today = datetime.now(SHANGHAI).date()
    for heading in ET.fromstring(data["content"]).iter("h2"):
        match = CARD_HEADING.fullmatch("".join(heading.itertext()).strip())
        if not match or not heading.get("id"):
            continue
        year, month, day, title = match.groups()
        published = date(int(year or today.year), int(month), int(day))
        if not year and published > today:
            published = published.replace(year=today.year - 1)
        if published <= today:
            return {"date": published.isoformat(), "title": title,
                    "url": CARD_PAGE + "#" + heading.get("id")}
    raise ValueError("未核实到飞书学习卡的日期和标题")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="更新工作目录的公开日期文件")
    parser.add_argument("--refresh-daily", action="store_true", help="通过已登录的 lark-cli 核实飞书最新卡片")
    args = parser.parse_args()
    try:
        stored = read_json(MANIFEST.name)
        actual = source_summary(latest_feishu_card() if args.refresh_daily else stored["daily"])
    except (OSError, KeyError, ValueError, ET.ParseError, subprocess.SubprocessError) as error:
        print("日期核验失败：" + str(error), file=sys.stderr)
        return 2
    print(json.dumps(actual, ensure_ascii=False, indent=2))
    if args.write:
        data = json.dumps(actual, ensure_ascii=False, indent=2) + "\n"
        if stored != actual:
            temp = MANIFEST.with_suffix(".json.tmp")
            temp.write_text(data, encoding="utf-8")
            temp.replace(MANIFEST)
    elif stored != actual:
        print("日期文件与数据来源不一致", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
