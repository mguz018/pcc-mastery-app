// Cross-device progress sync. Local storage stays the source of truth for
// responsiveness; this layer mirrors the whole progress blob to Firestore at
// progress/{uid} and reconciles on login with simple last-write-wins by
// updatedAt. All Firestore calls are best-effort — if rules aren't deployed or
// the network is down, the app keeps working on local storage alone.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getProgress, replaceLocal, setWriteHook } from './progress';

let pushTimer = null;

function pushRemote(uid, blob) {
  if (!db || !uid) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    setDoc(doc(db, 'progress', uid), blob).catch((e) =>
      console.debug('[sync] push skipped:', e.message)
    );
  }, 1500);
}

// Call once a user is signed in. Pulls remote, reconciles, and registers the
// write hook so subsequent local changes push automatically.
export async function startSync(user) {
  if (!user || !db) return;
  const uid = user.uid;

  setWriteHook((blob) => pushRemote(uid, blob));

  try {
    const snap = await getDoc(doc(db, 'progress', uid));
    const remote = snap.exists() ? snap.data() : null;
    const local = getProgress();
    const rU = (remote && remote.updatedAt) || 0;
    const lU = (local && local.updatedAt) || 0;

    if (remote && rU > lU) {
      // The cloud is ahead (e.g. practiced on another device) — adopt it.
      replaceLocal(remote);
      window.dispatchEvent(new Event('pcc-progress'));
    } else if (lU > rU) {
      // Local is ahead (e.g. practiced before signing in) — push it up.
      pushRemote(uid, local);
    }
  } catch (e) {
    console.debug('[sync] pull skipped:', e.message);
  }
}

export function stopSync() {
  setWriteHook(null);
  clearTimeout(pushTimer);
}
