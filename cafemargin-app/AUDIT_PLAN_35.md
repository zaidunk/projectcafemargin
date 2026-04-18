# Audit Plan (35 Items)

1. Verify transaction indexes on cafe_id and date and add missing ones if absent.
2. Validate transaction list query plan with ORDER BY date/hour under realistic data size.
3. Confirm batch delete uses indexed columns and does not lock large tables.
4. Review admin list queries for pagination and user_count aggregation.
5. Benchmark analytics overview response time for 30/90/365 day ranges.
6. Compare pandas groupby cost versus SQL aggregate for revenue_by_date and revenue_by_hour.
7. Identify repeated analytics requests across screens and consolidate where possible.
8. Add cache strategy for analytics results keyed by cafe_id and period.
9. Enforce upload size limits before reading file into memory.
10. Add streaming CSV parse for large uploads if memory spikes occur.
11. Verify Supabase storage upload latency and retry behavior.
12. Add metrics for storage upload failures and timeouts.
13. Ensure report generation runs within request timeout limits.
14. Evaluate moving PDF generation to background job for heavy reports.
15. Check DB pool sizing versus web worker count and concurrency.
16. Enable slow query logging for high latency endpoints.
17. Add request tracing for analytics and advanced endpoints.
18. Confirm auth token claims are sufficient to avoid extra DB lookups where safe.
19. Validate rate limiting for login and add for upload endpoints.
20. Audit N+1 queries in admin and settings endpoints.
21. Verify menu list ordering and index coverage on cafe_id/category/name.
22. Add index on storage assets list by cafe_id/kind/created_at.
23. Ensure storage metadata writes are in same transaction when required.
24. Validate analytics_engine includes only needed computations per endpoint.
25. Review advanced analytics endpoints for repeated DataFrame creation.
26. Confirm transaction loader selects only needed columns for each endpoint.
27. Add pagination to transaction list and test front-end handling.
28. Profile frontend render time for Dashboard and Transactions screens.
29. Memoize heavy computed UI data (waterfall, payment totals, done pct).
30. Reduce repeated fetches after mutations by applying local state updates.
31. Memoize context providers to prevent full tree re-renders.
32. Memoize high-frequency UI cards and navigation items.
33. Validate i18n language toggle does not trigger redundant fetches.
34. Review error handling paths for user feedback and retry logic.
35. Add regression tests for analytics outputs after refactors.
