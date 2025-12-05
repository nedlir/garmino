export interface RouteConfig {
  pathPrefix: string;
  targetService: string;
  targetPort: number;
  requiresAuth: boolean;
  publicPaths?: string[];  // Paths that don't require auth even if requiresAuth is true
}

export const routes: RouteConfig[] = [
  { 
    pathPrefix: '/auth', 
    targetService: 'auth', 
    targetPort: 3001, 
    requiresAuth: false 
  },
  { 
    pathPrefix: '/users', 
    targetService: 'users', 
    targetPort: 3002, 
    requiresAuth: true 
  },
  { 
    pathPrefix: '/garmin', 
    targetService: 'garmin-connect', 
    targetPort: 3003, 
    requiresAuth: true 
  },
  { 
    pathPrefix: '/activities', 
    targetService: 'activities-service', 
    targetPort: 3004, 
    requiresAuth: true 
  },
  { 
    pathPrefix: '/challenges', 
    targetService: 'challenge-service', 
    targetPort: 3005, 
    requiresAuth: true 
  },
  { 
    pathPrefix: '/leaderboard', 
    targetService: 'leaderboard-service', 
    targetPort: 3006, 
    requiresAuth: true 
  },
];
