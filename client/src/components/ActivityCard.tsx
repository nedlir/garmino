import type { ActivitySummary } from '../api/garmin';

interface ActivityCardProps {
  activity: ActivitySummary;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (activityType: string): string => {
    const type = activityType.toLowerCase();
    if (type.includes('run')) return '🏃';
    if (type.includes('cycl') || type.includes('bike')) return '🚴';
    if (type.includes('swim')) return '🏊';
    if (type.includes('walk')) return '🚶';
    if (type.includes('hike')) return '🥾';
    if (type.includes('yoga')) return '🧘';
    if (type.includes('strength') || type.includes('weight')) return '💪';
    return '🏋️';
  };

  return (
    <div>
      <div>
        <span>{getActivityIcon(activity.activityType)}</span>
        <div>
          <div>{activity.activityName}</div>
          <p>{activity.activityType}</p>
        </div>
      </div>
      
      <div>
        <div>
          <span>Distance</span>
          <span>{formatDistance(activity.distance)}</span>
        </div>
        <div>
          <span>Duration</span>
          <span>{formatDuration(activity.duration)}</span>
        </div>
        {activity.averageHR && (
          <div>
            <span>Avg HR</span>
            <span>{activity.averageHR} bpm</span>
          </div>
        )}
        <div>
          <span>Calories</span>
          <span>{activity.calories}</span>
        </div>
      </div>
      
      <div>
        <span>{formatDate(activity.startTimeLocal)}</span>
      </div>
    </div>
  );
};
