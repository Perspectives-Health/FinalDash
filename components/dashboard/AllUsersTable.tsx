import React, { useState, useEffect } from 'react' // Import useState, useEffect
import { CenterAnalyticsSummaryResponse, UserAnalyticsDetailResponse, InactiveUsersOverviewResponse, AllUsersPerCenterAnalyticsResponse } from "@/types/metrics"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, AlertCircle, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react" // Import MoreHorizontal
// Removed Collapsible components
// Removed Select components
// import MetricCard from "./metric-card" // Removed to fix linter error
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu" // Import DropdownMenu components
import EmailComposerModal from "@/components/shared/EmailComposerModal"
import { toast } from "@/components/ui/use-toast" // Import toast
import { api } from "@/services/api" // Import the api service

interface AllUsersTableProps {
  analyticsData: AllUsersPerCenterAnalyticsResponse | null; // Directly use the imported type
  loading: boolean
  setAnalyticsData: React.Dispatch<React.SetStateAction<AllUsersPerCenterAnalyticsResponse | null>> // Use the imported type consistently
}

interface UserDetailRowProps {
  user: UserAnalyticsDetailResponse;
  inactiveThresholdDays: number;
  onUserUpdate: (updatedUser: UserAnalyticsDetailResponse) => void; // New prop
}

