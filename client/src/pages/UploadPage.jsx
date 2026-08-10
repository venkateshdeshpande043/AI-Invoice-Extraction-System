import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import FileUploadZone from '../components/upload/FileUploadZone';
import FilePreview from '../components/upload/FilePreview';
import UploadProgress from '../components/upload/UploadProgress';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import { useFileUpload } from '../hooks/useFileUpload';
import { useInvoices } from '../hooks/useInvoices';

function UploadPage() {
  const navigate = useNavigate();
  const { file, preview, error: fileError, progress, selectFile, reset, updateProgress, setError } = useFileUpload();
  const { uploadInvoice } = useInvoices();
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const invoice = await uploadInvoice(file, updateProgress);
      showToast('Invoice processed successfully!', 'success');
      setTimeout(() => navigate(`/invoices/${invoice._id}`), 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError(null);
  };

  return (
    <DashboardLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          eyebrow="New document"
          title="Upload Invoice"
          subtitle="PaddleOCR extracts the text; the NLP engine parses it into structured fields."
        />

        {!file ? (
          <FileUploadZone onFileSelect={selectFile} error={fileError} />
        ) : (
          <>
            <FilePreview file={file} preview={preview} />

            {uploading || (progress > 0 && progress < 100) ? (
              <UploadProgress progress={progress} fileName={file.name} />
            ) : (
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleUpload}>
                  Process Invoice
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}

        <div className="card p-6">
          <h3 className="font-medium text-espresso mb-3">Supported formats</h3>
          <ul className="text-sm text-mocha space-y-2">
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              JPEG / JPG — up to 10 MB
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              PNG — up to 10 MB
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              PDF — up to 10 MB (scanned pages are rendered and OCR'd)
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UploadPage;
