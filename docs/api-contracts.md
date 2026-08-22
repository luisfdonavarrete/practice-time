# API and event contracts

The interactive OpenAPI UI is available at `http://localhost:3000/api/docs` in
development and test environments. Its JSON document is exposed at
`http://localhost:3000/api/docs-json`. Both are disabled when
`NODE_ENV=production` so operational details are not published accidentally.

Successful non-paginated HTTP responses use this envelope:

```json
{ "success": true, "data": {} }
```

Paginated responses contain `success`, `data`, `meta`, and `links` at the top
level. Validation errors follow Nest's standard `{ statusCode, message, error }`
shape. Except for signup and login, send `Authorization: Bearer <access_token>`.
Resources owned by another user are deliberately returned as `404 Not Found`
rather than revealing that they exist.

## Authentication and students

1. Create the first account with `POST /auth/signup` or authenticate with
   `POST /auth/login` using `{ "email": "...", "password": "..." }`.
2. Read the current account with `GET /auth/me`.
3. Create and manage the authenticated user's students with `/students`.

Public signup is bootstrap-only: after any user exists it is unavailable. The
current MVP models one authenticated owner and that owner's students; guardian,
teacher, and cross-household roles are outside its scope.

## Canonical weekly assignment

Create a seven-day draft with `POST /student-assignments`. Dates below are an
example and should be moved to the desired week. Nested section, item, notice,
and resource `position` values are zero-based and unique among siblings.

```json
{
  "studentId": "018f0542-f7c8-7d56-a4c8-53bffd426a9b",
  "title": "Year End Recital: Jun 22, 2026",
  "description": "Last day of class is next week.",
  "startDate": "2026-06-15",
  "endDate": "2026-06-21",
  "notices": [
    {
      "title": "Year End Recital",
      "occursAt": "2026-06-22T18:45:00-04:00",
      "location": "Room 213",
      "position": 0
    }
  ],
  "sections": [
    {
      "title": "Repertoire",
      "position": 0,
      "items": [
        {
          "title": "Amazing Grace",
          "instructions": "Practice the whole song from memory.",
          "completionMode": "practice_days",
          "suggestedPracticeDays": 3,
          "position": 0,
          "resources": []
        },
        {
          "title": "Year End Recital Solo",
          "instructions": "Memorization is optional.",
          "completionMode": "practice_days",
          "suggestedPracticeDays": 2,
          "position": 1,
          "resources": [
            {
              "kind": "youtube",
              "displayName": "Performance reference",
              "url": "https://www.youtube.com/watch?v=example",
              "position": 0
            }
          ]
        }
      ]
    },
    {
      "title": "Written Theory",
      "position": 1,
      "items": [
        {
          "title": "Music History Online Test",
          "instructions": "Choose one article, then complete its test.",
          "completionMode": "one_time",
          "dueAt": "2026-06-20T18:00:00-04:00",
          "position": 0,
          "resources": [
            {
              "kind": "external_link",
              "displayName": "Junior 3 Music History Assignment",
              "url": "https://example.org/music-history",
              "position": 0
            }
          ]
        }
      ]
    }
  ]
}
```

Drafts may be updated and their resources changed. Publish with
`POST /student-assignments/:id/publish`; published nested content is immutable.
Use `POST /student-assignments/:id/duplicate` with a new `startDate` to create an
editable copy, or use the archive/cancel lifecycle commands exposed in OpenAPI.

Complete a `one_time` item with
`PUT /student-assignment-items/:itemId/completion`; `DELETE` the same URL to
reopen it. A `practice_days` item is completed only by logging practice on the
required number of distinct student-local calendar dates.

## Resources and uploads

Link resources accept only HTTPS URLs without embedded credentials. YouTube
resources additionally require a `youtube.com`, `www.youtube.com`, or `youtu.be`
host. Clients open `external_link` and `youtube` resources using the `url` in
the resource response; they must not call the signed-access endpoint for them.
That direct URL is also the fallback when an embedded player is unavailable.

For an uploaded score, recording, or image, send `multipart/form-data` to
`POST /student-assignment-items/:itemId/resources/upload` with:

- `file`: the binary file;
- `displayName`: a user-facing label;
- `position`: its zero-based ordering position.

The default maximum is 15 MiB and may be configured up to 50 MiB with
`RESOURCE_MAX_UPLOAD_BYTES`. Accepted content and detected file signatures are:

- PDF (`application/pdf`);
- PNG, JPEG, GIF, or WebP images;
- MP3 audio (`audio/mpeg`, ID3 or MPEG frame signature).

The declared MIME type must match the detected bytes. Filenames are sanitized,
and content is stored by SHA-256 key. Fetch an upload with
`GET /assignment-resources/:resourceId/access-url`; the returned URL is temporary
and defaults to 300 seconds. Request a new URL after it expires—never persist the
signed URL. Upload creation/deletion is draft-only. Reading resources remains
available after publication. Unowned students, assignments, items, and resources
return `404`; malformed or unsupported content returns `400`, and an oversized
file returns `413`.

## Practice, progress, and rewards

Record practice with `POST /practice-sessions`:

```json
{
  "studentId": "018f0542-f7c8-7d56-a4c8-53bffd426a9b",
  "assignmentItemId": "018f0542-f7c8-7d56-a4c8-53bffd426a9c",
  "durationSeconds": 900,
  "practicedAt": "2026-06-18T19:00:00-04:00",
  "note": "Amazing Grace at 90 bpm"
}
```

Omit `assignmentItemId` for free practice. The API snapshots the student's IANA
time zone and derives the local practice date on the server. List, correct, and
delete ledger entries through the `/practice-sessions` endpoints in OpenAPI.

`GET /student-assignments/:assignmentId/practice-summary` returns weekly minutes,
distinct practice days, current streak, XP, assignment completion, and ordered
item progress. Multiple sessions on one local date add minutes but contribute
only one practice-day icon and one 10-XP daily award.

Example response data after completing the canonical week:

```json
{
  "assignmentId": "018f0542-f7c8-7d56-a4c8-53bffd426a9d",
  "studentId": "018f0542-f7c8-7d56-a4c8-53bffd426a9b",
  "startDate": "2026-06-15",
  "endDate": "2026-06-21",
  "weeklyMinutes": 45,
  "distinctPracticeDays": 3,
  "currentStreak": 3,
  "xp": 30,
  "assignmentCompleted": true,
  "items": [
    {
      "itemId": "018f0542-f7c8-7d56-a4c8-53bffd426a9c",
      "sectionId": "018f0542-f7c8-7d56-a4c8-53bffd426a9e",
      "sectionTitle": "Repertoire",
      "title": "Amazing Grace",
      "mode": "practice_days",
      "target": 3,
      "current": 3,
      "completed": true,
      "sectionPosition": 0,
      "itemPosition": 0
    }
  ]
}
```

`GET /students/:studentId/achievements` is the durable reward source. For live
unlocks and reconnection behavior, see
[Achievement delivery](achievement-delivery.md). The implemented Socket.IO
namespace is `/achievements`; `/practice` is not an event namespace.
