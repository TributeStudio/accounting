import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, LogItem, AppState } from '../types';
import { MOCK_PROJECTS, MOCK_LOGS } from '../utils/mockData';
import { auth, db, isConfigValid } from '../services/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface AppContextType extends AppState {
    signInWithGoogle: () => Promise<void>;
    enterDemoMode: () => void;
    signOut: () => Promise<void>;
    addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
    addLog: (log: Omit<LogItem, 'id' | 'createdAt'>) => Promise<void>;
    updateLog: (id: string, updates: Partial<LogItem>) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        user: null,
        projects: [],
        logs: [],
        isDemoMode: localStorage.getItem('demoMode') === 'true',
        isLoading: true,
    });

    useEffect(() => {
        if (state.isDemoMode) {
            // Load from localStorage or use mock data
            const savedProjects = localStorage.getItem('tribute_projects');
            const savedLogs = localStorage.getItem('tribute_logs');

            setState(prev => ({
                ...prev,
                user: { uid: 'demo-user', email: 'demo@tribute.studio', displayName: 'Creative Director', photoURL: null },
                projects: savedProjects ? JSON.parse(savedProjects) : MOCK_PROJECTS,
                logs: savedLogs ? JSON.parse(savedLogs) : MOCK_LOGS,
                isLoading: false,
            }));
        } else if (isConfigValid && auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setState(prev => ({ ...prev, user, isLoading: false }));

                    // Listen to Firestore
                    const projectsQuery = query(collection(db, 'users', user.uid, 'projects'), orderBy('createdAt', 'desc'));
                    const logsQuery = query(collection(db, 'users', user.uid, 'logs'), orderBy('createdAt', 'desc'));

                    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
                        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                        setState(prev => ({ ...prev, projects }));
                    });

                    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
                        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogItem));
                        setState(prev => ({ ...prev, logs }));
                    });

                    return () => {
                        unsubProjects();
                        unsubLogs();
                    };
                } else {
                    setState(prev => ({ ...prev, user: null, isLoading: false }));
                }
            });
            return () => unsubscribe();
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [state.isDemoMode]);

    // Persist demo data
    useEffect(() => {
        if (state.isDemoMode && !state.isLoading) {
            localStorage.setItem('tribute_projects', JSON.stringify(state.projects));
            localStorage.setItem('tribute_logs', JSON.stringify(state.logs));
        }
    }, [state.projects, state.logs, state.isDemoMode, state.isLoading]);

    const enterDemoMode = () => {
        localStorage.setItem('demoMode', 'true');
        setState(prev => ({ ...prev, isDemoMode: true }));
    };

    const signInWithGoogle = async () => {
        if (!isConfigValid) {
            enterDemoMode();
            return;
        }
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        if (state.isDemoMode) {
            localStorage.removeItem('demoMode');
            setState(prev => ({ ...prev, isDemoMode: false, user: null }));
        } else {
            await firebaseSignOut(auth);
        }
    };

    const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
        const newProject = { ...projectData, createdAt: Date.now() };
        if (state.isDemoMode) {
            setState(prev => ({
                ...prev,
                projects: [{ ...newProject, id: Math.random().toString(36).substr(2, 9) }, ...prev.projects]
            }));
        } else if (state.user) {
            await addDoc(collection(db, 'users', state.user.uid, 'projects'), newProject);
        }
    };

    const addLog = async (logData: Omit<LogItem, 'id' | 'createdAt'>) => {
        const newLog = { ...logData, createdAt: Date.now() };
        if (state.isDemoMode) {
            setState(prev => ({
                ...prev,
                logs: [{ ...newLog, id: Math.random().toString(36).substr(2, 9) }, ...prev.logs]
            }));
        } else if (state.user) {
            await addDoc(collection(db, 'users', state.user.uid, 'logs'), newLog);
        }
    };

    const deleteLog = async (id: string) => {
        if (state.isDemoMode) {
            setState(prev => ({ ...prev, logs: prev.logs.filter(l => l.id !== id) }));
        } else if (state.user) {
            await deleteDoc(doc(db, 'users', state.user.uid, 'logs', id));
        }
    };

    const updateLog = async (id: string, updates: Partial<LogItem>) => {
        if (state.isDemoMode) {
            setState(prev => ({
                ...prev,
                logs: prev.logs.map(l => l.id === id ? { ...l, ...updates } : l)
            }));
        } else if (state.user) {
            await updateDoc(doc(db, 'users', state.user.uid, 'logs', id), updates);
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        if (state.isDemoMode) {
            setState(prev => ({
                ...prev,
                projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
            }));
        } else if (state.user) {
            await updateDoc(doc(db, 'users', state.user.uid, 'projects', id), updates);
        }
    };

    return (
        <AppContext.Provider value={{
            ...state,
            signInWithGoogle,
            enterDemoMode,
            signOut,
            addProject,
            addLog,
            updateLog,
            deleteLog,
            updateProject
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
