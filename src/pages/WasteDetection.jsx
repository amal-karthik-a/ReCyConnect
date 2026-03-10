import { useState, useRef } from 'react';
import axios from 'axios';
import './../styles/detect.css';

const WasteDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
      console.log('Analysis result:', response.data);
    } catch (error) {
      console.error('Error analyzing image:', error.response ? error.response.data : error.message);
      const errorMsg = error.response?.data?.error || 'Error analyzing image. Please try again.';
      if (error.response?.status === 429) {
        setError('Quota exceeded. Please wait or upgrade your plan.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="waste-detection-container">
      <div className="card">
        <h1>Waste Classification System</h1>
        
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="file-input"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="select-button">
            Select Image
          </label>
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Selected waste" />
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`analyze-button ${loading ? 'disabled' : ''}`}
          >
            {loading ? 'Analyzing...' : 'Analyze Waste'}
          </button>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>Analysis Results</h2>
            <div className="result-content">
              <p><strong>Waste Type:</strong> {result.wasteType}</p>
              <p>
                <strong>Category:</strong> {result.category}{' '}
                <span className={`bio-tag ${result.biodegradable ? 'bio' : 'non-bio'}`}>
                  {result.biodegradable ? 'Biodegradable' : 'Non-biodegradable'}
                </span>
              </p>
              <p><strong>Environmental Impact:</strong> {result.environmentalImpact}</p>
              <p><strong>Disposal Recommendations:</strong> {result.disposalRecommendations}</p>
              {result.additionalInfo && (
                <p><strong>Additional Info:</strong> {result.additionalInfo}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteDetection;