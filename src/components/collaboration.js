import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';

function Collaboration() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (selectedWorkspace) {
      try {
        const response = await api.get(`/api/workspaces/${selectedWorkspace.id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await api.get('/api/workspaces');
        setWorkspaces(response.data);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      }
    };
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [selectedWorkspace, fetchComments]);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    if (selectedWorkspace) {
      socket.emit('join workspace', selectedWorkspace.id);

      socket.on('new comment', (comment) => {
        setComments(prevComments => [...prevComments, comment]);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [selectedWorkspace]);

  const handleWorkspaceSelect = (workspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/workspaces/${selectedWorkspace.id}/comments`, { content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    // ... (rest of the component remains the same)
  );
}

export default React.memo(Collaboration);
