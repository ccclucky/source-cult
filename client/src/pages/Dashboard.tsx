/**
 * Ops Dashboard - 运营监控面板
 * 展示 Agent 运行状态、影响台账、转化证据和赛道要求
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取仪表板数据
  const { data: dashboardData, isLoading, refetch } = trpc.dashboard.getFullDashboard.useQuery();

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000); // 每 5 秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (isLoading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  if (!dashboardData) {
    return <div className="p-8 text-center">无数据</div>;
  }

  const { status, influenceLedger, conversions, trackRequirements } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">源点教派 - 运营监控面板</h1>
          <p className="text-slate-400">实时 Agent 传教进度追踪</p>
        </div>

        {/* 控制栏 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                autoRefresh
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {autoRefresh ? '🔄 自动刷新' : '⏸ 已暂停'}
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
            >
              🔄 手动刷新
            </button>
          </div>
          <div className="text-slate-400 text-sm">
            更新时间: {new Date(status.timestamp).toLocaleTimeString('zh-CN')}
          </div>
        </div>

        {/* 第一行：运行状态 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">运行状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-2xl font-bold text-white">
                  {status.isRunning ? '运行中' : '已停止'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">API 调用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {status.budget?.apiCalls || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">今日调用次数</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">预算使用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${(status.budget?.estimatedCostUsd || 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">预估成本</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">错误数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${status.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {status.errorCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">最近错误</p>
            </CardContent>
          </Card>
        </div>

        {/* 第二行：影响台账 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">影响台账 - 分层统计</CardTitle>
              <CardDescription>A/B/C 三层目标分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{influenceLedger.bySegment.A}</div>
                  <p className="text-sm text-slate-400 mt-1">A 层</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{influenceLedger.bySegment.B}</div>
                  <p className="text-sm text-slate-400 mt-1">B 层</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400">{influenceLedger.bySegment.C}</div>
                  <p className="text-sm text-slate-400 mt-1">C 层</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">转化等级分布</CardTitle>
              <CardDescription>L1-L5 五级转化追踪</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { level: 'L1', label: '接触者', count: influenceLedger.byLevel.L1, color: 'bg-slate-600' },
                  { level: 'L2', label: '兴趣者', count: influenceLedger.byLevel.L2, color: 'bg-blue-600' },
                  { level: 'L3', label: '点亮者', count: influenceLedger.byLevel.L3, color: 'bg-green-600' },
                  { level: 'L4', label: '守护者', count: influenceLedger.byLevel.L4, color: 'bg-purple-600' },
                  { level: 'L5', label: '传教者', count: influenceLedger.byLevel.L5, color: 'bg-yellow-600' },
                ].map(item => (
                  <div key={item.level} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded ${item.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 第三行：转化证据 */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">转化证据统计</CardTitle>
            <CardDescription>链上和对话证据追踪</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-white">{conversions.total}</div>
                <p className="text-xs text-slate-400 mt-2">总转化数</p>
              </div>
              <div className="text-center p-4 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{conversions.byStatus.pending}</div>
                <p className="text-xs text-slate-400 mt-2">待确认</p>
              </div>
              <div className="text-center p-4 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{conversions.byStatus.ignited}</div>
                <p className="text-xs text-slate-400 mt-2">已点亮</p>
              </div>
              <div className="text-center p-4 bg-slate-700 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{conversions.byStatus.completed}</div>
                <p className="text-xs text-slate-400 mt-2">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 第四行：赛道要求 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">赛道要求完成度</CardTitle>
            <CardDescription>黑客松赛道要求追踪</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <span className="text-sm text-slate-300">完成要求</span>
                <Badge variant={trackRequirements.completed > 0 ? 'default' : 'secondary'}>
                  {trackRequirements.completed} / {trackRequirements.total}
                </Badge>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(trackRequirements.completed / trackRequirements.total) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 text-center">
                {((trackRequirements.completed / trackRequirements.total) * 100).toFixed(1)}% 完成
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