const UserDetailRow: React.FC<UserDetailRowProps> = ({ user, inactiveThresholdDays, onUserUpdate }) => {
  const lastSessionDate = user.last_session_time ? new Date(user.last_session_time) : null;
  const now = new Date();
  const isInactive = lastSessionDate ? (now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24) > inactiveThresholdDays : true;

  const lastSeenText =
    lastSessionDate
      ? `${Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
      : "Never";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state for ignore toggle
  const [notes, setNotes] = useState<string>(user.notes || ""); // State for notes
  const [isSavingNotes, setIsSavingNotes] = useState(false); // New loading state for notes saving

  const handleIgnoreToggle = async () => {
    setIsLoading(true); // Set loading to true when action starts
    try {
      await api.updateUserIgnoreStatus(user.user_id, !user.ignore_user);

      const updatedUserData = { ...user, ignore_user: !user.ignore_user };
      onUserUpdate(updatedUserData);
      toast({
        title: "Success",
        description: `User ${user.email} has been ${updatedUserData.ignore_user ? 'ignored' : 'unignored'}.`,
      });
    } catch (error) {
      console.error("Failed to update user ignore status:", error);
      toast({
        title: "Error",
        description: `Failed to update user ${user.email} ignore status.`, 
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Reset loading regardless of success or failure
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = async () => {
    if (notes === (user.notes || "")) { // Only save if notes have changed
      return;
    }

    setIsSavingNotes(true); // Set loading for notes saving
    try {
      await api.updateUserNotes(user.user_id, notes);
      const updatedUser = { ...user, notes: notes };
      onUserUpdate(updatedUser); // Update parent state
      toast({
        title: "Success",
        description: "User notes updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update user notes:", error);
      toast({
        title: "Error",
        description: "Failed to update user notes.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false); // Reset loading
    }
  };

  return (
    <TableRow className={isInactive ? "bg-red-50/50" : (user.ignore_user ? "bg-gray-100/50" : "")}> {/* Conditional styling for ignored users */}
      <TableCell className="w-[200px]">
        <div className="flex items-center space-x-2">
          {isInactive && <AlertCircle className="h-4 w-4 text-red-500" />}
          <span className={isInactive ? "text-red-600 font-semibold" : (user.ignore_user ? "line-through text-gray-500" : "")}>{user.email}</span>
        </div>
      </TableCell>
      <TableCell className={isInactive ? "text-red-600" : ""}>{lastSeenText}</TableCell>
      <TableCell>{(user.avg_sessions_daily ?? 0).toFixed(2)}</TableCell> {/* New: Avg Sessions/Day */}
      <TableCell>{(user.avg_sessions_weekly ?? 0).toFixed(2)}</TableCell> {/* New: Avg Sessions/Week */}
      <TableCell>{(user.avg_sessions_monthly ?? 0).toFixed(2)}</TableCell> {/* New: Avg Sessions/Month */}
      <TableCell>{user.curr_extension_version || 'N/A'}</TableCell>
      <TableCell>{user.user_type}</TableCell>
      <TableCell className="relative"> {/* Add relative positioning for absolute spinner */}
        <textarea
          value={notes}
          onChange={handleNotesChange}
          onBlur={handleNotesBlur}
          className="w-full h-20 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="Add notes..."
          disabled={isSavingNotes} // Disable textarea while saving
        />
        {isSavingNotes && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
            <LoadingSpinner size="small" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
              Follow up
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={handleIgnoreToggle} disabled={isLoading}> {/* Disable during loading */}
              {isLoading ? <LoadingSpinner size="small" /> : (user.ignore_user ? "Unignore User" : "Ignore User")} {/* Show spinner or text */}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <EmailComposerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userEmail={user.email}
          userName={user.email.split('@')[0]}
        />
      </TableCell>
    </TableRow>
  );
};

const AllUsersTable: React.FC<AllUsersTableProps> = ({ analyticsData, loading, setAnalyticsData }) => {
  const [centersData, setCentersData] = useState(analyticsData?.centers_data); // Manage centersData locally
  const inactiveThresholdDays = analyticsData?.inactive_threshold_days ?? 30; // Provide a default value

  // Update centersData when analyticsData prop changes
  React.useEffect(() => {
    setCentersData(analyticsData?.centers_data);
  }, [analyticsData?.centers_data]);

  const handleUserUpdate = async (updatedUser: UserAnalyticsDetailResponse) => { // Make async
    // Optimize: Instead of refetching all, update the specific user in the local state
    setCentersData(prevCentersData => {
      if (!prevCentersData) return prevCentersData;
      return prevCentersData.map(center => ({
        ...center,
        users: center.users.map(u => (u.user_id === updatedUser.user_id ? updatedUser : u))
      }));
    });
    // Note: This optimization won't update aggregated metrics (total_users, etc.) immediately.
    // A full re-fetch might be needed if those aggregated numbers also need to reflect changes instantly.
    // For now, this is a good balance for notes and ignore_user status updates.
  };

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
        <LoadingSpinner showText text="Loading user data..." />
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
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center flex-shrink-0 p-4 border-b border-gray-200">
        <Users className="h-5 w-5 mr-2 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">All Users by Center</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedCentersData.map((center) => (
          <div key={center.center_name} className="mb-8 last:mb-0 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100/70 py-3 px-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900">{center.center_name}</h3>
              <span className="text-sm text-gray-700">
                Total Users: {center.total_users} | Active: {center.active_users_count} | Inactive: {center.inactive_users_count}
              </span>
            </div>
            <div className="bg-gray-50 py-2 px-4 text-xs text-gray-600 border-x border-gray-200">
                <div className="grid grid-cols-3 gap-x-4">
                    <div>Avg Sessions/Day: <span className="font-semibold text-gray-800">{(center.avg_sessions_daily ?? 0).toFixed(2)}</span></div>
                    <div>Avg Sessions/Week: <span className="font-semibold text-gray-800">{(center.avg_sessions_weekly ?? 0).toFixed(2)}</span></div>
                    <div>Avg Sessions/Month: <span className="font-semibold text-gray-800">{(center.avg_sessions_monthly ?? 0).toFixed(2)}</span></div>
                </div>
            </div>
            <Table className="rounded-b-lg overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">User Email</TableHead>
                  <TableHead className="cursor-pointer hover:text-gray-900" onClick={() => handleSort("lastActivityAt")}>
                    <div className="flex items-center">
                      Last Activity At
                      {sortColumn === "lastActivityAt" && (
     sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Avg Sessions/Day</TableHead>
                  <TableHead>Avg Sessions/Week</TableHead>
                  <TableHead>Avg Sessions/Month</TableHead>
                  <TableHead>Extension Version</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Notes</TableHead> {/* New Notes column */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {center.users
                  .filter((user: UserAnalyticsDetailResponse) => !user.ignore_user)
                  .map((user: UserAnalyticsDetailResponse) => (
                    <UserDetailRow key={user.user_id} user={user} inactiveThresholdDays={inactiveThresholdDays} onUserUpdate={handleUserUpdate} />
                  ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsersTable; 