from __future__ import annotations

import argparse
import csv
import io
import json
import math
import os
import re
import sqlite3
import statistics
import sys
import tempfile
import unicodedata
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import urlencode
from urllib.error import URLError
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


FUELS = ("Gazole", "SP95")
SOURCE_FUEL_MAP = {
    "Gazole": "Gazole",
    "Gasoil": "Gazole",
    "Diesel": "Gazole",
    "B7": "Gazole",
    "Diesel B7": "Gazole",
    "Gazole B7": "Gazole",
    "SP95": "SP95",
    "E10": "SP95",
    "SP95-E10": "SP95",
}
DEFAULT_INPUT = Path("Fichiers Stations.txt")
DEFAULT_OUTPUT = Path("data")
INSTANT_URLS = (
    "https://donnees.roulez-eco.fr/opendata/instantane_ruptures",
    "https://donnees.roulez-eco.fr/opendata/instantane",
)
DAY_URL = "https://donnees.roulez-eco.fr/opendata/jour/{date}"
CURRENT_YEAR_URL = "https://donnees.roulez-eco.fr/opendata/annee"
YEAR_URL = "https://donnees.roulez-eco.fr/opendata/annee/{year}"
BRAND_ENRICHMENT_URL = (
    "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/"
    "prix-des-carburants-j-1/records"
)
COMMUNES_URL = (
    "https://geo.api.gouv.fr/communes?"
    "fields=nom,code,codesPostaux,centre,departement,region,population"
    "&format=json&geometry=centre"
)
VEHICLE_CATALOG_URL = "https://data.ademe.fr/data-fair/api/v1/datasets/ademe-car-labelling/raw"
BRAND_OVERRIDES = {
    "78120005": "E.Leclerc",
}
BRAND_RULES = (
    ("E.Leclerc", r"\b(E\s*LECLERC|CENTRE\s+E?\s*LECLERC|HYPER\s+E?\s*LECLERC|LECLERC\s+(DRIVE|EXPRESS))\b"),
    ("Carrefour", r"\b(CARREFOUR\s+(MARKET|CONTACT|CITY)|CENTRE\s+COMMERCIAL\s+CARREFOUR|HYPER\s+CARREFOUR|CC\s+CARREFOUR)\b"),
    ("Intermarché", r"\b(INTERMARCHE|INTER\s*MARCHE)\b"),
    ("TotalEnergies", r"\b(TOTALENERGIES|TOTAL\s+ENERGIES|TOTAL\s+ACCESS|TOTAL)\b"),
    ("Auchan", r"\b(AUCHAN)\b"),
    ("Système U", r"\b(SYSTEME\s+U|SUPER\s+U|HYPER\s+U|U\s+EXPRESS|MARCHE\s+U)\b"),
    ("Esso", r"\b(ESSO|ESSO\s+EXPRESS)\b"),
    ("Shell", r"\b(SHELL)\b"),
    ("Avia", r"\b(AVIA)\b"),
    ("BP", r"\b(BP)\b"),
    ("ENI", r"\b(ENI|AGIP)\b"),
    ("Dyneff", r"\b(DYNEFF)\b"),
    ("Elan", r"\b(ELAN)\b"),
    ("Casino", r"\b(CASINO|GEANT\s+CASINO)\b"),
    ("Cora", r"\b(CORA)\b"),
    ("Match", r"\b(SUPERMARCHE\s+MATCH|MATCH)\b"),
    ("Netto", r"\b(NETTO)\b"),
    ("Atac", r"\b(ATAC)\b"),
    ("Avia", r"\b(PICOTY)\b"),
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build static JSON files for the fuel decision app."
    )
    parser.add_argument(
        "--source",
        choices=("auto", "local", "instant", "day"),
        default="auto",
        help="Data source. auto uses the local XML file when present.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help="Local XML or ZIP file used with --source local/auto.",
    )
    parser.add_argument(
        "--history-input",
        type=Path,
        help="Optional local XML or ZIP file used only to build historical graphs.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Directory where JSON files will be written.",
    )
    parser.add_argument(
        "--day",
        help="Date for --source day, format YYYYMMDD. Defaults to yesterday UTC.",
    )
    parser.add_argument(
        "--skip-history",
        action="store_true",
        help="Only create current station data, without daily median/distribution files.",
    )
    parser.add_argument(
        "--no-current-year-history",
        action="store_true",
        help="Do not download the rolling annual stock used to complete current-year history.",
    )
    parser.add_argument(
        "--no-previous-year-baseline",
        action="store_true",
        help="Do not download the previous annual archive used to seed January snapshots.",
    )
    parser.add_argument(
        "--skip-brand-enrichment",
        action="store_true",
        help="Do not enrich stations with commercial names/brands from the public Opendatasoft dataset.",
    )
    parser.add_argument(
        "--history-start-year",
        type=int,
        default=datetime.now(timezone.utc).year - 1,
        help="First year published in history files. Defaults to previous year.",
    )
    return parser.parse_args()


def read_remote(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "prix-carburant-decision/0.1"})
    with urlopen(request, timeout=90) as response:
        status = getattr(response, "status", 200)
        if status >= 400:
            raise URLError(f"HTTP {status}")
        return response.read()


