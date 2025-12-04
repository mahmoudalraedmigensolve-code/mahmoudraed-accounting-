// Firebase Authentication
import { getAuth, type Auth } from "firebase/auth";
import { app } from "./config";

function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Auth can only be initialized on the client side");
  }
  return getAuth(app);
}

export const auth = typeof window !== "undefined" ? getFirebaseAuth() : ({} as Auth);
