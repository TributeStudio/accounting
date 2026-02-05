import type { Project, LogItem } from '../types';

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'Brand Refresh',
        client: 'Acme Corp',
        hourlyRate: 150,
        status: 'ACTIVE',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    },
    {
        id: 'p2',
        name: 'Q3 Campaign',
        client: 'Global Tech',
        hourlyRate: 175,
        status: 'ACTIVE',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    },
    {
        id: 'p3',
        name: 'Mobile App Design',
        client: 'StartupX',
        hourlyRate: 125,
        status: 'ACTIVE',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    },
];

export const MOCK_LOGS: LogItem[] = [
    {
        id: 'l1',
        projectId: 'p1',
        date: new Date().toISOString().split('T')[0],
        description: 'Initial Moodboarding',
        type: 'TIME',
        hours: 4,
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
        id: 'l2',
        projectId: 'p1',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
        description: 'Font Licenses',
        type: 'EXPENSE',
        cost: 200,
        markupPercent: 20,
        billableAmount: 240,
        profit: 40,
        createdAt: Date.now() - 1000 * 60 * 60 * 25,
    },
    {
        id: 'l3',
        projectId: 'p2',
        date: new Date().toISOString().split('T')[0],
        description: 'Social Media Assets',
        type: 'TIME',
        hours: 6,
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
    },
];
