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
    <div className="card p-6 hover:scale-[1.02] transition-all group">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 rounded-2xl flex items-center justify-center text-3xl shadow-soft group-hover:shadow-soft-lg transition-shadow">
            {getActivityIcon(activity.activityType)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg tracking-tight">{activity.activityName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{activity.activityType}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="stat-card bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-100/50">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Distance</p>
          <p className="text-xl font-bold text-gray-900">{formatDistance(activity.distance)}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-purple-100/50">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Duration</p>
          <p className="text-xl font-bold text-gray-900">{formatDuration(activity.duration)}</p>
        </div>
        {activity.averageHR && (
          <div className="stat-card bg-gradient-to-br from-rose-50/80 to-orange-50/80 backdrop-blur-sm border border-rose-100/50">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Avg Heart Rate</p>
            <p className="text-xl font-bold text-gray-900">{activity.averageHR} <span className="text-sm font-normal text-gray-600">bpm</span></p>
          </div>
        )}
        <div className="stat-card bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm border border-emerald-100/50">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Calories</p>
          <p className="text-xl font-bold text-gray-900">{activity.calories} <span className="text-sm font-normal text-gray-600">kcal</span></p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{formatDate(activity.startTimeLocal)}</span>
      </div>
    </div>
  );
};
