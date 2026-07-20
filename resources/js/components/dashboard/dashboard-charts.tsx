import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import {
    CHART_COLORS,
    RESERVATION_STATUS_COLORS,
    TABLE_STATUS_COLORS,
    TENANT_STATUS_COLORS,
    PAYMENT_METHOD_COLORS,
} from '@/lib/dashboard-charts';
import type {
    DashboardCartaStats,
    DashboardCountPoint,
    DashboardDayPoint,
    DashboardMonthPoint,
    DashboardPaymentMethodPoint,
    DashboardSalesDayPoint,
} from '@/types/dashboard';

type ReservationsWeekChartProps = {
    data: DashboardDayPoint[];
    title: string;
    description?: string;
};

export function ReservationsWeekChart({
    data,
    title,
    description,
}: ReservationsWeekChartProps) {
    return (
        <ChartCard title={title} description={description}>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border/60"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                            contentStyle={{
                                borderRadius: '0.75rem',
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--card))',
                            }}
                        />
                        <Bar
                            dataKey="count"
                            name="Reservas"
                            radius={[6, 6, 0, 0]}
                            fill={CHART_COLORS.blue}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

type StatusDonutChartProps = {
    data: DashboardCountPoint[];
    title: string;
    description?: string;
    colorMap: Record<string, string>;
    labelForStatus: (status: string) => string;
};

export function StatusDonutChart({
    data,
    title,
    description,
    colorMap,
    labelForStatus,
}: StatusDonutChartProps) {
    const filtered = data.filter((row) => row.count > 0);
    const total = filtered.reduce((sum, row) => sum + row.count, 0);

    return (
        <ChartCard title={title} description={description}>
            {total === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    —
                </p>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={filtered}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                innerRadius={56}
                                outerRadius={88}
                                paddingAngle={2}
                            >
                                {filtered.map((entry) => (
                                    <Cell
                                        key={entry.status}
                                        fill={
                                            colorMap[entry.status] ??
                                            CHART_COLORS.slate
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, _name, item) => [
                                    value,
                                    labelForStatus(String(item.payload.status)),
                                ]}
                                contentStyle={{
                                    borderRadius: '0.75rem',
                                    border: '1px solid hsl(var(--border))',
                                    background: 'hsl(var(--card))',
                                }}
                            />
                            <Legend
                                formatter={(value) =>
                                    labelForStatus(String(value))
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartCard>
    );
}

type CartaBarChartProps = {
    stats: DashboardCartaStats;
    title: string;
    description?: string;
    labels: {
        available: string;
        with_image: string;
        published: string;
        without_image: string;
        unpublished: string;
    };
};

export function CartaBarChart({
    stats,
    title,
    description,
    labels,
}: CartaBarChartProps) {
    const data = [
        { name: labels.available, value: stats.available, fill: CHART_COLORS.green },
        { name: labels.with_image, value: stats.with_image, fill: CHART_COLORS.teal },
        { name: labels.published, value: stats.published, fill: CHART_COLORS.blue },
        { name: labels.without_image, value: stats.without_image, fill: CHART_COLORS.amber },
        { name: labels.unpublished, value: stats.unpublished, fill: CHART_COLORS.slate },
    ].filter((row) => row.value > 0 || stats.dishes === 0);

    return (
        <ChartCard title={title} description={description}>
            {stats.dishes === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    —
                </p>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                className="stroke-border/60"
                            />
                            <XAxis type="number" allowDecimals={false} hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={110}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '0.75rem',
                                    border: '1px solid hsl(var(--border))',
                                    background: 'hsl(var(--card))',
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartCard>
    );
}

type TenantsMonthChartProps = {
    data: DashboardMonthPoint[];
    title: string;
    description?: string;
    seriesLabel: string;
};

export function TenantsMonthChart({
    data,
    title,
    description,
    seriesLabel,
}: TenantsMonthChartProps) {
    return (
        <ChartCard title={title} description={description}>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border/60"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                            contentStyle={{
                                borderRadius: '0.75rem',
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--card))',
                            }}
                        />
                        <Bar
                            dataKey="count"
                            name={seriesLabel}
                            radius={[6, 6, 0, 0]}
                            fill={CHART_COLORS.orange}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

export {
    RESERVATION_STATUS_COLORS,
    TABLE_STATUS_COLORS,
    TENANT_STATUS_COLORS,
    PAYMENT_METHOD_COLORS,
};

type SalesWeekChartProps = {
    data: DashboardSalesDayPoint[];
    title: string;
    description?: string;
    amountLabel: string;
};

export function SalesWeekChart({
    data,
    title,
    description,
    amountLabel,
}: SalesWeekChartProps) {
    return (
        <ChartCard title={title} description={description}>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border/60"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                            formatter={(value) => [value, amountLabel]}
                            contentStyle={{
                                borderRadius: '0.75rem',
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--card))',
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            name={amountLabel}
                            radius={[6, 6, 0, 0]}
                            fill={CHART_COLORS.teal}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

type PaymentMethodsChartProps = {
    data: DashboardPaymentMethodPoint[];
    title: string;
    description?: string;
    labelForMethod: (method: string) => string;
};

export function PaymentMethodsChart({
    data,
    title,
    description,
    labelForMethod,
}: PaymentMethodsChartProps) {
    const chartData = data
        .filter((row) => row.total > 0)
        .map((row) => ({
            method: row.method,
            total: row.total,
            fill: PAYMENT_METHOD_COLORS[row.method] ?? CHART_COLORS.slate,
        }));

    return (
        <ChartCard title={title} description={description}>
            {chartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    —
                </p>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                className="stroke-border/60"
                            />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="method"
                                width={90}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => labelForMethod(String(value))}
                            />
                            <Tooltip
                                formatter={(value) => [value]}
                                labelFormatter={(label) => labelForMethod(String(label))}
                                contentStyle={{
                                    borderRadius: '0.75rem',
                                    border: '1px solid hsl(var(--border))',
                                    background: 'hsl(var(--card))',
                                }}
                            />
                            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.method} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartCard>
    );
}
