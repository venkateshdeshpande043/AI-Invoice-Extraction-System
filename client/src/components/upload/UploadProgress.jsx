import PropTypes from 'prop-types';

function UploadProgress({ progress, fileName }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-espresso font-medium">{fileName || 'Uploading...'}</span>
        <span className="text-mocha tabnum">{progress}%</span>
      </div>
      <div className="w-full bg-sand/60 rounded-full h-2 overflow-hidden">
        <div
          className="bg-espresso h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <p className="text-sm text-emerald-700 font-medium">Processing invoice...</p>
      )}
    </div>
  );
}

UploadProgress.propTypes = {
  progress: PropTypes.number.isRequired,
  fileName: PropTypes.string,
};

export default UploadProgress;
