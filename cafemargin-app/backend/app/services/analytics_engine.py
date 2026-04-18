import pandas as pd
import numpy as np
from typing import Any, Optional, Iterable


def process_transactions(df: pd.DataFrame, include: Optional[Iterable[str]] = None) -> dict[str, Any]:
    """
    Core analytics engine.
    Input: DataFrame dengan kolom: date, hour, item_name, category, quantity, unit_price, hpp, total_revenue
    Output: dict berisi semua analytics results
    """
    include_set = set(include) if include is not None else None
    if df.empty:
        empty = _empty_result()
        if include_set is None:
            return empty
        return {key: empty.get(key) for key in include_set}

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["gross_profit"] = (df["unit_price"] - df["hpp"]) * df["quantity"]
    df["margin_pct"] = np.where(
        df["unit_price"] > 0,
        ((df["unit_price"] - df["hpp"]) / df["unit_price"] * 100).clip(lower=-999),
        0
    )

    def want(key: str) -> bool:
        return include_set is None or key in include_set

    results: dict[str, Any] = {}
    if want("summary"):
        results["summary"] = _summary(df)
    if want("revenue_by_date"):
        results["revenue_by_date"] = _revenue_by_date(df)
    if want("revenue_by_hour"):
        results["revenue_by_hour"] = _revenue_by_hour(df)
    if want("revenue_by_day_of_week"):
        results["revenue_by_day_of_week"] = _revenue_by_dow(df)
    if want("margin_by_item"):
        results["margin_by_item"] = _margin_by_item(df)
    if want("margin_snapshot"):
        results["margin_snapshot"] = _margin_snapshot(df)
    if want("top_leakages"):
        results["top_leakages"] = _top_leakages(df)
    if want("golden_hours"):
        results["golden_hours"] = _golden_hours(df)
    if want("dead_hours"):
        results["dead_hours"] = _dead_hours(df)
    if want("menu_matrix"):
        results["menu_matrix"] = _menu_matrix(df)
    if want("top_items_by_revenue"):
        results["top_items_by_revenue"] = _top_items(df, "total_revenue", 10)
    if want("top_items_by_qty"):
        results["top_items_by_qty"] = _top_items(df, "quantity", 10)
    if want("category_breakdown"):
        results["category_breakdown"] = _category_breakdown(df)
    if want("payment_method_breakdown"):
        results["payment_method_breakdown"] = _payment_method_breakdown(df)
    if want("purchase_behavior"):
        results["purchase_behavior"] = _purchase_behavior(df)
    if want("revenue_by_month"):
        results["revenue_by_month"] = _revenue_by_month(df)
    if want("revenue_by_week"):
        results["revenue_by_week"] = _revenue_by_week(df)
    if want("category_contribution"):
        results["category_contribution"] = _category_contribution(df)
    return results


def _summary(df: pd.DataFrame) -> dict:
    if "receipt_number" in df.columns and df["receipt_number"].astype(str).str.strip().ne("").any():
        total_transactions = int(df.loc[df["receipt_number"].astype(str).str.strip() != "", "receipt_number"].nunique())
    else:
        total_transactions = int(len(df))
    return {
        "total_revenue": float(df["total_revenue"].sum()),
        "total_transactions": total_transactions,
        "total_line_items": int(len(df)),
        "total_qty": int(df["quantity"].sum()),
        "avg_transaction_value": float(df["total_revenue"].mean()),
        "total_gross_profit": float(df["gross_profit"].sum()),
        "overall_margin_pct": float(
            df["gross_profit"].sum() / df["total_revenue"].sum() * 100
        ) if df["total_revenue"].sum() > 0 else 0,
        "unique_items": int(df["item_name"].nunique()),
        "date_range_start": str(df["date"].min().date()),
        "date_range_end": str(df["date"].max().date()),
    }


def _revenue_by_date(df: pd.DataFrame) -> list[dict]:
    if "receipt_number" in df.columns:
        df2 = df.copy()
        df2["receipt_number"] = df2["receipt_number"].astype(str).str.strip()
        grouped = df2.groupby("date").agg(
            revenue=("total_revenue", "sum"),
            transactions=("receipt_number", lambda s: s[s != ""].nunique() or len(s)),
        ).reset_index().sort_values("date")
    else:
        grouped = df.groupby("date").agg(
            revenue=("total_revenue", "sum"),
            transactions=("id", "count") if "id" in df.columns else ("total_revenue", "count"),
        ).reset_index().sort_values("date")
    return [
        {"date": str(row["date"].date()), "revenue": float(row["revenue"]), "transactions": int(row["transactions"])}
        for _, row in grouped.iterrows()
    ]


