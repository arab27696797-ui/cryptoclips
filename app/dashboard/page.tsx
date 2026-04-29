'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, Video, Palette, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  projects: number;
  renders: number;
  brandPresets: number;
}

interface Usage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  planName: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [recentRenders, setRecentRenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/workspace/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsage(data.usage);
        setRecentRenders(data.recentRenders || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-600">
            Here's what's happening with your crypto content
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Usage Card */}
      {usage && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {usage.used} / {usage.limit}
                  </p>
                  <p className="text-sm text-gray-600">
                    {usage.remaining} generations remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{usage.planName}</p>
                  <Link
                    href="/dashboard/billing"
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Manage plan →
                  </Link>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-600 transition-all"
                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Projects
            </CardTitle>
            <Video className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projects || 0}</div>
            <p className="text-xs text-gray-500">Active crypto content projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Renders
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.renders || 0}</div>
            <p className="text-xs text-gray-500">Videos created all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Brand Presets
            </CardTitle>
            <Palette className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.brandPresets || 0}</div>
            <p className="text-xs text-gray-500">Saved brand styles</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Renders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Renders</CardTitle>
            <Link
              href="/dashboard/renders"
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRenders.length === 0 ? (
            <div className="py-12 text-center">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No renders yet</p>
              <p className="text-sm text-gray-500">
                Create your first project to get started
              </p>
              <Link href="/dashboard/projects/new">
                <Button className="mt-4 gap-2" variant="outline">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRenders.map((render) => (
                <div
                  key={render.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        render.status === 'completed'
                          ? 'bg-green-500'
                          : render.status === 'failed'
                          ? 'bg-red-500'
                          : render.status === 'processing'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{render.project.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(render.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      render.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : render.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : render.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {render.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
