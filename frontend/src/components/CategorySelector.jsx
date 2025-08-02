import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import api from '../services/api';

const CategorySelector = ({ value, onChange, className = '' }) => {
  const [categories, setCategories] = useState([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/categories', newCategory);
      const createdCategory = response.data;
      
      // Add the new category to the list
      setCategories(prev => [...prev, createdCategory]);
      
      // Select the new category
      onChange(createdCategory._id);
      
      // Reset form
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
      setShowNewCategoryForm(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category
      </label>
      
      {!showNewCategoryForm ? (
        <div className="space-y-2">
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
          
          <button
            type="button"
            onClick={() => setShowNewCategoryForm(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <FaPlus className="w-3 h-3" />
            Create new category
          </button>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">Create New Category</h4>
            <button
              type="button"
              onClick={() => setShowNewCategoryForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name"
                maxLength={50}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this category"
                rows={2}
                maxLength={200}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategorySelector; 