def _revenue_by_hour(df: pd.DataFrame) -> list[dict]:
    grouped = (
        df.groupby("hour")
        .agg(revenue=("total_revenue", "sum"), avg_revenue=("total_revenue", "mean"))
        .reset_index()
    )
    # Fill missing hours 0-23
    all_hours = pd.DataFrame({"hour": range(24)})
    grouped = all_hours.merge(grouped, on="hour", how="left").fillna(0)
    return [
        {"hour": int(row["hour"]), "revenue": float(row["revenue"]), "avg_revenue": float(row["avg_revenue"])}
        for _, row in grouped.iterrows()
    ]


def _revenue_by_dow(df: pd.DataFrame) -> list[dict]:
    dow_map = {0: "Senin", 1: "Selasa", 2: "Rabu", 3: "Kamis", 4: "Jumat", 5: "Sabtu", 6: "Minggu"}
    df = df.copy()
    df["dow"] = df["date"].dt.dayofweek
    grouped = df.groupby("dow").agg(revenue=("total_revenue", "sum")).reset_index()
    all_days = pd.DataFrame({"dow": range(7)})
    grouped = all_days.merge(grouped, on="dow", how="left").fillna(0)
    return [
        {"day": dow_map[int(row["dow"])], "dow": int(row["dow"]), "revenue": float(row["revenue"])}
        for _, row in grouped.iterrows()
    ]


def _margin_by_item(df: pd.DataFrame) -> list[dict]:
    grouped = (
        df.groupby("item_name")
        .agg(
            total_revenue=("total_revenue", "sum"),
            total_qty=("quantity", "sum"),
            total_gross_profit=("gross_profit", "sum"),
            avg_unit_price=("unit_price", "mean"),
            avg_hpp=("hpp", "mean"),
        )
        .reset_index()
    )
    grouped["margin_pct"] = (grouped["total_gross_profit"] / grouped["total_revenue"] * 100).fillna(0)
    grouped = grouped.sort_values("margin_pct", ascending=True)
    return [
        {
            "item_name": row["item_name"],
            "total_revenue": float(row["total_revenue"]),
            "total_qty": int(row["total_qty"]),
            "total_gross_profit": float(row["total_gross_profit"]),
            "avg_unit_price": float(row["avg_unit_price"]),
            "avg_hpp": float(row["avg_hpp"]),
            "margin_pct": float(row["margin_pct"]),
        }
        for _, row in grouped.iterrows()
    ]


def _margin_snapshot(df: pd.DataFrame) -> dict:
    total_revenue = float(df["total_revenue"].sum())
    total_hpp_cost = float((df["hpp"] * df["quantity"]).sum())
    gross_profit = total_revenue - total_hpp_cost
    margin_pct = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    return {
        "total_revenue": total_revenue,
        "total_hpp_cost": total_hpp_cost,
        "gross_profit": gross_profit,
        "margin_pct": float(margin_pct),
        "waterfall": [
            {"name": "Total Revenue", "value": total_revenue},
            {"name": "HPP / COGS", "value": -total_hpp_cost},
            {"name": "Gross Profit", "value": gross_profit},
        ],
    }


def _top_leakages(df: pd.DataFrame) -> list[dict]:
    """Identify top 5 margin leakages — items with lowest or negative margin"""
    item_margin = _margin_by_item(df)
    # Filter items with significant volume (at least 1% of total revenue)
    total_rev = sum(i["total_revenue"] for i in item_margin)
    significant = [i for i in item_margin if i["total_revenue"] >= total_rev * 0.01]
    leakages = sorted(significant, key=lambda x: x["margin_pct"])[:5]
    for leak in leakages:
        rev = leak["total_revenue"]
        avg_price = leak["avg_unit_price"]
        avg_hpp = leak["avg_hpp"]
        if avg_price > 0:
            # Calculate suggested price increase to reach 40% margin
            target_margin = 0.40
            suggested_price = avg_hpp / (1 - target_margin) if avg_hpp > 0 else avg_price
            leak["suggested_price"] = float(suggested_price)
            leak["price_increase_pct"] = float((suggested_price - avg_price) / avg_price * 100) if avg_price > 0 else 0
        leak["leakage_type"] = (
            "Margin negatif" if leak["margin_pct"] < 0
            else "Margin sangat rendah" if leak["margin_pct"] < 20
            else "Margin di bawah target"
        )
    return leakages


def _golden_hours(df: pd.DataFrame) -> list[int]:
    """Hours where revenue is above the 75th percentile"""
    hourly = df.groupby("hour")["total_revenue"].sum()
    threshold = hourly.quantile(0.75)
    return sorted([int(h) for h in hourly[hourly >= threshold].index.tolist()])


