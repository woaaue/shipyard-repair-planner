UPDATE repairs r
SET progress_percentage = CASE
    WHEN r.status = 'COMPLETED' THEN 100
    WHEN r.status = 'CANCELLED' THEN 0
    ELSE COALESCE((
        SELECT ROUND(
            100.0 * SUM(CASE WHEN wi.status = 'COMPLETED' THEN 1 ELSE 0 END)::numeric
            / NULLIF(COUNT(*), 0)
        )::int
        FROM work_items wi
        WHERE wi.repair_id = r.id
    ), 0)
END;
