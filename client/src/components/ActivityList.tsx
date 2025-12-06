import { useState, useEffect } from 'react';
import { getGarminActivities } from '../api/garmin';
import type { ActivitySummary, ActivityListParams } from '../api/garmin';
import { ActivityCard } from './ActivityCard';
import { Button } from './Button';
import { Loading } from './Loading';

interface ActivityListProps {
  refreshTrigger?: number;
}

export const ActivityList = ({ refreshTrigger }: ActivityListProps) => {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    start: 0,
    limit: 10,
    total: 0,
  });

  const fetchActivities = async (params?: ActivityListParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getGarminActivities(params);
      setActivities(response.activities);
      setPagination({
        start: response.start,
        limit: response.limit,
        total: response.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities({ start: pagination.start, limit: pagination.limit });
  }, [refreshTrigger]);

  const handleLoadMore = () => {
    const newStart = pagination.start + pagination.limit;
    fetchActivities({ start: newStart, limit: pagination.limit });
  };

  const handleRetry = () => {
    fetchActivities({ start: 0, limit: pagination.limit });
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="card p-16">
        <Loading message="Loading activities..." size="lg" />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="card p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-soft">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load activities</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto leading-relaxed">{error}</p>
          <Button variant="primary" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card p-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
            <span className="text-5xl">📊</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No activities yet</h3>
          <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
            Your Garmin activities will appear here once synced. Start tracking your workouts!
          </p>
        </div>
      </div>
    );
  }

  const hasMore = pagination.start + pagination.limit < pagination.total;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Recent Activities</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Showing {activities.length} of {pagination.total} activities
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.activityId} activity={activity} />
        ))}
      </div>

      {error && (
        <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-rose-500 text-xl">⚠️</span>
              <p className="text-sm text-rose-800 font-medium">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            isLoading={isLoading}
          >
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
};
