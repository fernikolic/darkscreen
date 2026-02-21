# Email API for OpenClaw Bot

## Your email address

`minjae@darkscreens.xyz`

## Authentication

All requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer c3e5a8b295b48a37f7929e819e88589d835f38f85f59bae90c5ee66f5c6c5bdb
```

## Base URL

```
https://darkscreen-email-api.fernandonikolic.workers.dev
```

## Endpoints

### List inbox

```
GET /inbox
```

Query params:
- `limit` (optional, default 50, max 200)
- `cursor` (optional, for pagination — use the `cursor` value from previous response)

Response:
```json
{
  "emails": [
    {
      "id": "m5abc123x",
      "from": "someone@example.com",
      "fromName": "Someone",
      "subject": "Hello Minjae",
      "date": "2026-02-21T15:00:00.000Z",
      "read": false
    }
  ],
  "cursor": null
}
```

### Read a specific email

```
GET /inbox/:id
```

Returns the full email including body text/html. Automatically marks it as read.

Response:
```json
{
  "id": "m5abc123x",
  "from": "someone@example.com",
  "fromName": "Someone",
  "to": ["minjae@darkscreens.xyz"],
  "subject": "Hello Minjae",
  "text": "Plain text body",
  "html": "<p>HTML body</p>",
  "date": "2026-02-21T15:00:00.000Z",
  "read": true,
  "attachments": [
    { "filename": "doc.pdf", "mimeType": "application/pdf", "size": 12345 }
  ]
}
```

### Send an email

```
POST /send
Content-Type: application/json
```

Body:
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "text": "Plain text body (optional if html provided)",
  "html": "<p>HTML body (optional if text provided)</p>"
}
```

`to` can also be an array for multiple recipients: `["a@example.com", "b@example.com"]`

Emails are sent from `Minjae <minjae@darkscreens.xyz>`.

Response:
```json
{ "ok": true, "messageId": "<...>" }
```

### Delete an email

```
DELETE /inbox/:id
```

Response:
```json
{ "ok": true }
```

## Error responses

All errors return JSON:
```json
{ "error": "Unauthorized" }
```

Status codes: `401` (bad token), `404` (email not found), `400` (bad request body), `502` (email sending failed).

## Notes

- Emails are stored for 90 days, then auto-expire.
- Inbox is sorted chronologically (oldest first).
- Attachment content is not stored — only metadata (filename, mime type, size).

## Example: curl

```bash
# Check inbox
curl -H "Authorization: Bearer c3e5a8b295b48a37f7929e819e88589d835f38f85f59bae90c5ee66f5c6c5bdb" \
  https://darkscreen-email-api.fernandonikolic.workers.dev/inbox

# Read specific email
curl -H "Authorization: Bearer c3e5a8b295b48a37f7929e819e88589d835f38f85f59bae90c5ee66f5c6c5bdb" \
  https://darkscreen-email-api.fernandonikolic.workers.dev/inbox/m5abc123x

# Send email
curl -X POST \
  -H "Authorization: Bearer c3e5a8b295b48a37f7929e819e88589d835f38f85f59bae90c5ee66f5c6c5bdb" \
  -H "Content-Type: application/json" \
  -d '{"to":"someone@example.com","subject":"Hello","text":"Hi from Minjae"}' \
  https://darkscreen-email-api.fernandonikolic.workers.dev/send

# Delete email
curl -X DELETE \
  -H "Authorization: Bearer c3e5a8b295b48a37f7929e819e88589d835f38f85f59bae90c5ee66f5c6c5bdb" \
  https://darkscreen-email-api.fernandonikolic.workers.dev/inbox/m5abc123x
```
