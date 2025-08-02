import { useQuery } from '@tanstack/react-query';
import { categoriesAPI } from '../services/api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    cacheTime: 60 * 60 * 1000, // 1 hour cache
  });
};

export const useUserInterests = () => {
  return useQuery({
    queryKey: ['userInterests'],
    queryFn: () => categoriesAPI.getUserInterests().then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
  });
}; 