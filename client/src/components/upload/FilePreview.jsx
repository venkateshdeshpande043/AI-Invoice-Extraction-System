import PropTypes from 'prop-types';

function FilePreview({ file, preview }) {
  if (!file) return null;

  const fileSize = (file.size / 1024 / 1024).toFixed(2);

  return (
    <div className="card space-y-3">
      <h3 className="font-medium text-gray-900">Selected File</h3>
      <div className="flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-sm text-gray-500">{fileSize} MB</p>
        </div>
      </div>
    </div>
  );
}

FilePreview.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string,
    size: PropTypes.number,
    type: PropTypes.string,
  }),
  preview: PropTypes.string,
};

export default FilePreview;
