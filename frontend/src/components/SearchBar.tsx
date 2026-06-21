import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { companiesApi, type SearchResult } from '../api/companies';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSearchedQuery = useRef<string>('');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cleanQuery = query.trim();
      if (cleanQuery.length === 0) {
        setResults([]);
        setIsOpen(false);
        lastSearchedQuery.current = '';
        return;
      }
      
      if (cleanQuery === lastSearchedQuery.current) {
        return; // Prevent redundant searches for the exact same query
      }

      setIsLoading(true);
      try {
        const data = await companiesApi.search(cleanQuery);
        setResults(data);
        setIsOpen(true);
        lastSearchedQuery.current = cleanQuery;
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && results.length > 0 && isOpen) {
      handleSelect(results[0]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/company/${result.ticker}`, { state: { companyName: result.name } });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-(--cl-color-text-muted)" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-10 py-4 border border-(--cl-color-border) rounded-(--cl-radius-lg) leading-5 bg-(--cl-color-surface) text-(--cl-color-text) placeholder-(--cl-color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-color-primary) focus:border-(--cl-color-primary) sm:text-lg backdrop-blur-xl transition-all shadow-(--cl-shadow-md)"
          placeholder="Search for a company (e.g. Apple, Tesla)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 text-(--cl-color-primary) animate-spin" />
          </div>
        )}
      </div>

      {isOpen && !isLoading && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-(--cl-radius-lg) bg-(--cl-color-surface) border border-(--cl-color-border) shadow-(--cl-shadow-md) p-4 text-center text-(--cl-color-text-muted)">
          No companies found matching "{query}"
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-(--cl-radius-lg) bg-(--cl-color-surface) border border-(--cl-color-border) shadow-(--cl-shadow-md) overflow-hidden">
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((result) => (
              <li
                key={result.ticker}
                className="px-4 py-3 hover:bg-(--cl-color-surface-soft) cursor-pointer flex justify-between items-center transition-colors"
                onClick={() => handleSelect(result)}
              >
                <div>
                  <div className="text-(--cl-color-text) font-medium">{result.name}</div>
                  <div className="text-(--cl-color-text-muted) text-sm">{result.exchange}</div>
                </div>
                <div className="bg-(--cl-color-primary-soft) text-(--cl-color-primary) px-3 py-1 rounded-(--cl-radius-sm) text-sm font-semibold">
                  {result.ticker.split('.')[0]}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
