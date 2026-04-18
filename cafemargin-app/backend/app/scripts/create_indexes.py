from sqlalchemy import text
from app.database import engine, Base
import app.models  # noqa: F401 ensure models are registered

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS ix_tx_cafe_date ON transactions (cafe_id, date)",
    "CREATE INDEX IF NOT EXISTS ix_tx_cafe_date_hour ON transactions (cafe_id, date, hour)",
    "CREATE INDEX IF NOT EXISTS ix_tx_cafe_batch ON transactions (cafe_id, upload_batch)",
    "CREATE INDEX IF NOT EXISTS ix_tx_cafe_category_date ON transactions (cafe_id, category, date)",
    "CREATE INDEX IF NOT EXISTS ix_menu_cafe_category_name ON menu_items (cafe_id, category, name)",
    "CREATE INDEX IF NOT EXISTS ix_action_plan_cafe_due ON action_plans (cafe_id, due_date)",
    "CREATE INDEX IF NOT EXISTS ix_kpi_target_cafe_metric ON kpi_targets (cafe_id, metric_name)",
    "CREATE INDEX IF NOT EXISTS ix_storage_cafe_kind_created ON storage_assets (cafe_id, kind, created_at)",
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for stmt in INDEX_STATEMENTS:
            conn.execute(text(stmt))


if __name__ == "__main__":
    main()
