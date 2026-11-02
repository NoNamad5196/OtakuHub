import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Run through test:emulator; real projects are prohibited.");
  }
  environment = await initializeTestEnvironment({
    projectId: "demo-otakus",
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/alice/hub/main/collections/private"), { item_name: "굿즈", price: 10000 });
    await setDoc(doc(context.firestore(), "users/alice/hub/main/userEvents/private"), { event_id: "ev-1", is_attending: true });
    await setDoc(doc(context.firestore(), "users/alice/agentSignals/private"), { kind: "game_started" });
    await setDoc(doc(context.firestore(), "events/public-ev"), { title: "공개 이벤트", is_verified: true });
    await setDoc(doc(context.firestore(), "franchises/blue-archive"), { name: "블루 아카이브" });
    await setDoc(doc(context.firestore(), "modules/hub/crawlSources/src-1"), { name: "DC" });
  });
});

afterAll(async () => {
  await environment?.cleanup();
});

describe("OtakuHub Firestore ownership isolation", () => {
  it("allows the owner to read private collections and user events", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    const col = await assertSucceeds(getDoc(doc(db, "users/alice/hub/main/collections/private")));
    expect(col.data()?.item_name).toBe("굿즈");
    const ev = await assertSucceeds(getDoc(doc(db, "users/alice/hub/main/userEvents/private")));
    expect(ev.data()?.is_attending).toBe(true);
  });

  it("rejects another user's private reads", async () => {
    const db = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(db, "users/alice/hub/main/collections/private")));
    await assertFails(getDoc(doc(db, "users/alice/hub/main/userEvents/private")));
  });

  it("rejects anonymous reads to private collections", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/alice/hub/main/collections/private")));
  });

  it("rejects even owner browser writes to server-managed hub collections and user events", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "users/alice/hub/main/collections/private"), { item_name: "직접 쓰기" }));
    await assertFails(setDoc(doc(db, "users/alice/hub/main/userEvents/private"), { is_attending: false }));
  });

  it("isolates agent signals and prevents browser injection", async () => {
    const db = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(db, "users/alice/agentSignals/private")));
    await assertFails(setDoc(doc(db, "users/bob/agentSignals/injected"), { kind: "spending_alert" }));
  });

  it("allows public reads for events and franchises but rejects client writes", async () => {
    const anon = environment.unauthenticatedContext().firestore();
    const auth = environment.authenticatedContext("alice").firestore();

    const ev = await assertSucceeds(getDoc(doc(anon, "events/public-ev")));
    expect(ev.data()?.title).toBe("공개 이벤트");

    const fr = await assertSucceeds(getDoc(doc(anon, "franchises/blue-archive")));
    expect(fr.data()?.name).toBe("블루 아카이브");

    await assertFails(setDoc(doc(auth, "events/injected"), { title: "위조" }));
    await assertFails(setDoc(doc(auth, "franchises/injected"), { name: "위조" }));
  });

  it("rejects all client reads and writes to modules/hub/*", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(db, "modules/hub/crawlSources/src-1")));
    await assertFails(setDoc(doc(db, "modules/hub/crawlSources/src-2"), { name: "위조 소스" }));
  });
});
