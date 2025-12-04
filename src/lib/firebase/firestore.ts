// Firebase Firestore
import { getFirestore, type Firestore } from "firebase/firestore";
import { app } from "./config";

function getFirebaseFirestore(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("Firestore can only be initialized on the client side");
  }
  return getFirestore(app);
}

export const db = typeof window !== "undefined" ? getFirebaseFirestore() : ({} as Firestore);
