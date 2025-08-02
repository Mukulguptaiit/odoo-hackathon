import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useTickets = (filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    category = '',
    search = '',
    assignedTo = '',
    ...otherFilters
  } = filters;

  return useQuery({
    queryKey: ['tickets', { page, limit, status, category, search, assignedTo, ...otherFilters }],
    queryFn: async () => {
      const params = {
        page,
        limit,
        ...(status && { status }),
        ...(category && { category }),
        ...(search && { search }),
        ...(assignedTo && { assignedTo }),
        ...otherFilters
      };

      const response = await api.get('/tickets', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    keepPreviousData: true, // Keep previous data while fetching new data
    ...options
  });
};

export const useTicketStats = () => {
  return useQuery({
    queryKey: ['ticketStats'],
    queryFn: async () => {
      // Get minimal data for stats instead of all tickets
      const response = await api.get('/tickets', { 
        params: { 
          limit: 100, // Reduced from 1000 to 100
          page: 1,
          stats: true // Backend should optimize this
        } 
      });
      
      const tickets = response.data.tickets;
      
      // Calculate stats
      const totalQuestions = response.data.total || tickets.length;
      const answeredQuestions = tickets.filter(t => 
        ['resolved', 'closed'].includes(t.status)
      ).length;
      const unansweredQuestions = totalQuestions - answeredQuestions;

      // Category breakdown
      const categoryMap = {};
      tickets.forEach(ticket => {
        if (ticket.category) {
          const categoryName = ticket.category.name;
          categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
        }
      });

      const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count,
        color: getCategoryColor(name)
      }));

      return {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
        categoryBreakdown,
        recentTickets: tickets.slice(0, 5)
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 20 * 60 * 1000, // 20 minutes cache
  });
};

const getCategoryColor = (categoryName) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
  ];
  const index = categoryName.length % colors.length;
  return colors[index];
}; 