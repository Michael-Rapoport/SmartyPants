import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

function SearchResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const query = useMemo(() => {
    return new URLSearchParams(location.search).get('q');
  }, [location.search]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/search', { params: { query } });
      setResults(response.data.entries);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Search Results for "{query}"</h2>
      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {results.map(result => (
            <li key={result.id} className="py-4">
              <h3 className="text-lg font-semibold">{result.title}</h3>
              <p className="mt-1 text-gray-600">{result.snippet}</p>
            </li>
          ))}
</ul>
      )}
    </div>
  );
}

export default React.memo(SearchResults);
