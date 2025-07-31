import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../constants/app.js';

/**
 * Custom hook for managing session data fetching
 * @returns {Object} - Session data state and methods
 */
export function useSessionData() {
  const [sessionIds, setSessionIds] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available session IDs
  useEffect(() => {
    const fetchSessionIds = async () => {
      try {
        setError(null);
        const response = await fetch(`${BACKEND_URL}/api/get_session_ids`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch session IDs: ${response.status}`);
        }
        
        const data = await response.json();
        const ids = data.session_ids || [];
        
        setSessionIds(ids);
        
        // Auto-select the first session if available
        if (ids.length > 0 && !selectedSessionId) {
          setSelectedSessionId(ids[0]);
        }
      } catch (err) {
        console.error('Error fetching session IDs:', err);
        setError(err.message);
        setSessionIds([]);
      }
    };

    fetchSessionIds();
  }, [selectedSessionId]);

  // Fetch session data when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionData([]);
      return;
    }

    const fetchSessionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `${BACKEND_URL}/api/download?session_id=${selectedSessionId}&as_json=true`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch session data: ${response.status}`);
        }
        
        const data = await response.json();
        setSessionData(data.data || []);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err.message);
        setSessionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [selectedSessionId]);

  const selectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
  };

  const refreshSessionIds = async () => {
    try {
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/get_session_ids`);
      
      if (!response.ok) {
        throw new Error(`Failed to refresh session IDs: ${response.status}`);
      }
      
      const data = await response.json();
      setSessionIds(data.session_ids || []);
    } catch (err) {
      console.error('Error refreshing session IDs:', err);
      setError(err.message);
    }
  };

  return {
    sessionIds,
    selectedSessionId,
    sessionData,
    loading,
    error,
    selectSession,
    refreshSessionIds,
  };
}