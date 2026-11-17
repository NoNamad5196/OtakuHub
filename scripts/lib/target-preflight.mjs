export function isSharedDoc(path, entity) {
  if (entity === "userProfile" || path.match(/^users\/[^/]+$/)) return true;
  if (entity === "franchise" || path.match(/^franchises\/[^/]+$/)) return true;
  if (entity === "gameMaster" || path.match(/^games\/[^/]+$/)) return true;
  return false;
}

export function isDataIdentical(existingVal, plannedVal) {
  if (existingVal === plannedVal) return true;
  if (existingVal == null && plannedVal == null) return true;
  if (existingVal == null || plannedVal == null) return false;

  if (plannedVal._firestoreTimestamp) {
    const plannedSec = plannedVal.seconds;
    const plannedNanos = plannedVal.nanoseconds || 0;
    if (existingVal.seconds !== undefined) {
      return existingVal.seconds === plannedSec && (existingVal.nanoseconds || 0) === plannedNanos;
    }
    if (existingVal instanceof Date || typeof existingVal.toDate === "function") {
      const d = typeof existingVal.toDate === "function" ? existingVal.toDate() : existingVal;
      return Math.floor(d.getTime() / 1000) === plannedSec;
    }
    return false;
  }

  if (typeof existingVal === "object" && typeof plannedVal === "object") {
    if (Array.isArray(existingVal) || Array.isArray(plannedVal)) {
      if (!Array.isArray(existingVal) || !Array.isArray(plannedVal)) return false;
      if (existingVal.length !== plannedVal.length) return false;
      for (let i = 0; i < existingVal.length; i++) {
        if (!isDataIdentical(existingVal[i], plannedVal[i])) return false;
      }
      return true;
    }

    const existKeys = Object.keys(existingVal);
    const plannedKeys = Object.keys(plannedVal);
    if (existKeys.length !== plannedKeys.length) return false;
    for (const k of plannedKeys) {
      if (!isDataIdentical(existingVal[k], plannedVal[k])) return false;
    }
    return true;
  }

  return false;
}

export async function preflightOperations(db, operations) {
  const plan = [];

  for (const op of operations) {
    const docRef = db.doc(op.path);
    let existingDoc = null;
    try {
      const snap = await docRef.get();
      if (snap.exists) {
        existingDoc = typeof snap.data === "function" ? snap.data() : snap.data;
      }
    } catch {
      existingDoc = null;
    }

    if (!existingDoc) {
      plan.push({ op, action: "create" });
    } else {
      if (isSharedDoc(op.path, op.entity)) {
        plan.push({ op, action: "skip", reason: "shared_doc_exists" });
      } else if (isDataIdentical(existingDoc, op.data)) {
        plan.push({ op, action: "skip", reason: "identical_data" });
      } else {
        throw new Error(
          `CONFLICT: Document at '${op.path}' already exists with different data and cannot be safely overwritten.`,
        );
      }
    }
  }

  return plan;
}
