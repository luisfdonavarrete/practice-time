# Achievement delivery

Achievement rows in PostgreSQL are the source of truth. Clients should call
`GET /students/:studentId/achievements` after connecting or reconnecting, then
subscribe to that student with the `student.subscribe` Socket.IO event on the
`/achievements` namespace. Live `achievement.unlocked` messages are a latency
optimization and are not a replacement for REST reconciliation.

The namespace is `/achievements` (not `/practice`). Connect with WebSocket
transport and provide the login JWT as either `auth.token` or an
`Authorization: Bearer <token>` handshake header. After the connection succeeds,
emit `student.subscribe` with `{ "studentId": "<uuid>" }`. The server validates
that the authenticated user owns the active student before joining its room.

An unlock payload has this shape:

```json
{
  "type": "achievement.unlocked",
  "achievementId": "018f0542-f7c8-7d56-a4c8-53bffd426a9a",
  "studentId": "018f0542-f7c8-7d56-a4c8-53bffd426a9b",
  "achievementKey": "first_practice",
  "title": "First Note",
  "description": "Record the first practice session.",
  "unlockedAt": "2026-08-22T16:00:00.000Z"
}
```

On every connection and reconnection, fetch the REST collection first and then
subscribe. De-duplicate live messages by `achievementId`. Invalid, expired, or
missing JWTs fail the connection; attempts to subscribe to an unowned student
receive a generic `Student not found` Socket.IO exception.

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