def first_zip_member(data: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = [name for name in archive.namelist() if not name.endswith("/")]
        if not names:
            raise ValueError("The ZIP archive is empty.")
        xml_names = [name for name in names if name.lower().endswith(".xml")]
        return archive.read(xml_names[0] if xml_names else names[0])


def open_local_source(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Local source not found: {path}")
    if path.suffix.lower() == ".zip":
        return io.BytesIO(first_zip_member(path.read_bytes()))
    return path.open("rb")


def source_stream(args: argparse.Namespace) -> tuple[Any, str]:
    source = args.source
    if source == "auto":
        source = "local" if args.input.exists() else "instant"

    if source == "local":
        return open_local_source(args.input), str(args.input)

    if source == "day":
        day = args.day
        if not day:
            day = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y%m%d")
        url = DAY_URL.format(date=day)
        data = read_remote(url)
        return io.BytesIO(first_zip_member(data)), url

    errors: list[str] = []
    for url in INSTANT_URLS:
        try:
            data = read_remote(url)
            return io.BytesIO(first_zip_member(data)), url
        except Exception as exc:  # noqa: BLE001 - keep all source attempts visible.
            errors.append(f"{url}: {exc}")
    raise RuntimeError("Unable to download instant data:\n" + "\n".join(errors))


def text_or_empty(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(value.replace("\n", " ").replace("\r", " ").split())


def normalize_brand_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]+", " ", ascii_text.upper()).strip()


def infer_station_brand(*parts: str) -> str:
    haystack = normalize_brand_text(" ".join(part for part in parts if part))
    if not haystack:
        return ""
    for brand, pattern in BRAND_RULES:
        if re.search(pattern, haystack):
            return brand
    return ""


def grouped_fuel_name(source_fuel: str | None) -> str | None:
    if not source_fuel:
        return None
    if source_fuel in SOURCE_FUEL_MAP:
        return SOURCE_FUEL_MAP[source_fuel]
    normalized = normalize_brand_text(source_fuel)
    aliases = {
        "GAZOLE": "Gazole",
        "GASOIL": "Gazole",
        "DIESEL": "Gazole",
        "B7": "Gazole",
        "DIESEL B7": "Gazole",
        "GAZOLE B7": "Gazole",
        "SP95": "SP95",
        "E10": "SP95",
        "SP95 E10": "SP95",
    }
    return aliases.get(normalized)


def fetch_brand_enrichment() -> dict[str, dict[str, str]]:
    table: dict[str, dict[str, str]] = {}
    limit = 100
    offset = 0
    while True:
        query = urlencode(
            {
                "select": "id,brand,name",
                "group_by": "id,brand,name",
                "order_by": "id",
                "limit": limit,
                "offset": offset,
            }
        )
        payload = json.loads(read_remote(f"{BRAND_ENRICHMENT_URL}?{query}").decode("utf-8"))
        rows = payload.get("results") or []
        if not rows:
            break
        for row in rows:
            station_id = text_or_empty(str(row.get("id", "")))
            brand = text_or_empty(row.get("brand"))
            name = text_or_empty(row.get("name"))
            if station_id and (brand or name):
                current = table.get(station_id)
                if current is None or (brand and not current.get("brand")):
                    table[station_id] = {"brand": brand, "name": name}
        if len(rows) < limit:
            break
        offset += limit
        if offset > 50000:
            break
    return table


def fetch_communes() -> list[dict[str, Any]]:
    payload = json.loads(read_remote(COMMUNES_URL).decode("utf-8"))
    communes: list[dict[str, Any]] = []
    for row in payload:
        centre = row.get("centre") or {}
        coordinates = centre.get("coordinates") or []
        if len(coordinates) != 2:
            continue
        lon, lat = coordinates
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            continue
        communes.append(
            {
                "name": text_or_empty(row.get("nom")),
                "code": text_or_empty(row.get("code")),
                "cp": [text_or_empty(cp) for cp in row.get("codesPostaux") or [] if text_or_empty(cp)],
                "department": text_or_empty((row.get("departement") or {}).get("code")),
                "region": text_or_empty((row.get("region") or {}).get("nom")),
                "population": row.get("population") or 0,
                "lat": round(float(lat), 6),
                "lon": round(float(lon), 6),
            }
        )
    communes.sort(key=lambda item: (-int(item.get("population") or 0), item["name"]))
    return communes


def csv_decimal(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value.replace(",", ".").replace(" ", ""))
    except ValueError:
        return None


def vehicle_fuel_from_energy(energy: str) -> str | None:
    normalized = normalize_brand_text(energy)
    if "GAZOLE" in normalized or "DIESEL" in normalized or normalized.startswith("GAZ"):
        return "Gazole"
    if "ESSENCE" in normalized or "SUPER" in normalized or "ESS" in normalized:
        return "SP95"
    return None


def fallback_vehicle_price(range_label: str, fuel: str) -> float:
    normalized = normalize_brand_text(range_label)
    if "LUXE" in normalized or "SUPERIEURE" in normalized:
        return 46000.0
    if "MOYENNE" in normalized or "FAMILIALE" in normalized:
        return 30000.0
    if "INFERIEURE" in normalized:
        return 21000.0 if fuel == "SP95" else 23000.0
    return 26000.0


def fetch_vehicle_catalog() -> list[dict[str, Any]]:
    data = read_remote(VEHICLE_CATALOG_URL).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(data), delimiter=";")
    grouped: dict[tuple[str, str, str, str], dict[str, Any]] = {}

    for row in reader:
        fuel = vehicle_fuel_from_energy(row.get("Energie", ""))
        if fuel is None:
            continue

        brand = text_or_empty(row.get("Marque")).title()
        model = text_or_empty(row.get("Libellé modèle") or row.get("Modèle")).title()
        description = text_or_empty(row.get("Description Commerciale"))
        if not brand or not model:
            continue

        consumption_min = csv_decimal(row.get("Conso vitesse mixte Min"))
        consumption_max = csv_decimal(row.get("Conso vitesse mixte Max"))
        consumption_values = [value for value in (consumption_min, consumption_max) if value is not None and value > 0]
        if consumption_values:
            consumption = round(sum(consumption_values) / len(consumption_values), 1)
        else:
            consumption = 5.8 if fuel == "Gazole" else 6.7

        catalog_price = csv_decimal(row.get("Prix véhicule")) or fallback_vehicle_price(row.get("Gamme", ""), fuel)
        depreciation = round((catalog_price / 20000.0) * 0.055, 3)
        fiscal_power = csv_decimal(row.get("Puissance fiscale"))
        max_power = csv_decimal(row.get("Puissance maximale"))
        display = " ".join(part for part in [brand, model, description] if part)
        key = (
            normalize_brand_text(brand),
            normalize_brand_text(model),
            normalize_brand_text(description),
            fuel,
            str(fiscal_power or ""),
            str(max_power or ""),
        )

        current = grouped.get(key)
        candidate = {
            "brand": brand,
            "model": model,
            "label": display[:96],
            "fuel": fuel,
            "energy": text_or_empty(row.get("Energie")),
            "consumptionL100": consumption,
            "catalogPrice": round(catalog_price),
            "depreciationKm": depreciation,
            "fiscalPower": fiscal_power,
            "powerKw": max_power,
        }
        if current is None or candidate["catalogPrice"] > current["catalogPrice"]:
            grouped[key] = candidate

    catalog = sorted(
        grouped.values(),
        key=lambda item: (item["brand"], item["model"], item["fuel"], item["consumptionL100"]),
    )
    return catalog[:2500]


def apply_brand_enrichment(
    stations: dict[str, Any],
    enrichment: dict[str, dict[str, str]],
) -> int:
    applied = 0
    for station_id, station in stations.items():
        row = enrichment.get(station_id)
        if not row:
            continue
        brand = row.get("brand") or station.get("brand") or ""
        name = row.get("name") or brand or station.get("name") or ""
        if not brand and not name:
            continue
        station["brand"] = brand
        if name and brand and brand.lower() not in name.lower():
            station["name"] = f"{brand} - {name}"
        else:
            station["name"] = name or brand
        applied += 1
    return applied


def child_text(elem: ET.Element, tag: str) -> str:
    child = elem.find(tag)
    return text_or_empty(child.text if child is not None else "")


def parse_float(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return None


def parse_coord(value: str | None) -> float | None:
    parsed = parse_float(value)
    if parsed is None:
        return None
    coord = parsed / 100000
    if math.isfinite(coord):
        return coord
    return None


def parse_lat_lon(elem: ET.Element) -> tuple[float, float] | None:
    lat = parse_coord(elem.attrib.get("latitude"))
    lon = parse_coord(elem.attrib.get("longitude"))
    if lat is None or lon is None:
        return None
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    return lat, lon


def department_from_cp(cp: str) -> str:
    cp = cp.strip()
    if cp.startswith(("97", "98")) and len(cp) >= 3:
        return cp[:3]
    return cp[:2] if len(cp) >= 2 else ""


def score_for_percentile(percentile: float) -> int:
    thresholds = (
        (0.01, 20),
        (0.05, 19),
        (0.10, 18),
        (0.15, 17),
        (0.20, 16),
        (0.25, 15),
        (0.30, 14),
        (0.35, 13),
        (0.40, 12),
        (0.45, 11),
        (0.50, 10),
        (0.55, 9),
        (0.60, 8),
        (0.65, 7),
        (0.70, 6),
        (0.75, 5),
        (0.80, 4),
        (0.85, 3),
        (0.90, 2),
        (0.95, 1),
    )
    for threshold, score in thresholds:
        if percentile <= threshold:
            return score
    return 0


def median(values: list[float]) -> float | None:
    if not values:
        return None
    return round(float(statistics.median(values)), 3)


def make_histogram(values: list[float], bins: int = 24) -> list[dict[str, Any]]:
    values = [value for value in values if value is not None and math.isfinite(value)]
    if not values:
        return []

    low = min(values)
    high = max(values)
    if low == high:
        return [{"min": round(low, 3), "max": round(high, 3), "count": len(values)}]

    width = (high - low) / bins
    counts = [0 for _ in range(bins)]
    for value in values:
        index = min(int((value - low) / width), bins - 1)
        counts[index] += 1

    histogram = []
    for index, count in enumerate(counts):
        start = low + index * width
        end = high if index == bins - 1 else low + (index + 1) * width
        histogram.append({"min": round(start, 3), "max": round(end, 3), "count": count})
    return histogram


def make_round_histogram(values: list[float], step: float = 0.05) -> list[dict[str, Any]]:
    values = [value for value in values if value is not None and math.isfinite(value)]
    if not values:
        return []

    start = math.floor(min(values) / step) * step
    end = math.floor(max(values) / step) * step
    bins: list[dict[str, Any]] = []
    current = start
    while current <= end + 1e-9:
        bins.append(
            {
                "min": round(current, 2),
                "max": round(current + step - 0.001, 3),
                "count": 0,
            }
        )
        current += step

    for value in values:
        index = int((value - start) / step)
        index = min(max(index, 0), len(bins) - 1)
        bins[index]["count"] += 1

    return bins


def setup_history_db(db_path: Path) -> sqlite3.Connection:
    if db_path.exists():
        db_path.unlink()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=OFF")
    conn.execute("PRAGMA synchronous=OFF")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute(
        """
        CREATE TABLE daily_prices (
            date TEXT NOT NULL,
            fuel TEXT NOT NULL,
            source_fuel TEXT NOT NULL,
            station_id TEXT NOT NULL,
            price REAL NOT NULL,
            maj TEXT NOT NULL,
            PRIMARY KEY (date, fuel, source_fuel, station_id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE rupture_periods (
            station_id TEXT NOT NULL,
            fuel TEXT NOT NULL,
            source_fuel TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            type TEXT,
            PRIMARY KEY (station_id, fuel, source_fuel, start_date, end_date)
        )
        """
    )
    return conn


def flush_history(conn: sqlite3.Connection, batch: list[tuple[str, str, str, str, float, str]]) -> None:
    if not batch:
        return
    conn.executemany(
        """
        INSERT INTO daily_prices(date, fuel, source_fuel, station_id, price, maj)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, fuel, source_fuel, station_id)
        DO UPDATE SET
            price = CASE
                WHEN excluded.price < daily_prices.price THEN excluded.price
                ELSE daily_prices.price
            END,
            maj = CASE
                WHEN excluded.price < daily_prices.price THEN excluded.maj
                WHEN excluded.price = daily_prices.price AND excluded.maj > daily_prices.maj THEN excluded.maj
                ELSE daily_prices.maj
            END
        """,
        batch,
    )
    batch.clear()


def flush_ruptures(conn: sqlite3.Connection, batch: list[tuple[str, str, str, str, str, str | None]]) -> None:
    if not batch:
        return
    conn.executemany(
        """
        INSERT OR IGNORE INTO rupture_periods(station_id, fuel, source_fuel, start_date, end_date, type)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        batch,
    )
    batch.clear()


def parse_source(stream: Any, history_conn: sqlite3.Connection | None = None) -> dict[str, Any]:
    conn = history_conn
    history_batch: list[tuple[str, str, str, str, float, str]] = []
    rupture_batch: list[tuple[str, str, str, str, str, str | None]] = []
    stations: dict[str, Any] = {}
    parsed_count = 0

    for event, elem in ET.iterparse(stream, events=("end",)):
        if elem.tag != "pdv":
            continue

        station_id = elem.attrib.get("id", "").strip()
        coords = parse_lat_lon(elem)
        if not station_id or coords is None:
            elem.clear()
            continue

        lat, lon = coords
        cp = elem.attrib.get("cp", "").strip()
        department = department_from_cp(cp)
        address = child_text(elem, "adresse")
        city = child_text(elem, "ville")
        raw_station_name = text_or_empty(elem.attrib.get("nom"))
        brand = BRAND_OVERRIDES.get(station_id) or infer_station_brand(raw_station_name, address, city)
        station_name = f"{brand} - {city}" if brand and city else brand or raw_station_name or f"Station {city or cp or station_id}"

        active_ruptures = {fuel: False for fuel in SOURCE_FUEL_MAP}
        for rupture in elem.findall("rupture"):
            source_fuel = rupture.attrib.get("nom") or rupture.attrib.get("fuel")
            grouped_fuel = grouped_fuel_name(source_fuel)
            if conn is not None and grouped_fuel in FUELS:
                start_date = (rupture.attrib.get("debut") or rupture.attrib.get("start") or "")[:10]
                end_date = (rupture.attrib.get("fin") or rupture.attrib.get("end") or "")[:10]
                if start_date:
                    rupture_batch.append(
                        (
                            station_id,
                            grouped_fuel,
                            source_fuel or grouped_fuel,
                            start_date,
                            end_date,
                            rupture.attrib.get("type"),
                        )
                    )
                    if len(rupture_batch) >= 10000:
                        flush_ruptures(conn, rupture_batch)
            matching_key = source_fuel if source_fuel in active_ruptures else None
            if matching_key is None and grouped_fuel:
                matching_key = source_fuel or ""
                active_ruptures.setdefault(matching_key, False)
            if matching_key in active_ruptures and not rupture.attrib.get("fin", "").strip():
                active_ruptures[matching_key] = True

        latest_prices: dict[str, dict[str, Any]] = {}
        for price_node in elem.findall("prix"):
            source_fuel = price_node.attrib.get("nom")
            fuel = grouped_fuel_name(source_fuel)
            if fuel not in FUELS:
                continue

            price = parse_float(price_node.attrib.get("valeur"))
            maj = price_node.attrib.get("maj", "")
            if price is None:
                continue

            previous = latest_prices.get(fuel)
            rounded_price = round(price, 3)
            if (
                previous is None
                or rounded_price < previous["price"]
                or (rounded_price == previous["price"] and maj > previous["updatedAt"])
            ):
                latest_prices[fuel] = {
                    "price": rounded_price,
                    "updatedAt": maj,
                    "sourceFuel": source_fuel,
                }

            if conn is not None and len(maj) >= 10:
                history_batch.append((maj[:10], fuel, source_fuel or fuel, station_id, rounded_price, maj))
                if len(history_batch) >= 10000:
                    flush_history(conn, history_batch)

        fuels: dict[str, Any] = {}
        for fuel in FUELS:
            matching_sources = [
                source_fuel
                for source_fuel, grouped_fuel in SOURCE_FUEL_MAP.items()
                if grouped_fuel == fuel
            ]
            matching_sources += [
                source_fuel
                for source_fuel in active_ruptures
                if grouped_fuel_name(source_fuel) == fuel and source_fuel not in matching_sources
            ]
            if fuel in latest_prices:
                fuels[fuel] = {"available": True, **latest_prices[fuel]}
            elif any(active_ruptures[source_fuel] for source_fuel in matching_sources):
                fuels[fuel] = {"available": False, "reason": "rupture"}
            else:
                fuels[fuel] = {"available": False, "reason": "missing"}

        stations[station_id] = {
            "id": station_id,
            "name": station_name,
            "brand": brand,
            "address": address,
            "city": city,
            "cp": cp,
            "department": department,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "fuels": fuels,
        }

        parsed_count += 1
        if parsed_count % 5000 == 0:
            print(f"Parsed {parsed_count:,} stations...", file=sys.stderr)
        elem.clear()

    if conn is not None:
        flush_history(conn, history_batch)
        flush_ruptures(conn, rupture_batch)
        conn.commit()
    return stations


def apply_scores(stations: dict[str, Any]) -> dict[str, Any]:
    stats: dict[str, Any] = {}
    for fuel in FUELS:
        rows: list[tuple[float, str, dict[str, Any]]] = []
        for station in stations.values():
            fuel_info = station["fuels"].get(fuel, {})
            if fuel_info.get("available") and fuel_info.get("price") is not None:
                rows.append((float(fuel_info["price"]), station["id"], fuel_info))

        rows.sort(key=lambda item: (item[0], item[1]))
        total = len(rows)
        denominator = max(total - 1, 1)
        last_price: float | None = None
        last_rank = 0
        last_percentile = 0.0
        last_score = 0

        for index, (price, _station_id, fuel_info) in enumerate(rows):
            if price != last_price:
                last_price = price
                last_rank = index + 1
                last_percentile = index / denominator
                last_score = score_for_percentile(last_percentile)
            fuel_info["rank"] = last_rank
            fuel_info["percentile"] = round(last_percentile, 4)
            fuel_info["score"] = last_score

        prices = [price for price, _station_id, _fuel_info in rows]
        stats[fuel] = {
            "count": total,
            "min": round(min(prices), 3) if prices else None,
            "max": round(max(prices), 3) if prices else None,
            "median": median(prices),
        }
    return stats


def iter_iso_dates(start_date: str, end_date: str) -> list[str]:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    if end < start:
        start, end = end, start
    days = (end - start).days
    return [(start + timedelta(days=offset)).isoformat() for offset in range(days + 1)]


def next_iso_date(value: str) -> str:
    return (datetime.strptime(value, "%Y-%m-%d").date() + timedelta(days=1)).isoformat()


def snapshot_price_groups(
    conn: sqlite3.Connection,
    fuel: str,
    start_date: str,
    end_date: str,
    allowed_station_ids: set[str] | None = None,
) -> Iterator[tuple[str, list[tuple[str, float]], int, int]]:
    current: dict[str, dict[str, float]] = {}
    source_fuels = {
        source_fuel
        for source_fuel, grouped_fuel in SOURCE_FUEL_MAP.items()
        if grouped_fuel == fuel
    }
    baseline_rows = conn.execute(
        """
        SELECT p.station_id, p.source_fuel, p.price
        FROM daily_prices p
        INNER JOIN (
            SELECT station_id, source_fuel, MAX(date) AS max_date
            FROM daily_prices
            WHERE fuel = ? AND date < ?
            GROUP BY station_id, source_fuel
        ) latest
            ON latest.station_id = p.station_id
            AND latest.source_fuel = p.source_fuel
            AND latest.max_date = p.date
        WHERE p.fuel = ?
        """,
        (fuel, start_date, fuel),
    )
    for station_id, source_fuel, price in baseline_rows:
        if allowed_station_ids is None or station_id in allowed_station_ids:
            current.setdefault(station_id, {})[source_fuel] = float(price)

    event_cursor = conn.execute(
        """
        SELECT date, station_id, source_fuel, price
        FROM daily_prices
        WHERE fuel = ? AND date >= ? AND date <= ?
        ORDER BY date, station_id, source_fuel
        """,
        (fuel, start_date, end_date),
    )
    next_event = event_cursor.fetchone()
    rupture_starts: dict[str, set[tuple[str, str]]] = {}
    rupture_ends: dict[str, set[tuple[str, str]]] = {}
    rupture_rows = conn.execute(
        """
        SELECT station_id, source_fuel, start_date, end_date
        FROM rupture_periods
        WHERE fuel = ?
            AND start_date <= ?
            AND (end_date = '' OR end_date >= ?)
        """,
        (fuel, end_date, start_date),
    )
    for station_id, source_fuel, rupture_start, rupture_end in rupture_rows:
        if allowed_station_ids is not None and station_id not in allowed_station_ids:
            continue
        if source_fuel not in source_fuels:
            continue
        start_key = max(rupture_start, start_date)
        rupture_starts.setdefault(start_key, set()).add((station_id, source_fuel))
        if rupture_end:
            end_key = next_iso_date(rupture_end)
            if end_key <= end_date:
                rupture_ends.setdefault(end_key, set()).add((station_id, source_fuel))

    active_ruptures: set[tuple[str, str]] = set()

    for day in iter_iso_dates(start_date, end_date):
        active_ruptures.difference_update(rupture_ends.get(day, set()))
        active_ruptures.update(rupture_starts.get(day, set()))

        while next_event is not None and next_event[0] <= day:
            event_date, station_id, source_fuel, price = next_event
            if event_date == day and (allowed_station_ids is None or station_id in allowed_station_ids):
                current.setdefault(station_id, {})[source_fuel] = float(price)
            next_event = event_cursor.fetchone()

        values: list[tuple[str, float]] = []
        rupture_station_ids: set[str] = set()
        station_ids = set(current) | {station_id for station_id, _source_fuel in active_ruptures}
        for station_id in station_ids:
            if allowed_station_ids is not None and station_id not in allowed_station_ids:
                continue
            source_prices = current.get(station_id, {})
            available_prices = [
                price
                for source_fuel, price in source_prices.items()
                if source_fuel in source_fuels and (station_id, source_fuel) not in active_ruptures
            ]
            if available_prices:
                values.append((station_id, min(available_prices)))
            elif any((station_id, source_fuel) in active_ruptures for source_fuel in source_fuels):
                rupture_station_ids.add(station_id)

        values.sort(key=lambda item: (item[1], item[0]))
        if values:
            yield (day, values, len(rupture_station_ids), len(values) + len(rupture_station_ids))


def aggregate_history(
    conn: sqlite3.Connection | None,
    start_date: str | None = None,
    end_date: str | None = None,
    allowed_station_ids: set[str] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if conn is None:
        return [], []

    rows: list[dict[str, Any]] = []
    distributions: list[dict[str, Any]] = []

    if start_date and end_date:
        for fuel in FUELS:
            for date, station_prices, rupture_count, total_stations in snapshot_price_groups(
                conn, fuel, start_date, end_date, allowed_station_ids
            ):
                prices = [price for _station_id, price in station_prices]
                rows.append(
                    {
                        "date": date,
                        "fuel": fuel,
                        "median": median(prices),
                        "count": len(prices),
                        "ruptureCount": rupture_count,
                        "totalStations": total_stations,
                        "min": round(prices[0], 3),
                        "max": round(prices[-1], 3),
                    }
                )
                distributions.append(
                    {
                        "date": date,
                        "fuel": fuel,
                        "count": len(prices),
                        "ruptureCount": rupture_count,
                        "totalStations": total_stations,
                        "median": median(prices),
                        "min": round(prices[0], 3),
                        "max": round(prices[-1], 3),
                        "bins": make_round_histogram(prices),
                    }
                )
        rows.sort(key=lambda row: (row["date"], row["fuel"]))
        distributions.sort(key=lambda row: (row["date"], row["fuel"]))
        return rows, distributions

    cursor = conn.execute(
        "SELECT date, fuel, price FROM daily_prices ORDER BY date, fuel, price"
    )

    current_key: tuple[str, str] | None = None
    prices: list[float] = []

    def push_group(key: tuple[str, str] | None, values: list[float]) -> None:
        if key is None or not values:
            return
        date, fuel = key
        rows.append(
            {
                "date": date,
                "fuel": fuel,
                "median": median(values),
                "count": len(values),
                "min": round(values[0], 3),
                "max": round(values[-1], 3),
            }
        )
        distributions.append(
            {
                "date": date,
                "fuel": fuel,
                "count": len(values),
                "median": median(values),
                "min": round(values[0], 3),
                "max": round(values[-1], 3),
                "bins": make_round_histogram(values),
            }
        )

    for date, fuel, price in cursor:
        key = (date, fuel)
        if current_key is not None and key != current_key:
            push_group(current_key, prices)
            prices = []
        current_key = key
        prices.append(float(price))

    push_group(current_key, prices)
    return rows, distributions


def current_history_rows_from_stations(stations: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for fuel in FUELS:
        fuel_entries = [
            station["fuels"].get(fuel, {})
            for station in stations.values()
            if station["fuels"].get(fuel)
        ]
        prices = [
            float(entry["price"])
            for entry in fuel_entries
            if entry.get("available") and entry.get("price") is not None
        ]
        if not prices:
            continue
        dates = [
            str(entry.get("updatedAt"))[:10]
            for entry in fuel_entries
            if entry.get("updatedAt")
        ]
        date = max(dates) if dates else datetime.now(timezone.utc).date().isoformat()
        rupture_count = sum(
            1
            for entry in fuel_entries
            if entry.get("available") is False and entry.get("reason") == "rupture"
        )
        sorted_prices = sorted(prices)
        rows.append(
            {
                "date": date,
                "fuel": fuel,
                "median": median(sorted_prices),
                "count": len(sorted_prices),
                "ruptureCount": rupture_count,
                "totalStations": len(sorted_prices) + rupture_count,
                "min": round(sorted_prices[0], 3),
                "max": round(sorted_prices[-1], 3),
            }
        )
    return rows


def merge_current_history_rows(history_rows: list[dict[str, Any]], stations: dict[str, Any]) -> list[dict[str, Any]]:
    current_rows = current_history_rows_from_stations(stations)
    if not current_rows:
        return history_rows
    by_key = {(row["date"], row["fuel"]): row for row in history_rows}
    for row in current_rows:
        by_key[(row["date"], row["fuel"])] = row
    return sorted(by_key.values(), key=lambda row: (row["date"], row["fuel"]))


def write_daily_score_files(
    conn: sqlite3.Connection | None,
    output_dir: Path,
    stations: dict[str, Any],
    metadata: dict[str, Any],
    start_date: str | None = None,
    end_date: str | None = None,
) -> None:
    if conn is None:
        return

    station_list = sorted(
        stations.values(),
        key=lambda station: (station["department"], station["city"], station["cp"], station["id"]),
    )
    station_index = {station["id"]: index for index, station in enumerate(station_list)}
    compact_stations = [
        [
            station["id"],
            station["name"],
            station["address"],
            station["city"],
            station["cp"],
            station["department"],
            station["lat"],
            station["lon"],
            station.get("brand", ""),
        ]
        for station in station_list
    ]

    for fuel in FUELS:
        # dates / date_index sont construits au fil de l'eau (streaming) pour ne
        # jamais charger toute l'annee de snapshots en memoire (limite RAM mutualise).
        dates: list[str] = []
        date_index: dict[str, int] = {}
        handles: dict[str, Any] = {}
        first_rows: dict[str, bool] = {}

        def chunk_handle(year: str) -> Any:
            handle = handles.get(year)
            if handle is None:
                handle = (output_dir / f"daily_scores_{fuel.lower()}_{year}.json").open(
                    "w", encoding="utf-8"
                )
                handle.write('{"fuel":')
                handle.write(json.dumps(fuel, ensure_ascii=False))
                handle.write(',"year":')
                handle.write(json.dumps(year, ensure_ascii=False))
                handle.write(',"rows":[')
                handles[year] = handle
                first_rows[year] = True
            return handle

        def write_chunk_row(date: str, row: list[Any]) -> None:
            year = date[:4]
            handle = chunk_handle(year)
            if not first_rows[year]:
                handle.write(",")
            handle.write(json.dumps(row, separators=(",", ":")))
            first_rows[year] = False

        def flush_group(date: str | None, values: list[tuple[str, float]]) -> None:
            if date is None or not values:
                return
            if date not in date_index:
                date_index[date] = len(dates)
                dates.append(date)
            denominator = max(len(values) - 1, 1)
            last_price: float | None = None
            last_score = 0
            for index, (station_id, price) in enumerate(values):
                if price != last_price:
                    last_price = price
                    last_score = score_for_percentile(index / denominator)
                if station_id not in station_index:
                    continue
                row = [
                    date_index[date],
                    station_index[station_id],
                    round(price, 3),
                    last_score,
                ]
                write_chunk_row(date, row)

        if start_date and end_date:
            for date, group, _rupture_count, _total_stations in snapshot_price_groups(
                conn, fuel, start_date, end_date, set(station_index)
            ):
                flush_group(date, group)
        else:
            current_date: str | None = None
            group: list[tuple[str, float]] = []
            cursor = conn.execute(
                """
                SELECT date, station_id, price
                FROM daily_prices
                WHERE fuel = ?
                ORDER BY date, price, station_id
                """,
                (fuel,),
            )
            for date, station_id, price in cursor:
                if current_date is not None and date != current_date:
                    flush_group(current_date, group)
                    group = []
                current_date = date
                group.append((station_id, float(price)))

            flush_group(current_date, group)

        for handle in handles.values():
            handle.write("]}")
            handle.close()

        chunk_years = sorted(handles.keys())
        manifest = {
            "metadata": metadata,
            "fuel": fuel,
            "dates": dates,
            "stations": compact_stations,
            "chunks": [
                {"year": year, "file": f"daily_scores_{fuel.lower()}_{year}.json"}
                for year in chunk_years
            ],
        }
        write_json(output_dir / f"daily_scores_{fuel.lower()}.json", manifest)


def write_json(path: Path, payload: Any, pretty: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    kwargs = {"ensure_ascii": False}
    if pretty:
        kwargs["indent"] = 2
    else:
        kwargs["separators"] = (",", ":")
    path.write_text(json.dumps(payload, **kwargs), encoding="utf-8")


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    build_dir = Path(".build")
    build_dir.mkdir(exist_ok=True)
    db_path = build_dir / f"daily_prices_{os.getpid()}.sqlite"

    include_history = not args.skip_history
    conn = setup_history_db(db_path) if include_history else None

    stream, source_label = source_stream(args)
    try:
        stations = parse_source(stream, history_conn=conn)
    finally:
        stream.close()

    all_station_meta = dict(stations)

    if include_history and args.history_input:
        history_stream = open_local_source(args.history_input)
        try:
            history_stations = parse_source(history_stream, history_conn=conn)
        finally:
            history_stream.close()
        for station_id, station in history_stations.items():
            all_station_meta.setdefault(station_id, station)
        source_label = f"{source_label} + history:{args.history_input}"

    history_year = datetime.now(timezone.utc).year
    history_start_year = min(args.history_start_year, history_year)
    history_start_date = f"{history_start_year}-01-01" if include_history else None
    history_end_date = datetime.now(timezone.utc).date().isoformat() if include_history else None

    if include_history and not args.no_previous_year_baseline:
        baseline_source = YEAR_URL.format(year=history_start_year - 1)
        baseline_data = read_remote(baseline_source)
        baseline_stream = io.BytesIO(first_zip_member(baseline_data))
        try:
            baseline_stations = parse_source(baseline_stream, history_conn=conn)
        finally:
            baseline_stream.close()
        for station_id, station in baseline_stations.items():
            all_station_meta.setdefault(station_id, station)
        source_label = f"{source_label} + baseline:{baseline_source}"

    if include_history:
        for archive_year in range(history_start_year, history_year):
            archive_source = YEAR_URL.format(year=archive_year)
            archive_data = read_remote(archive_source)
            archive_stream = io.BytesIO(first_zip_member(archive_data))
            try:
                archive_stations = parse_source(archive_stream, history_conn=conn)
            finally:
                archive_stream.close()
            for station_id, station in archive_stations.items():
                all_station_meta.setdefault(station_id, station)
            source_label = f"{source_label} + history:{archive_source}"

    if include_history and not args.no_current_year_history:
        year = history_year
        current_history_source = CURRENT_YEAR_URL
        try:
            current_year_data = read_remote(current_history_source)
        except Exception:
            current_history_source = YEAR_URL.format(year=year)
            current_year_data = read_remote(current_history_source)

        current_history_stream = io.BytesIO(first_zip_member(current_year_data))
        try:
            current_year_stations = parse_source(current_history_stream, history_conn=conn)
        finally:
            current_history_stream.close()
        for station_id, station in current_year_stations.items():
            all_station_meta.setdefault(station_id, station)
        source_label = f"{source_label} + current-year-history:{current_history_source}"

    brand_enrichment_count = 0
    if not args.skip_brand_enrichment:
        try:
            brand_table = fetch_brand_enrichment()
            brand_enrichment_count = apply_brand_enrichment(stations, brand_table)
            apply_brand_enrichment(all_station_meta, brand_table)
            source_label = f"{source_label} + brand-enrichment:public.opendatasoft.com/prix-des-carburants-j-1"
        except Exception as exc:  # noqa: BLE001 - brand enrichment is helpful, not critical.
            print(f"Brand enrichment skipped: {exc}", file=sys.stderr)

    fuel_stats = apply_scores(stations)
    history_rows, distributions = aggregate_history(
        conn, history_start_date, history_end_date, set(stations)
    )
    history_rows = merge_current_history_rows(history_rows, stations)

    station_list = sorted(
        stations.values(),
        key=lambda station: (station["department"], station["city"], station["cp"], station["id"]),
    )
    metadata = {
        "generatedAt": utc_now_iso(),
        "source": source_label,
        "stationCount": len(station_list),
        "historyStationCount": len(all_station_meta),
        "brandEnrichmentCount": brand_enrichment_count,
        "fuelStats": fuel_stats,
        "scoreRule": {
            "0.01": 20,
            "0.05": 19,
            "0.10": 18,
            "0.15": 17,
            "0.20": 16,
            "0.25": 15,
            "0.30": 14,
            "0.35": 13,
            "0.40": 12,
            "0.45": 11,
            "0.50": 10,
            "0.55": 9,
            "0.60": 8,
            "0.65": 7,
            "0.70": 6,
            "0.75": 5,
            "0.80": 4,
            "0.85": 3,
            "0.90": 2,
            "0.95": 1,
            "1.00": 0,
        },
    }

    write_json(args.output / "stations.json", {"metadata": metadata, "stations": station_list})
    communes: list[dict[str, Any]] = []
    try:
        communes = fetch_communes()
    except Exception as exc:  # noqa: BLE001 - city autocomplete can fall back to station cities.
        print(f"Communes skipped: {exc}", file=sys.stderr)
    write_json(
        args.output / "communes.json",
        {
            "metadata": {
                **metadata,
                "source": f"{metadata['source']} + communes:geo.api.gouv.fr",
                "communeCount": len(communes),
            },
            "communes": communes,
        },
    )

    vehicle_catalog: list[dict[str, Any]] = []
    try:
        vehicle_catalog = fetch_vehicle_catalog()
    except Exception as exc:  # noqa: BLE001 - the app keeps a small built-in fallback.
        print(f"Vehicle catalog skipped: {exc}", file=sys.stderr)
    write_json(
        args.output / "vehicle_catalog.json",
        {
            "metadata": {
                **metadata,
                "source": "ADEME Car Labelling - data.gouv.fr / data.ademe.fr",
                "vehicleCount": len(vehicle_catalog),
            },
            "vehicles": vehicle_catalog,
        },
    )
    brand_table = {
        station["id"]: {
            "name": station["name"],
            "brand": station.get("brand", ""),
            "address": station.get("address", ""),
            "city": station.get("city", ""),
            "cp": station.get("cp", ""),
        }
        for station in station_list
    }
    write_json(args.output / "station_brands.json", {"metadata": metadata, "stations": brand_table})
    write_json(args.output / "history.json", {"metadata": metadata, "history": history_rows}, pretty=True)
    write_json(
        args.output / "distributions.json",
        {"metadata": metadata, "distributions": distributions},
    )
    write_json(args.output / "metadata.json", metadata, pretty=True)
    write_daily_score_files(conn, args.output, stations, metadata, history_start_date, history_end_date)
    if conn is not None:
        conn.close()
        try:
            db_path.unlink()
        except OSError:
            pass

    print(f"Wrote {len(station_list):,} stations to {args.output / 'stations.json'}")
    print(f"Wrote {len(history_rows):,} history points to {args.output / 'history.json'}")


if __name__ == "__main__":
    main()
