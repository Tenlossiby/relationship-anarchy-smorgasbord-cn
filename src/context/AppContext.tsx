'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '@/types';
import {
  getProfiles,
  addProfile,
  updateProfile,
  deleteProfile as deleteProfileFromStorage,
  createProfile,
  importProfileFromText,
} from '@/lib/storage';

interface AppContextType {
  profiles: Profile[];
  selectedProfiles: string[];
  isLoading: boolean;
  refreshProfiles: () => void;
  createNewProfile: (name: string, fromName: string, toName: string, relationLabel: string) => Profile;
  updateExistingProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  selectProfile: (id: string) => void;
  deselectProfile: (id: string) => void;
  toggleProfileSelection: (id: string) => void;
  clearSelection: () => void;
  importProfile: (text: string) => Profile | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfiles = useCallback(() => {
    setIsLoading(true);
    const data = getProfiles();
    setProfiles(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const createNewProfile = useCallback((
    name: string,
    fromName: string,
    toName: string,
    relationLabel: string
  ): Profile => {
    const profile = createProfile(name, fromName, toName, relationLabel);
    addProfile(profile);
    refreshProfiles();
    return profile;
  }, [refreshProfiles]);

  const updateExistingProfile = useCallback((profile: Profile) => {
    updateProfile(profile);
    refreshProfiles();
  }, [refreshProfiles]);

  const deleteProfile = useCallback((id: string) => {
    deleteProfileFromStorage(id);
    setSelectedProfiles(prev => prev.filter(pid => pid !== id));
    refreshProfiles();
  }, [refreshProfiles]);

  const selectProfile = useCallback((id: string) => {
    setSelectedProfiles(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const deselectProfile = useCallback((id: string) => {
    setSelectedProfiles(prev => prev.filter(pid => pid !== id));
  }, []);

  const toggleProfileSelection = useCallback((id: string) => {
    setSelectedProfiles(prev => {
      if (prev.includes(id)) {
        return prev.filter(pid => pid !== id);
      }
      return [...prev, id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProfiles([]);
  }, []);

  const importProfile = useCallback((text: string): Profile | null => {
    const profile = importProfileFromText(text);
    if (profile) {
      addProfile(profile);
      refreshProfiles();
    }
    return profile;
  }, [refreshProfiles]);

  return (
    <AppContext.Provider
      value={{
        profiles,
        selectedProfiles,
        isLoading,
        refreshProfiles,
        createNewProfile,
        updateExistingProfile,
        deleteProfile,
        selectProfile,
        deselectProfile,
        toggleProfileSelection,
        clearSelection,
        importProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
