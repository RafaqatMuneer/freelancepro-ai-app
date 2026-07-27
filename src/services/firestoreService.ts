import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, Proposal, ClientRecord } from "../types";

// User Profile Services
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
  }
  return null;
}

export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  if (!userId) throw new Error("Missing user ID");
  const userRef = doc(db, "users", userId);
  const now = new Date().toISOString();
  
  const profileData = {
    ...profile,
    uid: userId,
    updatedAt: now,
    createdAt: profile.createdAt || now
  };

  await setDoc(userRef, profileData, { merge: true });
}

// Proposals Services
function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'string') return new Date(val).getTime() || 0;
  if (typeof val === 'number') return val;
  if (val?.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
  if (val?.seconds) return val.seconds * 1000;
  return 0;
}

export async function getUserProposals(userId: string): Promise<Proposal[]> {
  if (!userId) return [];
  try {
    const proposalsRef = collection(db, "proposals");
    const q = query(
      proposalsRef, 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list: Proposal[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
      } as Proposal);
    });

    // Client-side sort by createdAt descending
    return list.sort((a, b) => {
      const timeA = getTimestampMs(a.createdAt);
      const timeB = getTimestampMs(b.createdAt);
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching proposals from Firestore:", error);
    return [];
  }
}

export async function createProposal(userId: string, proposal: Omit<Proposal, "id" | "userId">): Promise<string> {
  if (!userId) throw new Error("User must be authenticated to create a proposal");
  const now = new Date().toISOString();
  
  const rawData = {
    ...proposal,
    userId,
    status: proposal.status || "Draft",
    createdAt: now,
    updatedAt: now
  };

  // Strip any undefined values to avoid Firestore errors
  const cleanData = JSON.parse(JSON.stringify(rawData));

  const docRef = await addDoc(collection(db, "proposals"), cleanData);
  return docRef.id;
}

export async function updateProposal(proposalId: string, updates: Partial<Proposal>): Promise<void> {
  if (!proposalId) throw new Error("Missing proposal ID for update");
  const proposalRef = doc(db, "proposals", proposalId);
  const now = new Date().toISOString();
  
  const { id, userId, ...allowedUpdates } = updates;

  const rawUpdates = {
    ...allowedUpdates,
    updatedAt: now
  };

  const cleanUpdates = JSON.parse(JSON.stringify(rawUpdates));

  await updateDoc(proposalRef, cleanUpdates);
}

export async function deleteProposal(proposalId: string): Promise<void> {
  if (!proposalId) throw new Error("Missing proposal ID for deletion");
  const proposalRef = doc(db, "proposals", proposalId);
  await deleteDoc(proposalRef);
}

// Clients Services
export async function getUserClients(userId: string): Promise<ClientRecord[]> {
  if (!userId) return [];
  try {
    const clientsRef = collection(db, "clients");
    const q = query(
      clientsRef, 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list: ClientRecord[] = [];
    snap.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as ClientRecord);
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching clients from Firestore:", error);
    return [];
  }
}

export async function createClientRecord(userId: string, clientData: Omit<ClientRecord, "id" | "userId">): Promise<string> {
  if (!userId) throw new Error("User must be authenticated to add a client");
  const now = new Date().toISOString();

  const docData = {
    ...clientData,
    userId,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, "clients"), docData);
  return docRef.id;
}

export async function updateClientRecord(clientId: string, updates: Partial<ClientRecord>): Promise<void> {
  if (!clientId) throw new Error("Missing client ID for update");
  const clientRef = doc(db, "clients", clientId);
  const now = new Date().toISOString();

  const { id, userId, ...allowedUpdates } = updates;

  const rawUpdates = {
    ...allowedUpdates,
    updatedAt: now
  };

  const cleanUpdates = JSON.parse(JSON.stringify(rawUpdates));

  await updateDoc(clientRef, cleanUpdates);
}

export async function deleteClientRecord(clientId: string): Promise<void> {
  if (!clientId) throw new Error("Missing client ID for deletion");
  const clientRef = doc(db, "clients", clientId);
  await deleteDoc(clientRef);
}
