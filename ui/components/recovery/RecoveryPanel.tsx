const handleRestore = async (id: string) => {
  setIsRestoring(true);
  try {
    const response = await fetch(`/api/storage/restore`, {
      method: 'POST',
      body: JSON.stringify({ snapshotId: id, projectId })
    });
    
    if (response.ok) {
      // 1. Notify the app via a custom event or state manager (e.g., Zustand)
      window.dispatchEvent(new CustomEvent('PROJECT_RESTORED'));
      // 2. Give the user feedback rather than just a flicker
      alert("Snapshot successfully restored!");
    }
  } catch (err) {
    console.error("Restore failed", err);
  } finally {
    setIsRestoring(false);
  }
};
