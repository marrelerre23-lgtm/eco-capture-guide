import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ParsedSpeciesCapture } from '@/hooks/useSpeciesCaptures';

interface StatsChartProps {
  captures: ParsedSpeciesCapture[];
}

export const StatsChart = ({ captures }: StatsChartProps) => {
  // Calculate data for charts
  const timelineData = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    
    captures.forEach(capture => {
      const date = new Date(capture.captured_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, count]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('sv-SE', { month: 'short' });
        return {
          month: monthName,
          captures: count
        };
      });
  }, [captures]);

  const categoryData = useMemo(() => {
    const categoryCounts: { [key: string]: number } = {};
    
    captures.forEach(capture => {
      const category = capture.ai_analysis?.species?.category || 'Okänd';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [captures]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (captures.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Ingen data att visa ännu. Börja fånga arter för att se statistik!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fångster över tid</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="captures" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fångster per kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                  label={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {categoryData.slice(0, 5).map((category, index) => (
                <div key={category.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs truncate flex-1">{category.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">{category.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitet per månad</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="captures" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
