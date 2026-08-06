import PropTypes from 'prop-types';

function UploadProgress({ progress, fileName }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{fileName || 'Uploading...'}</span>
        <span className="text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <p className="text-sm text-green-600 font-medium">Processing invoice...</p>
      )}
    </div>
  );
}

UploadProgress.propTypes = {
  progress: PropTypes.number.isRequired,
  fileName: PropTypes.string,
};

export default UploadProgress;
