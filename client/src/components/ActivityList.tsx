import { useState, useEffect } from 'react';
import { getGarminActivities } from '../api/garmin';
import type { ActivitySummary, ActivityListParams } from '../api/garmin';
import { ActivityCard } from './ActivityCard';

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
      <div>
        <div>
          <div></div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div>
        <div>
          <p>{error}</p>
          <button onClick={handleRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div>
        <div>
          <p>No activities found</p>
          <p>
            Your Garmin activities will appear here once synced
          </p>
        </div>
      </div>
    );
  }

  const hasMore = pagination.start + pagination.limit < pagination.total;

  return (
    <div>
      <div>
        <div>Recent Activities</div>
        <span>
          {activities.length} of {pagination.total}
        </span>
      </div>

      <div>
        {activities.map((activity) => (
          <ActivityCard key={activity.activityId} activity={activity} />
        ))}
      </div>

      {error && (
        <div>
          <p>{error}</p>
          <button onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {hasMore && (
        <div>
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};
