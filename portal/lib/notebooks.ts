export const ASSIGNABLE_NOTEBOOKS = [
  {
    id: "regional_volumes",
    label: "Regional brain volumes (tested fallback)",
    taskType: "Regional brain volumes",
    url: "https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/bb91f9d0f2579033ee37e57b816ac56b91a33191/notebooks/First_regional_brain_volumes.ipynb",
  },
  {
    id: "aseg_stats",
    label: "Full aseg.stats (pilot; license and long runtime)",
    taskType: "Aseg.stats measures",
    url: "https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/2b99e276e8fbc96955b0b3002120be7d9228bd62/notebooks/First_aseg_stats.ipynb",
  },
] as const;

export function getAssignableNotebookUrl(id: string): string | undefined {
  return ASSIGNABLE_NOTEBOOKS.find((notebook) => notebook.id === id)?.url;
}

export function getNotebookTaskType(url: string): string {
  return ASSIGNABLE_NOTEBOOKS.find((notebook) => notebook.url === url)?.taskType ?? "Assigned Colab notebook";
}
