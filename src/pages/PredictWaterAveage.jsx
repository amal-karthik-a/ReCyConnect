import React, { useState } from 'react';

function PredictWaterAveage() {
  const [formData, setFormData] = useState({
    industryName: '',
    location: '',
    countEmployees: '',
    averageDailyUsage: '',
    totalCapacity: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    console.log('Sending request with data:', formData);
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      if (response.ok) {
        setPrediction(result.predictedDailyConsumption);
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to connect to the backend: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Water Consumption Prediction</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Industry Name:</label>
          <input
            type="text"
            name="industryName"
            value={formData.industryName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Number of Employees:</label>
          <input
            type="number"
            name="countEmployees"
            value={formData.countEmployees}
            onChange={handleChange}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label>Average Daily Usage:</label>
          <input
            type="number"
            name="averageDailyUsage"
            value={formData.averageDailyUsage}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Total Capacity:</label>
          <input
            type="number"
            name="totalCapacity"
            value={formData.totalCapacity}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Predicting...' : 'Predict'}
        </button>
      </form>
      {prediction && (
        <div className="result">
          <h2>Predicted Daily Consumption: {prediction}</h2>
        </div>
      )}
      {error && (
        <div className="error">
          <h2>Error: {error}</h2>
        </div>
      )}
    </div>
  );
}

export default PredictWaterAveage;