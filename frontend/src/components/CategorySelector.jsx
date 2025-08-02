import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CategorySelector = ({ value, onChange, className = '', multiple = false, selectedValues = [] }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    if (multiple) {
      // For multiple selection (categories of interest)
      const newSelectedValues = selectedValues.includes(categoryId)
        ? selectedValues.filter(id => id !== categoryId)
        : [...selectedValues, categoryId];
      onChange(newSelectedValues);
    } else {
      // For single selection (ticket category)
      onChange(categoryId);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories of Interest
        </label>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories of Interest
        </label>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {multiple ? 'Categories of Interest' : 'Category'}
      </label>
      
      {multiple ? (
        // Multiple selection for categories of interest
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Select categories that interest you (you can select multiple):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {categories.map(category => (
              <label
                key={category._id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedValues.includes(category._id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(category._id)}
                  onChange={() => handleCategoryChange(category._id)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        // Single selection for ticket category
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a category (optional)</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CategorySelector; 