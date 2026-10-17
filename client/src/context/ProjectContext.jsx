import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      return;
    }
    try {
      setLoading(true);
      const res = await projectService.getProjects({ limit: 50 });
      if (res && res.data) {
        setProjects(res.data);
        // If currentProject is not set or not in new list, pick the first
        if (res.data.length > 0) {
          setCurrentProject((prev) => {
            if (prev && res.data.some((p) => p._id === prev._id)) {
              return res.data.find((p) => p._id === prev._id);
            }
            return res.data[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        refreshProjects: fetchProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);
