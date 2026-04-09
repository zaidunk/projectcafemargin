"""
CafeMargin ML & Advanced Analytics Engine
All ML computations use pandas + numpy only (no sklearn dependency).
"""
import pandas as pd
import numpy as np
from itertools import combinations
from collections import Counter
from typing import Any


# ═══════════════════════════════════════════════════════════════════════════════
# 1. REVENUE FORECAST — Linear Regression
# ═══════════════════════════════════════════════════════════════════════════════

def forecast_revenue(df: pd.DataFrame, forecast_days: int = 7) -> dict[str, Any]:
    if df.empty:
        return {"daily_actual": [], "daily_forecast": [], "summary": {}}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    daily = df.groupby("date")["total_revenue"].sum().reset_index().sort_values("date")
    daily["day_num"] = range(len(daily))

    x = daily["day_num"].values.astype(float)
    y = daily["total_revenue"].values.astype(float)

    if len(x) < 3:
        return {"daily_actual": [], "daily_forecast": [], "summary": {}}

    # Linear regression: y = mx + b
    m, b = np.polyfit(x, y, 1)
    daily["trend"] = m * x + b

    # Forecast future
    last_date = daily["date"].max()
    last_num = daily["day_num"].max()
    future_dates = [last_date + pd.Timedelta(days=i + 1) for i in range(forecast_days)]
    future_nums = [last_num + i + 1 for i in range(forecast_days)]
    future_revenue = [max(0, m * n + b) for n in future_nums]

    # Confidence: use std of residuals
    residuals = y - (m * x + b)
    std_res = float(np.std(residuals))

    actual = [
        {"date": str(row["date"].date()), "revenue": float(row["total_revenue"]), "trend": float(row["trend"])}
        for _, row in daily.iterrows()
    ]
    forecast = [
        {
            "date": str(d.date()),
            "revenue": float(r),
            "lower": float(max(0, r - 1.96 * std_res)),
            "upper": float(r + 1.96 * std_res),
        }
        for d, r in zip(future_dates, future_revenue)
    ]

    return {
        "daily_actual": actual,
        "daily_forecast": forecast,
        "summary": {
            "trend_direction": "naik" if m > 0 else "turun",
            "daily_growth": float(m),
            "forecast_total": float(sum(future_revenue)),
            "confidence_std": float(std_res),
            "r_squared": float(1 - np.sum(residuals ** 2) / np.sum((y - np.mean(y)) ** 2)) if np.sum((y - np.mean(y)) ** 2) > 0 else 0,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2. DISCOUNT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_discounts(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "discount" not in df.columns:
        return {"summary": {}, "by_date": [], "by_hour": [], "effectiveness": []}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["discount"] = pd.to_numeric(df.get("discount", 0), errors="coerce").fillna(0)
    df["gross_sales"] = pd.to_numeric(df.get("gross_sales", 0), errors="coerce").fillna(0)

    has_discount = df[df["discount"] > 0]
    no_discount = df[df["discount"] == 0]

    total_discount = float(df["discount"].sum())
    total_gross = float(df["gross_sales"].sum()) if df["gross_sales"].sum() > 0 else float(df["total_revenue"].sum())

    # By date
    by_date = df.groupby("date").agg(
        total_discount=("discount", "sum"),
        total_revenue=("total_revenue", "sum"),
        gross_sales=("gross_sales", "sum"),
    ).reset_index().sort_values("date")
    by_date_list = [
        {"date": str(r["date"].date()), "discount": float(r["total_discount"]),
         "revenue": float(r["total_revenue"]), "discount_pct": float(r["total_discount"] / r["gross_sales"] * 100) if r["gross_sales"] > 0 else 0}
        for _, r in by_date.iterrows()
    ]

    # By hour
    by_hour = df.groupby("hour").agg(
        total_discount=("discount", "sum"), count=("discount", "count"),
    ).reset_index()
    by_hour_list = [
        {"hour": int(r["hour"]), "discount": float(r["total_discount"]), "count": int(r["count"])}
        for _, r in by_hour.iterrows()
    ]

    # Effectiveness: compare avg revenue with vs without discount
    avg_with = float(has_discount["total_revenue"].mean()) if len(has_discount) > 0 else 0
    avg_without = float(no_discount["total_revenue"].mean()) if len(no_discount) > 0 else 0

    return {
        "summary": {
            "total_discount": total_discount,
            "discount_pct": float(total_discount / total_gross * 100) if total_gross > 0 else 0,
            "transactions_with_discount": len(has_discount),
            "transactions_without_discount": len(no_discount),
            "avg_revenue_with_discount": avg_with,
            "avg_revenue_without_discount": avg_without,
            "discount_roi": float((avg_with - avg_without) / avg_with * 100) if avg_with > 0 else 0,
        },
        "by_date": by_date_list,
        "by_hour": by_hour_list,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 3. STAFF PERFORMANCE
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_staff(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "collected_by" not in df.columns:
        return {"staff_ranking": [], "by_hour": [], "summary": {}}

    df = df.copy()
    df["collected_by"] = df["collected_by"].fillna("Unknown").astype(str).str.strip()
    df = df[df["collected_by"] != ""]

    if df.empty:
        return {"staff_ranking": [], "by_hour": [], "summary": {}}

    ranking = df.groupby("collected_by").agg(
        total_revenue=("total_revenue", "sum"),
        total_transactions=("total_revenue", "count"),
        total_qty=("quantity", "sum"),
        avg_transaction=("total_revenue", "mean"),
    ).reset_index().sort_values("total_revenue", ascending=False)

    staff_ranking = [
        {
            "staff": r["collected_by"],
            "total_revenue": float(r["total_revenue"]),
            "total_transactions": int(r["total_transactions"]),
            "total_qty": int(r["total_qty"]),
            "avg_transaction": float(r["avg_transaction"]),
        }
        for _, r in ranking.iterrows()
    ]

    # Staff by hour heatmap
    pivot = df.groupby(["collected_by", "hour"])["total_revenue"].sum().reset_index()
    by_hour = [
        {"staff": r["collected_by"], "hour": int(r["hour"]), "revenue": float(r["total_revenue"])}
        for _, r in pivot.iterrows()
    ]

    return {
        "staff_ranking": staff_ranking,
        "by_hour": by_hour,
        "summary": {
            "total_staff": len(ranking),
            "top_performer": staff_ranking[0]["staff"] if staff_ranking else "",
            "avg_revenue_per_staff": float(ranking["total_revenue"].mean()) if len(ranking) > 0 else 0,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. BASKET ANALYSIS — Association Rules
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_baskets(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "receipt_number" not in df.columns:
        return {"item_pairs": [], "basket_stats": {}, "top_bundles": []}

    df = df.copy()
    df["receipt_number"] = df["receipt_number"].fillna("").astype(str).str.strip()
    df = df[df["receipt_number"] != ""]

    # Group items by receipt
    baskets = df.groupby("receipt_number")["item_name"].apply(list).to_dict()

    # Basket size stats
    sizes = [len(v) for v in baskets.values()]
    basket_stats = {
        "total_baskets": len(baskets),
        "avg_basket_size": float(np.mean(sizes)) if sizes else 0,
        "max_basket_size": int(max(sizes)) if sizes else 0,
        "single_item_pct": float(sum(1 for s in sizes if s == 1) / len(sizes) * 100) if sizes else 0,
    }

    # Count item pairs (association rules)
    pair_counter = Counter()
    for items in baskets.values():
        unique_items = sorted(set(items))
        if len(unique_items) >= 2:
            for pair in combinations(unique_items, 2):
                pair_counter[pair] += 1

    # Calculate support and confidence
    n_baskets = len(baskets)
    item_freq = Counter()
    for items in baskets.values():
        for item in set(items):
            item_freq[item] += 1

    item_pairs = []
    for (a, b), count in pair_counter.most_common(20):
        support = count / n_baskets if n_baskets > 0 else 0
        conf_a_to_b = count / item_freq[a] if item_freq[a] > 0 else 0
        conf_b_to_a = count / item_freq[b] if item_freq[b] > 0 else 0
        item_pairs.append({
            "item_a": a, "item_b": b, "count": count,
            "support": float(support),
            "confidence_a_to_b": float(conf_a_to_b),
            "confidence_b_to_a": float(conf_b_to_a),
        })

    # Top bundle suggestions
    top_bundles = []
    for pair in item_pairs[:5]:
        a, b = pair["item_a"], pair["item_b"]
        rev_a = float(df[df["item_name"] == a]["unit_price"].mean())
        rev_b = float(df[df["item_name"] == b]["unit_price"].mean())
        bundle_price = (rev_a + rev_b) * 0.9  # 10% discount
        top_bundles.append({
            "items": [a, b],
            "frequency": pair["count"],
            "individual_total": float(rev_a + rev_b),
            "suggested_bundle_price": float(bundle_price),
            "discount_pct": 10,
        })

    return {"item_pairs": item_pairs, "basket_stats": basket_stats, "top_bundles": top_bundles}


# ═══════════════════════════════════════════════════════════════════════════════
# 5. ANOMALY DETECTION — IQR Method
# ═══════════════════════════════════════════════════════════════════════════════

def detect_anomalies(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty:
        return {"anomalies": [], "summary": {}, "by_type": []}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    anomalies = []

    # Revenue anomalies per receipt
    if "receipt_number" in df.columns:
        receipt_rev = df.groupby("receipt_number")["total_revenue"].sum()
        q1, q3 = receipt_rev.quantile(0.25), receipt_rev.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr

        for receipt, rev in receipt_rev.items():
            if rev < lower or rev > upper:
                tx = df[df["receipt_number"] == receipt].iloc[0]
                anomalies.append({
                    "type": "revenue_outlier",
                    "receipt": str(receipt),
                    "date": str(tx["date"].date()) if hasattr(tx["date"], "date") else str(tx["date"]),
                    "hour": int(tx["hour"]),
                    "value": float(rev),
                    "threshold_lower": float(lower),
                    "threshold_upper": float(upper),
                    "severity": "high" if rev > upper * 1.5 or rev < lower * 0.5 else "medium",
                })

    # Hourly volume anomalies
    daily_hourly = df.groupby(["date", "hour"]).size().reset_index(name="count")
    for hour in range(24):
        hourly = daily_hourly[daily_hourly["hour"] == hour]["count"]
        if len(hourly) < 3:
            continue
        q1, q3 = hourly.quantile(0.25), hourly.quantile(0.75)
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        for _, row in daily_hourly[(daily_hourly["hour"] == hour) & (daily_hourly["count"] > upper)].iterrows():
            anomalies.append({
                "type": "volume_spike",
                "date": str(row["date"].date()) if hasattr(row["date"], "date") else str(row["date"]),
                "hour": int(row["hour"]),
                "value": int(row["count"]),
                "threshold_upper": float(upper),
                "severity": "medium",
            })

    # Limit results
    anomalies = sorted(anomalies, key=lambda x: abs(x["value"]), reverse=True)[:50]

    by_type = Counter(a["type"] for a in anomalies)
    return {
        "anomalies": anomalies,
        "summary": {
            "total_anomalies": len(anomalies),
            "high_severity": sum(1 for a in anomalies if a.get("severity") == "high"),
            "medium_severity": sum(1 for a in anomalies if a.get("severity") == "medium"),
        },
        "by_type": [{"type": k, "count": v} for k, v in by_type.items()],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 6. SALES COMPARISON — Period over Period
# ═══════════════════════════════════════════════════════════════════════════════

def compare_periods(df: pd.DataFrame, period_days: int = 30) -> dict[str, Any]:
    if df.empty:
        return {"current": {}, "previous": {}, "comparison": [], "wow": []}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    max_date = df["date"].max()
    mid_date = max_date - pd.Timedelta(days=period_days)
    start_date = mid_date - pd.Timedelta(days=period_days)

    current = df[df["date"] > mid_date]
    previous = df[(df["date"] > start_date) & (df["date"] <= mid_date)]

    def summarize(d):
        if d.empty:
            return {"revenue": 0, "transactions": 0, "avg_transaction": 0, "unique_items": 0}
        return {
            "revenue": float(d["total_revenue"].sum()),
            "transactions": int(len(d)),
            "avg_transaction": float(d["total_revenue"].mean()),
            "unique_items": int(d["item_name"].nunique()),
        }

    cur_s = summarize(current)
    prev_s = summarize(previous)

    def pct_change(cur, prev):
        return float((cur - prev) / prev * 100) if prev > 0 else 0

    comparison = [
        {"metric": "Revenue", "current": cur_s["revenue"], "previous": prev_s["revenue"],
         "change_pct": pct_change(cur_s["revenue"], prev_s["revenue"])},
        {"metric": "Transaksi", "current": cur_s["transactions"], "previous": prev_s["transactions"],
         "change_pct": pct_change(cur_s["transactions"], prev_s["transactions"])},
        {"metric": "Avg Transaksi", "current": cur_s["avg_transaction"], "previous": prev_s["avg_transaction"],
         "change_pct": pct_change(cur_s["avg_transaction"], prev_s["avg_transaction"])},
        {"metric": "Item Unik", "current": cur_s["unique_items"], "previous": prev_s["unique_items"],
         "change_pct": pct_change(cur_s["unique_items"], prev_s["unique_items"])},
    ]

    # Week-over-week
    df["week"] = df["date"].dt.isocalendar().week.astype(int)
    wow = df.groupby("week").agg(
        revenue=("total_revenue", "sum"), transactions=("total_revenue", "count"),
    ).reset_index()
    wow_list = [
        {"week": int(r["week"]), "revenue": float(r["revenue"]), "transactions": int(r["transactions"])}
        for _, r in wow.iterrows()
    ]

    return {"current": cur_s, "previous": prev_s, "comparison": comparison, "wow": wow_list}


# ═══════════════════════════════════════════════════════════════════════════════
# 7. CUSTOMER INSIGHTS — RFM-like from Receipts
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_customers(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "receipt_number" not in df.columns:
        return {"segments": [], "stats": {}, "hourly_pattern": []}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Approximate "customers" by receipt patterns
    receipt_data = df.groupby("receipt_number").agg(
        date=("date", "max"),
        total_revenue=("total_revenue", "sum"),
        items=("item_name", "count"),
        hour=("hour", "first"),
    ).reset_index()

    max_date = df["date"].max()
    receipt_data["recency_days"] = (max_date - receipt_data["date"]).dt.days

    # Segment by spending
    q33 = receipt_data["total_revenue"].quantile(0.33)
    q66 = receipt_data["total_revenue"].quantile(0.66)

    def segment(row):
        if row["total_revenue"] >= q66 and row["items"] >= 3:
            return "VIP"
        elif row["total_revenue"] >= q33:
            return "Regular"
        elif row["items"] == 1:
            return "Quick Buyer"
        else:
            return "Casual"

    receipt_data["segment"] = receipt_data.apply(segment, axis=1)

    seg_stats = receipt_data.groupby("segment").agg(
        count=("receipt_number", "count"),
        avg_revenue=("total_revenue", "mean"),
        avg_items=("items", "mean"),
    ).reset_index()

    segments = [
        {
            "segment": r["segment"], "count": int(r["count"]),
            "avg_revenue": float(r["avg_revenue"]), "avg_items": float(r["avg_items"]),
            "pct": float(r["count"] / len(receipt_data) * 100),
        }
        for _, r in seg_stats.iterrows()
    ]

    # Hourly pattern
    hourly = receipt_data.groupby("hour").agg(
        count=("receipt_number", "count"), avg_revenue=("total_revenue", "mean"),
    ).reset_index()
    hourly_pattern = [
        {"hour": int(r["hour"]), "count": int(r["count"]), "avg_revenue": float(r["avg_revenue"])}
        for _, r in hourly.iterrows()
    ]

    return {
        "segments": segments,
        "stats": {
            "total_receipts": len(receipt_data),
            "avg_basket_value": float(receipt_data["total_revenue"].mean()),
            "avg_items_per_basket": float(receipt_data["items"].mean()),
        },
        "hourly_pattern": hourly_pattern,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 8. PAYMENT INSIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_payments(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or "payment_method" not in df.columns:
        return {"breakdown": [], "trends": [], "by_hour": [], "summary": {}}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["payment_method"] = df["payment_method"].fillna("Unknown").astype(str).str.strip()
    df = df[df["payment_method"] != ""]

    # Breakdown
    breakdown = df.groupby("payment_method").agg(
        revenue=("total_revenue", "sum"), count=("total_revenue", "count"),
        avg_value=("total_revenue", "mean"),
    ).reset_index().sort_values("revenue", ascending=False)
    total_rev = float(df["total_revenue"].sum())

    breakdown_list = [
        {
            "method": r["payment_method"], "revenue": float(r["revenue"]),
            "count": int(r["count"]), "avg_value": float(r["avg_value"]),
            "pct": float(r["revenue"] / total_rev * 100) if total_rev > 0 else 0,
        }
        for _, r in breakdown.iterrows()
    ]

    # Trends by date
    trends = df.groupby(["date", "payment_method"])["total_revenue"].sum().reset_index()
    trends_list = [
        {"date": str(r["date"].date()), "method": r["payment_method"], "revenue": float(r["total_revenue"])}
        for _, r in trends.iterrows()
    ]

    # By hour
    by_hour = df.groupby(["hour", "payment_method"]).size().reset_index(name="count")
    by_hour_list = [
        {"hour": int(r["hour"]), "method": r["payment_method"], "count": int(r["count"])}
        for _, r in by_hour.iterrows()
    ]

    digital_pct = sum(b["pct"] for b in breakdown_list if b["method"].lower() not in ("cash", "tunai"))

    return {
        "breakdown": breakdown_list,
        "trends": trends_list,
        "by_hour": by_hour_list,
        "summary": {
            "total_methods": len(breakdown_list),
            "top_method": breakdown_list[0]["method"] if breakdown_list else "",
            "digital_pct": float(digital_pct),
            "cash_pct": float(100 - digital_pct),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 9. INVENTORY FORECAST
# ═══════════════════════════════════════════════════════════════════════════════

def forecast_inventory(df: pd.DataFrame, forecast_days: int = 7) -> dict[str, Any]:
    if df.empty:
        return {"items": [], "summary": {}}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    n_days = (df["date"].max() - df["date"].min()).days + 1
    if n_days < 1:
        n_days = 1

    item_velocity = df.groupby("item_name").agg(
        total_qty=("quantity", "sum"),
        total_revenue=("total_revenue", "sum"),
        days_active=("date", "nunique"),
    ).reset_index()

    item_velocity["daily_avg"] = item_velocity["total_qty"] / n_days
    item_velocity["forecast_qty"] = item_velocity["daily_avg"] * forecast_days
    item_velocity["velocity"] = item_velocity.apply(
        lambda r: "fast" if r["daily_avg"] > item_velocity["daily_avg"].quantile(0.75)
        else "slow" if r["daily_avg"] < item_velocity["daily_avg"].quantile(0.25)
        else "medium", axis=1
    )
    item_velocity = item_velocity.sort_values("daily_avg", ascending=False)

    items = [
        {
            "item_name": r["item_name"],
            "total_qty": int(r["total_qty"]),
            "daily_avg": float(round(r["daily_avg"], 1)),
            "forecast_qty": int(np.ceil(r["forecast_qty"])),
            "velocity": r["velocity"],
            "days_active": int(r["days_active"]),
        }
        for _, r in item_velocity.iterrows()
    ]

    return {
        "items": items,
        "summary": {
            "total_items": len(items),
            "fast_movers": sum(1 for i in items if i["velocity"] == "fast"),
            "slow_movers": sum(1 for i in items if i["velocity"] == "slow"),
            "forecast_days": forecast_days,
            "data_days": n_days,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 10. PROMO SIMULATOR — What-if Analysis
# ═══════════════════════════════════════════════════════════════════════════════

def simulate_promo(df: pd.DataFrame, item_name: str = "", discount_pct: float = 10, volume_boost_pct: float = 20) -> dict[str, Any]:
    if df.empty:
        return {"items": [], "simulation": {}}

    df = df.copy()

    # List available items for simulation
    item_stats = df.groupby("item_name").agg(
        total_qty=("quantity", "sum"),
        total_revenue=("total_revenue", "sum"),
        avg_price=("unit_price", "mean"),
        avg_hpp=("hpp", "mean"),
    ).reset_index().sort_values("total_revenue", ascending=False)

    items_list = [
        {"item_name": r["item_name"], "total_qty": int(r["total_qty"]),
         "total_revenue": float(r["total_revenue"]), "avg_price": float(r["avg_price"]),
         "avg_hpp": float(r["avg_hpp"])}
        for _, r in item_stats.iterrows()
    ]

    simulation = {}
    if item_name:
        item_data = item_stats[item_stats["item_name"] == item_name]
        if not item_data.empty:
            row = item_data.iloc[0]
            orig_price = float(row["avg_price"])
            orig_qty = int(row["total_qty"])
            orig_hpp = float(row["avg_hpp"])
            orig_revenue = float(row["total_revenue"])
            orig_profit = (orig_price - orig_hpp) * orig_qty

            new_price = orig_price * (1 - discount_pct / 100)
            new_qty = int(orig_qty * (1 + volume_boost_pct / 100))
            new_revenue = new_price * new_qty
            new_profit = (new_price - orig_hpp) * new_qty

            simulation = {
                "item_name": item_name,
                "original": {
                    "price": orig_price, "qty": orig_qty,
                    "revenue": orig_revenue, "profit": orig_profit,
                    "margin_pct": float((orig_price - orig_hpp) / orig_price * 100) if orig_price > 0 else 0,
                },
                "simulated": {
                    "price": float(new_price), "qty": new_qty,
                    "revenue": float(new_revenue), "profit": float(new_profit),
                    "margin_pct": float((new_price - orig_hpp) / new_price * 100) if new_price > 0 else 0,
                },
                "impact": {
                    "revenue_change": float(new_revenue - orig_revenue),
                    "revenue_change_pct": float((new_revenue - orig_revenue) / orig_revenue * 100) if orig_revenue > 0 else 0,
                    "profit_change": float(new_profit - orig_profit),
                    "profit_change_pct": float((new_profit - orig_profit) / orig_profit * 100) if orig_profit > 0 else 0,
                    "breakeven_volume": int(np.ceil(orig_profit / (new_price - orig_hpp))) if (new_price - orig_hpp) > 0 else 0,
                },
            }

    return {"items": items_list, "simulation": simulation}


# ═══════════════════════════════════════════════════════════════════════════════
# 11. MENU OPTIMIZER — ML-based Suggestions
# ═══════════════════════════════════════════════════════════════════════════════

def optimize_menu(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty:
        return {"suggestions": [], "clusters": [], "pricing_analysis": []}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    n_days = max(1, (df["date"].max() - df["date"].min()).days + 1)

    item_data = df.groupby("item_name").agg(
        total_revenue=("total_revenue", "sum"),
        total_qty=("quantity", "sum"),
        avg_price=("unit_price", "mean"),
        avg_hpp=("hpp", "mean"),
        days_sold=("date", "nunique"),
    ).reset_index()

    item_data["margin_pct"] = np.where(
        item_data["avg_price"] > 0,
        (item_data["avg_price"] - item_data["avg_hpp"]) / item_data["avg_price"] * 100,
        0,
    )
    item_data["daily_qty"] = item_data["total_qty"] / n_days
    item_data["consistency"] = item_data["days_sold"] / n_days * 100  # % days this item was sold

    # Simple clustering: categorize by revenue percentile + margin
    rev_med = item_data["total_revenue"].median()
    margin_med = item_data["margin_pct"].median()
    qty_med = item_data["daily_qty"].median()

    suggestions = []
    clusters = []
    for _, r in item_data.iterrows():
        high_rev = r["total_revenue"] >= rev_med
        high_margin = r["margin_pct"] >= margin_med
        high_demand = r["daily_qty"] >= qty_med

        if high_rev and high_margin and high_demand:
            cluster = "champion"
            action = "Pertahankan. Promosikan lebih aktif."
        elif high_rev and not high_margin:
            cluster = "volume_trap"
            action = f"Margin rendah ({r['margin_pct']:.0f}%). Naikkan harga atau turunkan HPP."
        elif high_margin and not high_rev:
            cluster = "hidden_gem"
            action = "Margin tinggi tapi kurang laku. Gencarkan promosi."
        elif r["consistency"] < 30:
            cluster = "inconsistent"
            action = f"Hanya terjual {r['consistency']:.0f}% hari. Pertimbangkan hapus dari menu."
        elif not high_rev and not high_margin:
            cluster = "underperformer"
            action = "Revenue & margin rendah. Evaluasi untuk dikeluarkan dari menu."
        else:
            cluster = "stable"
            action = "Performa stabil. Pantau secara berkala."

        # Pricing suggestion
        target_margin = 40
        suggested_price = r["avg_hpp"] / (1 - target_margin / 100) if r["avg_hpp"] > 0 else r["avg_price"]

        item_entry = {
            "item_name": r["item_name"],
            "total_revenue": float(r["total_revenue"]),
            "total_qty": int(r["total_qty"]),
            "avg_price": float(r["avg_price"]),
            "avg_hpp": float(r["avg_hpp"]),
            "margin_pct": float(r["margin_pct"]),
            "daily_qty": float(round(r["daily_qty"], 1)),
            "consistency": float(round(r["consistency"], 1)),
            "cluster": cluster,
            "action": action,
            "suggested_price": float(round(suggested_price, -2)),  # round to nearest 100
        }
        clusters.append(item_entry)

        if cluster in ("volume_trap", "hidden_gem", "inconsistent", "underperformer"):
            suggestions.append(item_entry)

    # Sort: worst performers first
    suggestions.sort(key=lambda x: x["margin_pct"])

    return {
        "suggestions": suggestions[:15],
        "clusters": clusters,
        "pricing_analysis": [
            c for c in clusters if abs(c["suggested_price"] - c["avg_price"]) > 1000
        ][:10],
    }
