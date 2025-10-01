import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import ReferralManagement from "@/components/admin/ReferralManagement";
import DepartmentManagement from "@/components/admin/DepartmentManagement";
import PatientManagement from "@/components/admin/PatientManagement";
import IncomingReferrals from "@/components/admin/IncomingReferrals";
import { 
  FileText, 
  Users, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Hospital
} from 'lucide-react';

interface DoctorStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPatients: number;
}

interface Referral {
  id: string;
  referral_id: string;
  status: string;
  urgency: string;
  reason: string;
  created_at: string;
  patient: {
    full_name: string;
    patient_id: string;
  };
  target_hospital: {
    name: string;
  };
  target_department: {
    name: string;
  };
}

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DoctorStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalPatients: 0
  });
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedHospitals, setAssignedHospitals] = useState<Array<{ name: string; city: string }>>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch assigned hospitals
      const { data: hospitalsData } = await supabase
        .from('doctor_hospitals')
        .select('hospital_id, hospitals!inner(name, city)')
        .eq('doctor_id', profile.id);

      const hospitals = (hospitalsData || []).map(h => ({
        name: h.hospitals.name,
        city: h.hospitals.city
      }));
      setAssignedHospitals(hospitals);

      const hospitalIds = (hospitalsData || []).map(h => h.hospital_id);

      // Fetch stats
      const [
        totalReferralsResult,
        pendingReferralsResult,
        completedReferralsResult,
        patientsResult
      ] = await Promise.all([
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referring_doctor_id', profile.id),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referring_doctor_id', profile.id).eq('status', 'pending'),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referring_doctor_id', profile.id).eq('status', 'completed'),
        hospitalIds.length > 0 
          ? supabase.from('patients').select('id', { count: 'exact', head: true }).in('current_hospital_id', hospitalIds)
          : { count: 0 }
      ]);

      setStats({
        totalReferrals: totalReferralsResult.count || 0,
        pendingReferrals: pendingReferralsResult.count || 0,
        completedReferrals: completedReferralsResult.count || 0,
        totalPatients: patientsResult.count || 0
      });

      // Fetch recent referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referral_id,
          status,
          urgency,
          reason,
          created_at,
          patient:patients(full_name, patient_id),
          target_hospital:hospitals!referrals_target_hospital_id_fkey(name),
          target_department:departments(name)
        `)
        .eq('referring_doctor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      } else {
        setRecentReferrals(referralsData as Referral[]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      title="Doctor Dashboard" 
      description="Manage your referrals and patient care coordination"
    >
      <div className="space-y-6">
        {/* Profile Badge with Assigned Hospitals */}
        {assignedHospitals.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Assigned to:</span>
                {assignedHospitals.map((hospital, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Hospital className="w-3 h-3" />
                    {hospital.name} - {hospital.city}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals}
            icon={FileText}
            description="All referrals created"
          />
          <StatCard
            title="Pending Referrals"
            value={stats.pendingReferrals}
            icon={Clock}
            description="Awaiting specialist review"
            trend={stats.pendingReferrals > 0 ? "Active" : "All processed"}
          />
          <StatCard
            title="Completed Referrals"
            value={stats.completedReferrals}
            icon={CheckCircle}
            description="Successfully processed"
          />
          <StatCard
            title="Patients in Network"
            value={stats.totalPatients}
            icon={Users}
            description="At your hospital"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="incoming">
              <Clock className="w-4 h-4 mr-2" />
              Incoming
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <FileText className="w-4 h-4 mr-2" />
              My Referrals
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-2" />
              Create Referral
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Hospital className="w-4 h-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="patients">
              <Users className="w-4 h-4 mr-2" />
              Patients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            <IncomingReferrals />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
                <CardDescription>
                  Your recent patient referrals and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading referrals...
                  </div>
                ) : recentReferrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No referrals found. Create your first referral to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReferrals.map((referral) => (
                      <div key={referral.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{referral.referral_id}</span>
                            <Badge className={getStatusColor(referral.status)}>
                              {formatStatus(referral.status)}
                            </Badge>
                            <Badge className={getUrgencyColor(referral.urgency)}>
                              {referral.urgency.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(referral.created_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Patient:</span> {referral.patient.full_name}</p>
                            <p><span className="font-medium">Patient ID:</span> {referral.patient.patient_id}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">To:</span> {referral.target_hospital.name}</p>
                            <p><span className="font-medium">Department:</span> {referral.target_department.name}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm"><span className="font-medium">Reason:</span> {referral.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <ReferralManagement />
          </TabsContent>
          
          <TabsContent value="departments" className="space-y-4">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <PatientManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;