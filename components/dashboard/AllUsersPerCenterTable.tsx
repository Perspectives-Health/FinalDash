import React, { useState } from 'react'
import { CenterAnalyticsSummaryResponse, UserAnalyticsDetailResponse } from "@/types/metrics"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight, ChevronDown, Filter, Users } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface AllUsersPerCenterTableProps {
  centersData: CenterAnalyticsSummaryResponse[] | null
  inactiveThresholdDays: number
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
      <TableCell className={isInactive ? "text-red-600" : ""}>{lastSeenText}</TableCell>
      <TableCell>{user.total_sessions}</TableCell>
      <TableCell>
        <button className="text-blue-500 hover:underline text-sm">Reach Out</button>
      </TableCell>
    </TableRow>
  );
};

const AllUsersPerCenterTable: React.FC<AllUsersPerCenterTableProps> = ({ centersData, inactiveThresholdDays, loading }) => {
  const [selectedCenter, setSelectedCenter] = useState<string>("All Centers");

  if (loading && !centersData) {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!centersData || centersData.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <p className="text-gray-500">No user data available per center.</p>
      </div>
    );
  }

  const filteredCenters = selectedCenter === "All Centers"
    ? centersData
    : centersData.filter(center => center.center_name === selectedCenter);

  const allCenterNames = ["All Centers", ...centersData.map(center => center.center_name)].sort();

  return (
    <Card className="col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            All User Activity by Center
          </div>
          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a center" />
            </SelectTrigger>
            <SelectContent>
              {allCenterNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Center Name</TableHead>
              <TableHead>Total Users</TableHead>
              <TableHead>Active Users</TableHead>
              <TableHead>Inactive Users</TableHead>
              <TableHead>Avg Sessions/User</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCenters.map((center) => (
              <Collapsible asChild key={center.center_name}>
                <>
                  <TableRow className="hover:bg-gray-50 data-[state=open]:bg-gray-50">
                    <TableCell className="font-medium">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center cursor-pointer">
                          {center.center_name}
                          <span className="ml-2 text-gray-500">
                            <ChevronRight className="h-4 w-4 data-[state=open]:hidden" />
                            <ChevronDown className="h-4 w-4 data-[state=closed]:hidden" />
                          </span>
                        </div>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>{center.total_users}</TableCell>
                    <TableCell>{center.active_users_count}</TableCell>
                    <TableCell className={center.inactive_users_count > 0 ? "text-red-600 font-semibold" : ""}>
                      {center.inactive_users_count}
                    </TableCell>
                    <TableCell>{center.average_sessions_per_user.toFixed(2)}</TableCell>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center cursor-pointer justify-end">
                          <ChevronRight className="h-4 w-4 data-[state=open]:hidden" />
                          <ChevronDown className="h-4 w-4 data-[state=closed]:hidden" />
                        </div>
                      </CollapsibleTrigger>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-gray-100/50 pt-2 pb-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">User Email</TableHead>
                                <TableHead>Last Seen</TableHead>
                                <TableHead>Total Sessions</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {center.users.map((user) => (
                                <UserDetailRow key={user.user_id} user={user} inactiveThresholdDays={inactiveThresholdDays} />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AllUsersPerCenterTable; 