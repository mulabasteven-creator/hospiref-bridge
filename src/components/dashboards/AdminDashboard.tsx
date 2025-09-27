import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import HospitalManagement from '@/components/admin/HospitalManagement';
import ReferralManagement from '@/components/admin/ReferralManagement';
import { 
  Building, 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  Hospital,
  UserCheck,
  Stethoscope
} from 'lucide-react';

interface Stats {
  hospitalCount: number;
  doctorCount: number;
  specialistCount: number;
  patientCount: number;
  referralCount: number;
  pendingReferrals: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    hospitalCount: 0,
    doctorCount: 0,
    specialistCount: 0,
    patientCount: 0,
    referralCount: 0,
    pendingReferrals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        hospitalsResult,
        doctorsResult,
        specialistsResult,
        patientsResult,
        referralsResult,
        pendingReferralsResult
      ] = await Promise.all([
        supabase.from('hospitals').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'specialist'),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('referrals').select('id', { count: 'exact', head: true }),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        hospitalCount: hospitalsResult.count || 0,
        doctorCount: doctorsResult.count || 0,
        specialistCount: specialistsResult.count || 0,
        patientCount: patientsResult.count || 0,
        referralCount: referralsResult.count || 0,
        pendingReferrals: pendingReferralsResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    description: string;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && <Badge variant="secondary" className="mt-1">{trend}</Badge>}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout 
      title="System Administration" 
      description="Manage hospitals, departments, users, and monitor system-wide metrics"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Hospitals"
            value={stats.hospitalCount}
            icon={Building}
            description="Active hospital facilities"
          />
          <StatCard
            title="Doctors"
            value={stats.doctorCount}
            icon={UserCheck}
            description="Registered doctors"
          />
          <StatCard
            title="Specialists"
            value={stats.specialistCount}
            icon={Stethoscope}
            description="Available specialists"
          />
          <StatCard
            title="Patients"
            value={stats.patientCount}
            icon={Users}
            description="Total patient records"
          />
          <StatCard
            title="Total Referrals"
            value={stats.referralCount}
            icon={FileText}
            description="All referrals processed"
          />
          <StatCard
            title="Pending Referrals"
            value={stats.pendingReferrals}
            icon={BarChart3}
            description="Awaiting specialist review"
            trend={stats.pendingReferrals > 0 ? "Needs attention" : "All clear"}
          />
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="hospitals" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hospitals">
              <Building className="w-4 h-4 mr-2" />
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <FileText className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Hospital className="w-4 h-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hospitals" className="space-y-4">
            <HospitalManagement />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <ReferralManagement />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Management</CardTitle>
                    <CardDescription>
                      Manage departments within hospitals
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Department management interface will be implemented here.
                  Features include creating departments, assigning specialists, and managing department details.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage system users and their roles
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  User management interface will be implemented here.
                  Features include user creation, role assignment, and profile management.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>
                  Generate reports and view analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Reporting and analytics interface will be implemented here.
                  Features include referral analytics, hospital performance, and system usage reports.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;