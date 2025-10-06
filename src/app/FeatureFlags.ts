export const FEATURE_FLAGS = {
  githubRepo: import.meta.env.VITE_FEATURE_USE_REPOSITORY_GITHUB,
  localStorageRepo: import.meta.env.VITE_FEATURE_USE_REPOSITORY_LOCALSTORAGE,
  appWriteRepo: import.meta.env.VITE_FEATURE_USE_REPOSITORY_APPWRITE,
  sharedRepo: import.meta.env.VITE_FEATURE_USE_REPOSITORY_SHARED,
  usedPalette: import.meta.env.VITE_FEATURE_USE_PALETTE,
  forceLogin: import.meta.env.VITE_FEATURE_FORCE_LOGIN,
};

export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_FEATURE_APPWRITE_PUBLIC_ENDPOINT,
  project: import.meta.env.VITE_FEATURE_APPWRITE_PROJECT_ID,
  database: import.meta.env.VITE_FEATURE_APPWRITE_FILES_DATABASE,
  repositories: import.meta.env.VITE_FEATURE_APPWRITE_REPOS_COLLECTION,
  files: import.meta.env.VITE_FEATURE_APPWRITE_FILES_COLLECTION,
  require: {
    emailVerified: true,
    label: 'approved',
  },
};