def _dead_hours(df: pd.DataFrame) -> list[int]:
    """Hours where revenue is below the 25th percentile"""
    hourly = df.groupby("hour")["total_revenue"].sum()
    # Only consider hours that have any transactions
    hourly = hourly[hourly > 0]
    threshold = hourly.quantile(0.25)
    return sorted([int(h) for h in hourly[hourly <= threshold].index.tolist()])


def _menu_matrix(df: pd.DataFrame) -> list[dict]:
    """BCG-style matrix: high/low revenue × high/low margin"""
    item_data = {}
    for item in _margin_by_item(df):
        item_data[item["item_name"]] = item

    revenues = [v["total_revenue"] for v in item_data.values()]
    margins = [v["margin_pct"] for v in item_data.values()]

    if not revenues:
        return []

    rev_median = float(np.median(revenues))
    margin_median = float(np.median(margins))

    result = []
    for name, data in item_data.items():
        rev = data["total_revenue"]
        margin = data["margin_pct"]
        if rev >= rev_median and margin >= margin_median:
            quadrant = "stars"
            label = "Stars"
            action = "Pertahankan & tingkatkan promosi"
        elif rev >= rev_median and margin < margin_median:
            quadrant = "cash_cows"
            label = "Cash Cows"
            action = "Efisiensi HPP atau naikkan harga"
        elif rev < rev_median and margin >= margin_median:
            quadrant = "question_marks"
            label = "Question Marks"
            action = "Promosikan lebih aktif"
        else:
            quadrant = "dogs"
            label = "Dogs"
            action = "Evaluasi atau hapus dari menu"
        result.append({
            "item_name": name,
            "total_revenue": float(rev),
            "margin_pct": float(margin),
            "quadrant": quadrant,
            "label": label,
            "action": action,
        })
    return result


def _top_items(df: pd.DataFrame, by: str, n: int) -> list[dict]:
    grouped = df.groupby("item_name").agg(
        total_revenue=("total_revenue", "sum"),
        total_qty=("quantity", "sum"),
    ).reset_index()
    sort_key = "total_qty" if by == "quantity" else by
    grouped = grouped.sort_values(sort_key, ascending=False).head(n)
    return [
        {"item_name": row["item_name"], "total_revenue": float(row["total_revenue"]), "total_qty": int(row["total_qty"])}
        for _, row in grouped.iterrows()
    ]


def _category_breakdown(df: pd.DataFrame) -> list[dict]:
    grouped = df.groupby("category").agg(
        total_revenue=("total_revenue", "sum"),
        total_qty=("quantity", "sum"),
    ).reset_index().sort_values("total_revenue", ascending=False)
    return [
        {"category": row["category"] or "Lainnya", "total_revenue": float(row["total_revenue"]), "total_qty": int(row["total_qty"])}
        for _, row in grouped.iterrows()
    ]


def _payment_method_breakdown(df: pd.DataFrame) -> list[dict]:
    if "payment_method" not in df.columns:
        return []
    grouped = df.groupby("payment_method").agg(
        total_revenue=("total_revenue", "sum"),
        total_qty=("quantity", "sum"),
    ).reset_index().sort_values("total_revenue", ascending=False)
    grouped = grouped[grouped["payment_method"].notna() & (grouped["payment_method"] != "")]
    return [
        {"payment_method": row["payment_method"], "total_revenue": float(row["total_revenue"]), "total_qty": int(row["total_qty"])}
        for _, row in grouped.iterrows()
    ]


