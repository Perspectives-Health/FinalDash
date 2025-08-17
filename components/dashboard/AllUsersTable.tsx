import React, { useState } from 'react' // Import useState
import { CenterAnalyticsSummaryResponse, UserAnalyticsDetailResponse, InactiveUsersOverviewResponse } from "@/types/metrics"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, AlertCircle, ArrowUp, ArrowDown } from "lucide-react" // Import ArrowUp, ArrowDown
// Removed Collapsible components
// Removed Select components
import MetricCard from "./metric-card"

interface AllUsersTableProps {
  analyticsData: { // New prop to pass the entire analytics object
    inactive_users_overview: InactiveUsersOverviewResponse | null;
    centers_data: CenterAnalyticsSummaryResponse[] | null;
    inactive_threshold_days: number;
  }
  loading: boolean
}

const UserDetailRow: React.FC<{ user: UserAnalyticsDetailResponse, inactiveThresholdDays: number }> = ({ user, inactiveThresholdDays }) => {
  const lastSessionDate = user.last_session_time ? new Date(user.last_session_time) : null;
  const now = new Date();
  const isInactive = lastSessionDate ? (now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24) > inactiveThresholdDays : true;

  const lastSeenText = lastSessionDate 
    ? `${Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
    : "Never";

  return (
    <TableRow className={isInactive ? "bg-red-50/50" : ""}>
      <TableCell className="pl-8 py-2">
        <div className="flex items-center space-x-2">
          {isInactive && <AlertCircle className="h-4 w-4 text-red-500" />}
          <span className={isInactive ? "text-red-600 font-semibold" : ""}>{user.email}</span>
        </div>
      </TableCell>
      <TableCell>{user.user_type}</TableCell>
      <TableCell className={isInactive ? "text-red-600" : ""}>{lastSeenText}</TableCell>
      <TableCell>{user.curr_extension_version || 'N/A'}</TableCell>
    </TableRow>
  );
};

const AllUsersTable: React.FC<AllUsersTableProps> = ({ analyticsData, loading }) => {
  const centersData = analyticsData.centers_data;
  const inactiveThresholdDays = analyticsData.inactive_threshold_days;

  const [sortColumn, setSortColumn] = useState<string | null>("lastActivityAt"); // Default sort by Last Activity At
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Default ascending

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc"); // Default to ascending when changing column
    }
  };

  if (loading && !centersData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <LoadingSpinner size="large" />
        <p className="text-gray-500 mt-4">Loading user data...</p>
      </div>
    );
  }

  if (!centersData || centersData.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <p className="text-gray-500">No user data available.</p>
      </div>
    );
  }

  const sortedCentersData = centersData.map(center => {
    const sortedUsers = [...center.users].sort((a, b) => {
      if (sortColumn === "lastActivityAt") {
        const dateA = a.last_session_time ? new Date(a.last_session_time).getTime() : 0;
        const dateB = b.last_session_time ? new Date(b.last_session_time).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } 
      // Add more sorting logic for other columns if needed in the future
      return 0;
    });
    return { ...center, users: sortedUsers };
  });

  return (
    <Card className="col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          All Users by Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCentersData.map((center) => (
          <div key={center.center_name} className="mb-8 last:mb-0">
            <div className="bg-gray-100/70 py-3 px-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900">{center.center_name}</h3>
              <span className="text-sm text-gray-700">
                Total Users: {center.total_users} | Active: {center.active_users_count} | Inactive: {center.inactive_users_count} | Avg Sessions: {center.average_sessions_per_user.toFixed(2)}
              </span>
            </div>
            <Table className="rounded-b-lg overflow-hidden border border-gray-200">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">User Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead className="cursor-pointer hover:text-gray-900" onClick={() => handleSort("lastActivityAt")}>
                    <div className="flex items-center">
                      Last Activity At
                      {sortColumn === "lastActivityAt" && (
                        sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Extension Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {center.users.map((user: UserAnalyticsDetailResponse) => (
                  <UserDetailRow key={user.user_id} user={user} inactiveThresholdDays={inactiveThresholdDays} />
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AllUsersTable; 