# Transport Screen Requirements - Database Collection Mapping

## Overview
This document maps the Transport Screen requirements to the MongoDB collections where data will be stored and retrieved.

---

## 6. Delay/Breakdown Report Submission

### Requirement:
- Driver can submit "Delay/Breakdown Report"
- System captures:
  - Issue type (traffic/breakdown/accident)
  - Estimated delay time
  - Optional photo with GPS tag
  - Remarks
- Instant alerts sent to supervisor/admin/manager
- Attendance grace period can be applied for workers

### Database Collections:

#### Primary Collection: `tripIncidents`
**Mo