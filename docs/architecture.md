# 🏛️ How BlueSockets Works (The Post Office)

BlueSockets does not use "Live Wires" (WebSockets). It uses a **Digital Post Office**.

### 1. Sending (App A)
When you send a message, BlueSockets puts it in a **Post Office Box** (Database). It doesn't care if the other person is online.

### 2. Checking (App B)
App B visits the Post Office to check for mail. 
- If mail is there, it takes it.
- If not, it waits a bit longer before checking again.

### 3. Why this is good:
- **Safety:** If your phone dies, the letter stays in the box. It is never lost.
- **Proof:** We keep a record of every letter sent.
- **Battery:** Your phone only "walks to the post office" every few minutes when it's quiet.
