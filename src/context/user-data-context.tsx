"use client";
import type { User } from "firebase/auth";
import { createContext, useContext, ReactNode } from "react";

// This type can be expanded with the specific properties of your user document
// in Firestore. Using `any` for now for flexibility.
export type UserProfile = any;

export type UserDataContextType = {
    user: User | null;
    userData: UserProfile | null;
    loading: boolean;
};

export const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children, value }: { children: ReactNode, value: UserDataContextType }) {
    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    )
}

export function useUserData() {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error("useUserData must be used within a UserDataProvider, which is provided by AppShell.");
    }
    return context;
}
