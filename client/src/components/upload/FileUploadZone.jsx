import PropTypes from 'prop-types';
import { useState, useRef } from 'react';

function FileUploadZone({ onFileSelect, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
    e.target.value = '';
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brown bg-ivory'
            : 'border-sand bg-ivory/40 hover:border-taupe hover:bg-ivory'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-white border border-sand rounded-lg flex items-center justify-center shadow-soft">
            <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium text-espresso">
              Drop your invoice here, or <span className="text-brown">browse</span>
            </p>
            <p className="text-sm text-mocha mt-1">Supports JPG, PNG, PDF (max 10 MB)</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-sm text-rust">{error}</p>}
    </div>
  );
}

FileUploadZone.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default FileUploadZone;
