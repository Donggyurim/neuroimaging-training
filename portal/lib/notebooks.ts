export const ASSIGNABLE_NOTEBOOKS = [
  {
    id: "regional_volumes",
    label: "Regional brain volumes (tested fallback)",
    taskType: "Regional brain volumes",
    url: "https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/bb91f9d0f2579033ee37e57b816ac56b91a33191/notebooks/First_regional_brain_volumes.ipynb",
  },
  {
    id: "aseg_stats",
    label: "Full FreeSurfer aseg.stats (pilot; license and long runtime)",
    taskType: "Aseg.stats measures",
    url: "https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/d86b2e1e91dbecefb3edbdfbcd0345633a495f93/notebooks/First_aseg_stats.ipynb",
  },
] as const;

export function getAssignableNotebookUrl(id: string): string | undefined {
  return ASSIGNABLE_NOTEBOOKS.find((notebook) => notebook.id === id)?.url;
}

export function getNotebookTaskType(url: string): string {
  if (url.includes("First_aseg_stats.ipynb")) return "Aseg.stats measures";
  if (url.includes("First_regional_brain_volumes.ipynb")) return "Regional brain volumes";
  return ASSIGNABLE_NOTEBOOKS.find((notebook) => notebook.url === url)?.taskType ?? "Assigned Colab notebook";
}
