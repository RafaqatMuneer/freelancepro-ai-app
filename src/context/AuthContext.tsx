import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { getUserProfile, saveUserProfile } from "../services/firestoreService";
import { UserProfile } from "../types";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string, fallbackUser?: User | null) => {
    try {
      let profile = await getUserProfile(uid);
      if (!profile) {
        // Create initial default profile if none exists
        profile = {
          uid,
          name: fallbackUser?.displayName || fallbackUser?.email?.split('@')[0] || "Freelancer",
          email: fallbackUser?.email || "",
          title: "Full Stack Freelance Specialist",
          bio: "Passionate professional helping clients scale their digital products with quality code and responsive designs.",
          skills: ["React", "TypeScript", "Node.js", "Tailwind CSS", "API Integration"],
          experience: "3+ years delivering freelance projects on time and within budget.",
          services: "Web Development, API Design, Technical Writing, UI/UX Consulting",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveUserProfile(uid, profile);
      }
      setUserProfile(profile);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid, user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid, currentUser);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    await saveUserProfile(currentUser.uid, data);
    await refreshProfile();
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      const newProfile: UserProfile = {
        uid: result.user.uid,
        name: name || email.split('@')[0],
        email,
        title: "Freelance Professional",
        bio: "Help clients deliver impactful projects.",
        skills: ["Web Development", "Communication", "Problem Solving"],
        experience: "1-3 years of project execution.",
        services: "Freelance Consulting & Software Services",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveUserProfile(result.user.uid, newProfile);
      setUserProfile(newProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshProfile,
        updateProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
