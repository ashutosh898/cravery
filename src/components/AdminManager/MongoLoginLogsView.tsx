import { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Users,
  Server,
  Layers,
} from 'lucide-react';
import { LoginLog, DatabaseStatusInfo } from '../../types';
import { api } from '../../api';

interface MongoLoginLogsViewProps {
  onOpenAuthModal: () => void;
}

export function MongoLoginLogsView({ onOpenAuthModal }: MongoLoginLogsViewProps) {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogsAndStatus = async () => {
    setRefreshing(true);
    try {
      const [fetchedLogs, fetchedStatus] = await Promise.all([
        api.getLoginLogs({ status: statusFilter, email: searchEmail }),
        api.getDatabaseStatus(),
      ]);
      setLogs(fetchedLogs);
      setDbStatus(fetchedStatus);
    } catch (err) {
      console.error('Error fetching MongoDB logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogsAndStatus();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogsAndStatus();
  };

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* MongoDB Database Header & Telemetry */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Engine & User Security</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              MongoDB Database & User Login Logs
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Every authentication attempt is permanently captured in the MongoDB <code className="text-stone-800 bg-stone-100 px-1 py-0.5 rounded text-xs font-mono">login_logs</code> collection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogsAndStatus}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh MongoDB</span>
            </button>
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              Test Login / Sign In
            </button>
          </div>
        </div>

        {/* MongoDB Status Cards */}
        {dbStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Database Instance</span>
                <Server className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-stone-900 truncate">
                {dbStatus.databaseName}
              </div>
              <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {dbStatus.type === 'mongodb_atlas'
                    ? 'MongoDB Atlas (Connected)'
                    : 'MongoDB Document Engine (Active)'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900 tabular-nums">
                {dbStatus.totalUsers}
              </div>
              <div className="text-xs text-stone-500">
                Stored in <code className="font-mono text-stone-700">users</code> collection
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Total Logins Logged</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900 tabular-nums">
                {dbStatus.totalLoginLogs}
              </div>
              <div className="text-xs text-stone-500">
                Stored in <code className="font-mono text-stone-700">login_logs</code>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Collections</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-stone-900 tabular-nums">
                {dbStatus.collections.length}
              </div>
              <div className="text-xs text-stone-500 truncate">
                {dbStatus.collections.map((c) => c.name).join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status segmented tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Log Status:</span>
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Logs ({logs.length})
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'success'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Successful ({successCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>
        </div>

        {/* Email Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by user email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 w-60"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Login Logs Data Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">User Login Activity Logs</h2>
            <span className="text-xs text-stone-500">
              ({logs.length} events recorded)
            </span>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            Collection: db.login_logs
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            Querying MongoDB documents...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <AlertTriangle className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold">No login records match this filter</p>
            <p className="text-xs text-stone-400">
              Try clicking "Test Login / Sign In" above to generate a new login log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device & Client</th>
                  <th className="py-3 px-4">Session Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>SUCCESS</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>FAILED</span>
                            </span>
                            {log.failureReason && (
                              <span className="block text-[10px] text-rose-600 truncate max-w-[160px]">
                                {log.failureReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{log.userEmail}</div>
                        {log.userName && (
                          <div className="text-stone-500 text-[11px]">{log.userName}</div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize font-medium text-stone-700">
                          {log.role ? log.role.replace('_', ' ') : '—'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-600 tabular-nums">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>
                            {new Date(log.loginTimestamp).toLocaleDateString()} {new Date(log.loginTimestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-600 text-[11px]">
                        {log.ipAddress}
                      </td>

                      {/* Device */}
                      <td className="py-3.5 px-4 text-stone-600">
                        <div className="flex items-center gap-1 font-medium text-stone-800">
                          <Laptop className="w-3 h-3 text-stone-400" />
                          <span>{log.deviceType}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[200px]" title={log.userAgent}>
                          {log.userAgent}
                        </div>
                      </td>

                      {/* Session token */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-stone-400">
                        {log.sessionToken ? `${log.sessionToken.substring(0, 14)}...` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