def _purchase_behavior(df: pd.DataFrame) -> dict:
    """Purchase behavior: solo vs multi, basket value by item count, avg items per tx"""
    if "receipt_number" not in df.columns or df["receipt_number"].isna().all():
        return {
            "avg_items_per_tx": 0, "solo_pct": 0, "multi_pct": 0,
            "basket_value_by_count": [], "item_count_distribution": [],
        }
    df2 = df.copy()
    df2["receipt_number"] = df2["receipt_number"].fillna("").astype(str).str.strip()
    df2 = df2[df2["receipt_number"] != ""]
    if df2.empty:
        return {"avg_items_per_tx": 0, "solo_pct": 0, "multi_pct": 0, "basket_value_by_count": [], "item_count_distribution": []}

    items_per_tx = df2.groupby("receipt_number")["item_name"].nunique()
    sales_per_tx = df2.groupby("receipt_number")["total_revenue"].sum()
    tx_df = pd.DataFrame({"items": items_per_tx, "sales": sales_per_tx})

    total = len(tx_df)
    solo = int((tx_df["items"] == 1).sum())
    multi = int((tx_df["items"] > 1).sum())

    def _group(n):
        if n == 1: return "1 item"
        if n == 2: return "2 items"
        if n == 3: return "3 items"
        return "4+ items"

    tx_df["group"] = tx_df["items"].apply(_group)
    dist = tx_df.groupby("group").agg(count=("items", "count"), avg_basket=("sales", "mean")).reset_index()
    order = ["1 item", "2 items", "3 items", "4+ items"]
    dist["_ord"] = dist["group"].map({k: i for i, k in enumerate(order)})
    dist = dist.sort_values("_ord").drop(columns="_ord")

    return {
        "avg_items_per_tx": float(tx_df["items"].mean()),
        "solo_pct": float(solo / total * 100) if total > 0 else 0,
        "multi_pct": float(multi / total * 100) if total > 0 else 0,
        "solo_avg_basket": float(tx_df[tx_df["items"] == 1]["sales"].mean()) if solo > 0 else 0,
        "multi_avg_basket": float(tx_df[tx_df["items"] > 1]["sales"].mean()) if multi > 0 else 0,
        "basket_value_by_count": [
            {"group": row["group"], "count": int(row["count"]), "avg_basket": float(row["avg_basket"])}
            for _, row in dist.iterrows()
        ],
        "item_count_distribution": [
            {"group": row["group"], "count": int(row["count"]), "pct": float(row["count"] / total * 100) if total > 0 else 0}
            for _, row in dist.iterrows()
        ],
    }


def _revenue_by_month(df: pd.DataFrame) -> list[dict]:
    df2 = df.copy()
    df2["ym"] = df2["date"].dt.to_period("M")
    grouped = df2.groupby("ym").agg(revenue=("total_revenue", "sum"), transactions=("total_revenue", "count")).reset_index()
    grouped = grouped.sort_values("ym")
    return [
        {"month": str(row["ym"]), "revenue": float(row["revenue"]), "transactions": int(row["transactions"])}
        for _, row in grouped.iterrows()
    ]


def _revenue_by_week(df: pd.DataFrame) -> list[dict]:
    df2 = df.copy()
    df2["week"] = df2["date"].dt.to_period("W")
    grouped = df2.groupby("week").agg(revenue=("total_revenue", "sum")).reset_index().sort_values("week")
    return [
        {"week": str(row["week"]), "revenue": float(row["revenue"])}
        for _, row in grouped.iterrows()
    ]


def _category_contribution(df: pd.DataFrame) -> list[dict]:
    total = float(df["total_revenue"].sum())
    grouped = df.groupby("category").agg(
        total_revenue=("total_revenue", "sum"),
        total_qty=("quantity", "sum"),
        avg_margin_pct=("margin_pct", "mean"),
    ).reset_index().sort_values("total_revenue", ascending=False)
    return [
        {
            "category": row["category"] or "Lainnya",
            "total_revenue": float(row["total_revenue"]),
            "pct_contribution": float(row["total_revenue"] / total * 100) if total > 0 else 0,
            "total_qty": int(row["total_qty"]),
            "avg_margin_pct": float(row["avg_margin_pct"]),
        }
        for _, row in grouped.iterrows()
    ]


def _empty_result() -> dict:
    return {
        "summary": {"total_revenue": 0, "total_transactions": 0, "total_line_items": 0, "total_qty": 0,
                    "avg_transaction_value": 0, "total_gross_profit": 0, "overall_margin_pct": 0,
                    "unique_items": 0, "date_range_start": None, "date_range_end": None},
        "revenue_by_date": [],
        "revenue_by_hour": [{"hour": h, "revenue": 0, "avg_revenue": 0} for h in range(24)],
        "revenue_by_day_of_week": [],
        "margin_by_item": [],
        "margin_snapshot": {"total_revenue": 0, "total_hpp_cost": 0, "gross_profit": 0, "margin_pct": 0, "waterfall": []},
        "top_leakages": [],
        "golden_hours": [],
        "dead_hours": [],
        "menu_matrix": [],
        "top_items_by_revenue": [],
        "top_items_by_qty": [],
        "category_breakdown": [],
        "payment_method_breakdown": [],
        "purchase_behavior": {"avg_items_per_tx": 0, "solo_pct": 0, "multi_pct": 0, "solo_avg_basket": 0, "multi_avg_basket": 0, "basket_value_by_count": [], "item_count_distribution": []},
        "revenue_by_month": [],
        "revenue_by_week": [],
        "category_contribution": [],
    }
