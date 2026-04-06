import { useState, useCallback } from 'react';
import { mockShips, mockExtendedRepairs } from '../mock-data/data';
import { mockUsers } from '../mock-data/mockUsers';

export interface SearchResult {
  type: 'ship' | 'repair' | 'user';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const q = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];
    
    // Search ships
    mockShips.forEach((ship) => {
      if (ship.name.toLowerCase().includes(q) || ship.imo.includes(q)) {
        searchResults.push({
          type: 'ship',
          id: ship.id,
          title: ship.name,
          subtitle: `IMO: ${ship.imo} • ${ship.type}`,
          url: `/ships/${ship.id}`
        });
      }
    });
    
    // Search repairs
    mockExtendedRepairs.forEach((repair) => {
      if (repair.shipName.toLowerCase().includes(q) || repair.repairType.toLowerCase().includes(q)) {
        searchResults.push({
          type: 'repair',
          id: repair.id,
          title: repair.shipName,
          subtitle: `${repair.repairType} • ${repair.status}`,
          url: `/repairs/${repair.id}`
        });
      }
    });
    
    // Search users
    mockUsers.forEach((user) => {
      if (user.fullName.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)) {
        searchResults.push({
          type: 'user',
          id: searchResults.length + 1,
          title: user.fullName,
          subtitle: user.role,
          url: `/users/${encodeURIComponent(user.email)}`
        });
      }
    });
    
    setResults(searchResults);
    setIsSearching(false);
  }, []);
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);
  
  return {
    query,
    results,
    isSearching,
    search,
    clearSearch,
    hasResults: results.length > 0
  };
}