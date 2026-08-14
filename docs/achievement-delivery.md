# Achievement delivery

Achievement rows in PostgreSQL are the source of truth. Clients should call
`GET /students/:studentId/achievements` after connecting or reconnecting, then
subscribe to that student with the `student.subscribe` Socket.IO event on the
`/achievements` namespace. Live `achievement.unlocked` messages are a latency
optimization and are not a replacement for REST reconciliation.

Rule evaluation currently starts from typed, in-process events published only
after the practice-session or assignment-completion transaction commits. The
unique `(student_id, achievement_key)` constraint and `ON CONFLICT DO NOTHING`
make unlock persistence and event publication idempotent under concurrency.

## Future transactional outbox

In-process delivery cannot survive a process crash between the source commit
and rule evaluation. Before moving event handling to multiple API instances or
a message broker, add a transactional outbox row in the same transaction as
each source change. A background publisher should claim rows with
`FOR UPDATE SKIP LOCKED`, publish them with a stable event ID, and mark them as
delivered. Consumers must remain idempotent. The REST reconciliation endpoint
continues to repair missed client notifications.
