import { useState, useCallback } from 'react';
import { validateFile } from '../utils/validators';

export function useFileUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const selectFile = useCallback((selectedFile) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      return false;
    }
    setError(null);
    setFile(selectedFile);
    setProgress(0);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
    return true;
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  const updateProgress = useCallback((progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setProgress(percent);
  }, []);

  return {
    file,
    preview,
    error,
    progress,
    selectFile,
    reset,
    updateProgress,
    setError,
  };
}
