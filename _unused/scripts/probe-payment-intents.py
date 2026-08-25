#!/usr/bin/env python3
"""Probe the live ServeIQ backend: register a throwaway guest, create a booking,
call payment-intent for stripe / razorpay / khalti, and print the exact response
shapes so we know which gateways return a hosted payment_url."""
import json
import os
import ssl
import time
import urllib.request
import urllib.parse
import urllib.error

# Local dev machines often lack the issuer chain for the host's cert.
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

BASE = "https://stay-easy-sizw.onrender.com/api/v1"

def call(method, path, body=None, token=None, form=False):
    url = BASE + path
    if form:
        data = urllib.parse.urlencode(body).encode()
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    else:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw[:400]
    except Exception as e:
        return -1, str(e)[:400]

# ── 1. register a throwaway guest ──────────────────────────────────────────
ts = int(time.time())
email = f"buffy-probe-{ts}@example.com"
password = "ProbePass123!"
status, reg = call("POST", "/auth/guests/register", {
    "full_name": "Buffy Probe",
    "email": email,
    "phone_number": "9841000000",
    "password": password,
})
print("== register:", status)
print("   response keys:", sorted(reg.keys()) if isinstance(reg, dict) else reg)

# ── 2. verify OTP (emailed to the address — prompt for it manually) ────────
otp = os.environ.get("PROBE_OTP") or input(
    f"\nEnter the 6-digit OTP emailed to {email} (or export PROBE_OTP): "
).strip()
status, ver = call("POST", "/auth/guests/verify-otp", {"email": email, "otp": otp})
print("== verify-otp:", status, ver if status != 200 else "ok")
if status != 200:
    raise SystemExit(1)

# ── 3. login for a token (OAuth2 password form) ─────────────────────────────
status, login = call("POST", "/auth/login",
                     {"username": email, "password": password}, form=True)
token = None
if isinstance(login, dict):
    token = login.get("access_token")
print("== login:", status, "| token:", (token[:24] + "...") if token else None)
if not token:
    raise SystemExit(1)

# ── 2. find a property with available rooms ────────────────────────────────
props = ["83b286ea-f2de-4e4d-b2ec-740f9aa8290d", "8df1c0db-594c-4910-8bde-8b9a38ee5a1d",
         "f55ddc39-6dd4-4935-94e9-1d823713066a", "8940f7f3-fd2c-4011-be5f-cd1b446f1c60"]
pid = room_id = None
for p in props:
    s, rooms = call("GET", f"/properties/{p}/rooms/available-rooms?checkin_date=2026-08-10&checkout_date=2026-08-11")
    if s == 200 and isinstance(rooms, list) and rooms:
        pid = p
        room_id = rooms[0]["id"] if isinstance(rooms[0], dict) else rooms[0]
        print(f"== rooms ok for {p}: {len(rooms)} rooms, first={room_id}")
        break
    print(f"   rooms {p}: status={s}")
if not pid:
    print("   no property with rooms found — aborting")
    raise SystemExit(1)

# ── 3. create a booking ────────────────────────────────────────────────────
status, booking = call("POST", "/bookings/", {
    "idempotency_key": f"probe-{ts}",
    "property_id": pid,
    "room_ids": [room_id],
    "check_in": "2026-08-10",
    "check_out": "2026-08-11",
    "adults": 1,
    "children": 0,
}, token=token)
print("== create booking:", status)
ref = None
if isinstance(booking, dict):
    ref = booking.get("ref_number") or (booking.get("data") or {}).get("ref_number")
    print("   ref:", ref, "| keys:", sorted(booking.keys()))
if not ref:
    print("   no ref_number — cannot create payment intent:", str(booking)[:300])
    raise SystemExit(1)

# ── 4. payment-intent per gateway ──────────────────────────────────────────
for gw in ("stripe", "razorpay", "khalti"):
    body = {"payment_gateway": gw}
    if gw == "khalti":
        body["return_url"] = "ServeIQ://booking-confirmation"
    status, intent = call("POST", f"/bookings/{ref}/payment-intent", body, token=token)
    keys = sorted(intent.keys()) if isinstance(intent, dict) else None
    has_url = isinstance(intent, dict) and bool(intent.get("payment_url"))
    print(f"== payment-intent {gw}: status={status} payment_url={'YES' if has_url else 'no'} keys={keys}")
    if isinstance(intent, dict):
        for k in ("payment_url", "pidx", "order_id", "payment_intent_id", "client_secret", "message", "detail"):
            if k in intent and k != "payment_url":
                print(f"     {k}: {str(intent[k])[:80]}")
        if has_url:
            print(f"     payment_url: {intent['payment_url'][:120]}")
