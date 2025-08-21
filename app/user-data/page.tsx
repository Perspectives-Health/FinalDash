"use client"

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AllUsersPerCenterAnalyticsResponse } from '@/types/metrics';
import { UserDataLoadingPage } from '@/components/shared/loading-page';
import AllUsersTable from '@/components/dashboard/AllUsersTable';

const UserDataPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AllUsersPerCenterAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const inactiveThresholdDays = 30; // Define or fetch this value as needed

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const data = await api.getAllUsersAnalyticsByCenter(inactiveThresholdDays);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch user analytics data:', error);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [inactiveThresholdDays]);

  return (
    <div className="w-full h-[calc(100vh-96px)]">
      {loading && !analyticsData ? (
        <UserDataLoadingPage />
      ) : !analyticsData || analyticsData.centers_data.length === 0 ? (
        <div className="text-center py-12 w-full">
          <p className="text-gray-500">No user data available.</p>
        </div>
      ) : (
        <AllUsersTable 
          analyticsData={analyticsData} 
          loading={loading} 
          setAnalyticsData={setAnalyticsData} 
        />
      )}
    </div>
  );
};

export default UserDataPage; 