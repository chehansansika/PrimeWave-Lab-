import React from 'react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/actions/reservations';
import { getCurrentProfile } from '@/lib/actions/auth';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';
import {
  Layers,
  CheckCircle,
  Calendar,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  CalendarCheck2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const { stats, recentActivity, topResources } = await getDashboardStats();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.full_name || 'User'} {profile?.role === 'administrator' ? '(Admin)' : ''} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is what is happening across your organization&apos;s shared resources today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/availability"
            className="btn btn-secondary btn-sm"
          >
            <CalendarCheck2 className="w-4 h-4 text-slate-600" />
            Check Availability
          </Link>
          <Link
            href="/reservations/new"
            className="btn btn-primary btn-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Book a Resource
          </Link>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Resources"
          value={stats.total_resources}
          description="Managed rooms & equipment"
          icon={Layers}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Resources"
          value={stats.active_resources}
          description="Ready for booking"
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Today's Reservations"
          value={stats.todays_reservations}
          description="Booked time slots today"
          icon={Calendar}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Upcoming Reservations"
          value={stats.upcoming_reservations}
          description="Future bookings scheduled"
          icon={Clock}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Two-Column Layout: Recent Activity & Resource Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List (2 cols on lg) */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Reservation Activity</h2>
                <p className="text-xs text-slate-500">Latest reservation requests and statuses</p>
              </div>
            </div>
            <Link
              href={profile?.role === 'administrator' ? '/admin/reservations' : '/reservations'}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reservation activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.resource_name}
                      </p>
                      <Badge status={activity.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Booked by <span className="font-medium text-slate-700">{activity.user_name}</span> &bull; {activity.purpose || 'No purpose specified'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700">
                      {formatDate(activity.start_time)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Utilization (1 col on lg) */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Most Utilized Resources</h2>
              <p className="text-xs text-slate-500">Past 30 days utilization</p>
            </div>
          </div>

          {topResources.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No utilization data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topResources.map((res, index) => (
                <div key={res.resource_id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
                        {res.resource_name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      {res.total_reservations} bookings
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{getCategoryLabel(res.category)}</span>
                    <span>{res.total_hours} hrs booked</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
