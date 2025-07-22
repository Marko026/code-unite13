// Utility functions for managing browser storage

export const clearBrowserStorage = () => {
  try {
    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      // Remove TinyMCE specific items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("tinymce") || key.includes("mce"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    // Clear sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes("tinymce") || key.includes("mce"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }

    console.log("Browser storage cleaned successfully");
  } catch (error) {
    console.error("Error cleaning browser storage:", error);
  }
};

export const getStorageUsage = () => {
  if (typeof window === "undefined")
    return { localStorage: 0, sessionStorage: 0 };

  let localStorageSize = 0;
  let sessionStorageSize = 0;

  try {
    // Calculate localStorage usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length + key.length;
      }
    }

    // Calculate sessionStorage usage
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        sessionStorageSize += sessionStorage[key].length + key.length;
      }
    }
  } catch (error) {
    console.error("Error calculating storage usage:", error);
  }

  return {
    localStorage: Math.round(localStorageSize / 1024), // KB
    sessionStorage: Math.round(sessionStorageSize / 1024), // KB
  };
};
