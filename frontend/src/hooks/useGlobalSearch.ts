import { useState, useCallback, useRef } from 'react';
import { getShips } from '../services/ships';
import { getUsers } from '../services/users';
import { getRepairs } from '../services/repairs';
import { getRepairRequests } from '../services/repairRequests';

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
  const requestRef = useRef(0);

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const currentRequest = ++requestRef.current;
    setIsSearching(true);

    try {
      const q = searchQuery.toLowerCase();
      const [ships, repairs, repairRequests, users] = await Promise.all([
        getShips({ search: searchQuery }),
        getRepairs(),
        getRepairRequests(),
        getUsers({ search: searchQuery }),
      ]);

      if (currentRequest !== requestRef.current) {
        return;
      }

      const requestById = new Map(repairRequests.map((request) => [request.id, request]));
      const searchResults: SearchResult[] = [];

      ships.forEach((ship) => {
        if (ship.name.toLowerCase().includes(q) || ship.imo.toLowerCase().includes(q)) {
          searchResults.push({
            type: 'ship',
            id: ship.id,
            title: ship.name,
            subtitle: `IMO: ${ship.imo} - ${ship.type}`,
            url: `/ships/${ship.id}`,
          });
        }
      });

      repairs.forEach((repair) => {
        const linkedRequest = requestById.get(repair.shipId);
        const shipName = linkedRequest?.shipName ?? repair.shipName;
        const matches =
          shipName.toLowerCase().includes(q) ||
          repair.repairType.toLowerCase().includes(q) ||
          repair.dock.toLowerCase().includes(q) ||
          String(repair.id).includes(q);

        if (matches) {
          searchResults.push({
            type: 'repair',
            id: repair.id,
            title: shipName,
            subtitle: `${repair.repairType} - ${repair.status}`,
            url: `/repairs/${repair.id}`,
          });
        }
      });

      users.forEach((user) => {
        searchResults.push({
          type: 'user',
          id: user.id,
          title: user.fullName,
          subtitle: user.role,
          url: `/users/${user.id}`,
        });
      });

      setResults(searchResults);
    } catch {
      if (currentRequest === requestRef.current) {
        setResults([]);
      }
    } finally {
      if (currentRequest === requestRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);

  return {
    query,
    results,
    isSearching,
    search,
    clearSearch,
    hasResults: results.length > 0,
  };
}
