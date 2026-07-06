import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_PROFILE = {
  avatar: null,
  skills: [],
  bio: "",
  resumeFileName: null,
  resumeData: null,
};

// All profile data is stored under _profiles[userId] so no two users share data.
export const useProfileStore = create()(
  persist(
    (set) => ({
      _profiles: {},

      setAvatar: (userId, avatar) =>
        set((s) => ({
          _profiles: {
            ...s._profiles,
            [userId]: { ...(s._profiles[userId] ?? DEFAULT_PROFILE), avatar },
          },
        })),

      setBio: (userId, bio) =>
        set((s) => ({
          _profiles: {
            ...s._profiles,
            [userId]: { ...(s._profiles[userId] ?? DEFAULT_PROFILE), bio },
          },
        })),

      addSkill: (userId, skill) =>
        set((s) => {
          const p = s._profiles[userId] ?? DEFAULT_PROFILE;
          return {
            _profiles: {
              ...s._profiles,
              [userId]: { ...p, skills: [...p.skills.filter((sk) => sk !== skill), skill] },
            },
          };
        }),

      removeSkill: (userId, skill) =>
        set((s) => {
          const p = s._profiles[userId] ?? DEFAULT_PROFILE;
          return {
            _profiles: {
              ...s._profiles,
              [userId]: { ...p, skills: p.skills.filter((sk) => sk !== skill) },
            },
          };
        }),

      setResume: (userId, fileName, data) =>
        set((s) => ({
          _profiles: {
            ...s._profiles,
            [userId]: { ...(s._profiles[userId] ?? DEFAULT_PROFILE), resumeFileName: fileName, resumeData: data },
          },
        })),

      clearResume: (userId) =>
        set((s) => ({
          _profiles: {
            ...s._profiles,
            [userId]: { ...(s._profiles[userId] ?? DEFAULT_PROFILE), resumeFileName: null, resumeData: null },
          },
        })),
    }),
    // New key ("v2") so old shared data in "hourhive-profile" is not picked up
    { name: "hourhive-profile-v2" }
  )
);
