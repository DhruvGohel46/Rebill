# Known Limitations & Natural Language Edge Cases

## 1. Mixed Timeframe Language with Correction Phrasing (Record 8)

* **Example Query:** `"I Pay 500 but one change i give him yesturday\"` (Record 8 from live interaction audit logs)
* **Observed Behavior:** The Orchestrator routed the message to the `expense` domain, but the model picked `list_expense_types` instead of proposing an expense record or asking clarifying questions.
* **Root Cause & Rationale:** 
  The sentence combines conflicting temporal markers (*"pay"* present tense vs. *"yesterday"* past tense) alongside an elliptical correction clause (*"but one change i give him"*). This is ambiguous conversational phrasing rather than a clean intent-routing or schema error.
* **Monitoring Strategy:**
  Rather than overfitting deterministic regex rules to this specific phrasing, this pattern is logged as an open-ended conversational edge case. Periodic log audits will monitor whether users frequently submit retroactive date-adjustment phrases and evaluate whether a dedicated multi-turn date-correction prompt guideline is warranted.
