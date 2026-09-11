export const saveBlobAsFile = (data: BlobPart, filename: string, type: string) => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getBlobDownloadErrorMessage = async (
  error: any,
  fallbackMessage: string
): Promise<string> => {
  const data = error?.originalError?.response?.data || error?.response?.data;

  if (data instanceof Blob && data.type.includes("application/json")) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed?.message || parsed?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return error?.message || fallbackMessage;
};
