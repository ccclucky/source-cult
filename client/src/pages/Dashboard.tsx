/**
 * Ops Dashboard - 运营监控面板
 * 展示 Agent 运行状态、影响台账、转化证据和赛道要求
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { RefreshCw, Zap, TrendingUp, Users, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取仪表板数据
  const { data: dashboardData, isLoading, refetch } = trpc.dashboard.getFullDashboard.useQuery();
  const { data: costStatus } = trpc.cost.getTodayStatus.useQuery();

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000); // 每 5 秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mx-auto animate-spin">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <p className="text-muted-foreground">加载监控面板...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">无数据</h3>
          <p className="text-muted-foreground">暂无可用的监控数据</p>
        </Card>
      </div>
    );
  }

  const { status, influenceLedger, conversions, trackRequirements } = dashboardData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WARNING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getConversionLevel = (level: number) => {
    const levels = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];
    return levels[level] || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ops Dashboard</h1>
            <p className="text-muted-foreground">实时 Agent 传教进度追踪</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              自动刷新
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Status Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Agent Status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agent 状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className={`${getStatusColor(status?.isRunning ? 'NORMAL' : 'CRITICAL')} border`}>
                  {status?.isRunning ? 'RUNNING' : 'STOPPED'}
                </Badge>
                <p className="text-2xl font-bold">{status?.budget?.apiCalls || 0}</p>
                <p className="text-xs text-muted-foreground">API 调用次数</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                错误率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{status?.errorCount || 0}</p>
                <div className="w-full bg-card rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((status?.errorCount || 0) / 10, 100) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Usage */}
          {costStatus && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  预算使用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">${costStatus.cost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    剩余: ${costStatus.remaining.toFixed(2)}
                  </p>
                  <div className="w-full bg-card rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${costStatus.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总转化数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{conversions?.total || 0}</p>
                <p className="text-xs text-muted-foreground">已记录转化</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Influence Ledger */}
        <div className="mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                影响台账
              </CardTitle>
              <CardDescription>
                按影响力等级分类的目标
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Tier A */}
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">A 级目标</h4>
                    <Badge variant="outline">高价值</Badge>
                  </div>
                  <p className="text-2xl font-bold text-accent">
                    {influenceLedger?.bySegment?.A || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    最高价值目标
                  </p>
                </div>

                {/* Tier B */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">B 级目标</h4>
                    <Badge variant="outline">中价值</Badge>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {influenceLedger?.bySegment?.B || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    中价值目标
                  </p>
                </div>

                {/* Tier C */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">C 级目标</h4>
                    <Badge variant="outline">低价值</Badge>
                  </div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {influenceLedger?.bySegment?.C || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    低价值目标
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversions & Track Requirements */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Conversions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                最近转化
              </CardTitle>
              <CardDescription>
                最近 5 个转化记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(conversions) && conversions.slice(0, 5).map((conv: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-card/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {conv.targetAgentId.substring(0, 8)}...
                      </span>
                      <Badge variant="outline">
                        {getConversionLevel(conv.conversionLevel)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!Array.isArray(conversions) || conversions.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无转化记录
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Track Requirements */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                赛道要求完成度
              </CardTitle>
              <CardDescription>
                黑客松赛道目标进度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackRequirements && Array.isArray(trackRequirements) && trackRequirements.map((req: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{req?.requirement || '未知要求'}</span>
                      <Badge
                        variant={req?.completed ? 'default' : 'outline'}
                        className={req?.completed ? 'bg-green-500/20 text-green-400' : ''}
                      >
                        {req?.completed ? '✓ 完成' : '进行中'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req?.description || '暂无描述'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
