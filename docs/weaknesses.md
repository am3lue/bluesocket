# Known Weaknesses & Limitations

While BlueSocket v3 is designed for high-availability and stateless environments like Vercel, it makes specific architectural trade-offs that result in known weaknesses. These should be addressed before moving from prototype to production.

---

## ✅ Resolved & Optimized

### 💾 Scalability: Write Amplification (Community)
**Status: FIXED.**
- **The Optimization:** We have moved to a "Single Source of Truth" model. Messages are only inserted once into the `messages` table. The `sync_events` table is no longer used for message distribution.
- **Impact:** Community broadcasts now cost `O(1)` database writes instead of `O(N)`.

### 🔍 Database: Deep Scan Overhead
**Status: OPTIMIZED.**
- **The Optimization:** The `/api/bluesocket/sync` endpoint now implements a two-tier querying strategy. A lightweight `SELECT MAX(timestamp)` pre-check is performed before any complex `JOIN` queries.
- **Impact:** Significant reduction in database read load during idle periods.

---

## 🔐 1. Security: Plaintext Password Storage
**The Weakness:** Currently, the API stores and compares passwords as plaintext strings in the `users` table.
- **Impact:** If the database is compromised, all user passwords are leaked immediately.
- **Recommendation:** Implement Argon2 or bcrypt hashing in `api/index.js` before saving or verifying credentials.

## 📡 2. Performance: Polling-Based Latency
**The Weakness:** BlueSocket is "Pull-Based" rather than "Push-Based." It relies on HTTP long-polling.
- **Impact:** 
  - There is an inherent latency (up to the polling interval) before a client sees a new message.
  - High battery and data consumption on mobile devices due to frequent HTTP headers and wake-ups.
- **Recommendation:** For true real-time needs, supplement with a small WebSocket sidecar or move to a stateful server if scaling costs allow.

## ☁️ 5. Infrastructure: Vercel Execution Limits
**The Weakness:** Long-polling on Vercel Hobby plans is capped at 10 seconds.
- **Impact:** If a poll waits longer than 10 seconds, Vercel kills the function, potentially resulting in `504 Gateway Timeout` or `502 Bad Gateway` errors for the client.
- **Recommendation:** Keep the `wait` parameter in the sync engine low (8-10s max) and implement aggressive client-side retry logic.

## ⏱️ 6. State: Inaccurate Presence
**The Weakness:** Presence is calculated via a `last_seen` timestamp, but there is no background heartbeat mechanism.
- **Impact:** Users may appear "ONLINE" for several seconds after they have closed their browser tab.
- **Recommendation:** Implement a `navigator.sendBeacon` heartbeat on the `visibilitychange` or `beforeunload` events.

---

**Understanding these weaknesses is key to building a robust BlueSocket implementation.** 🚀🛡️
