import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Building,
  Edit
} from 'lucide-react';

interface SpecialistStats {
  totalReferrals: number;
  pendingReferrals: number;
  inProgressReferrals: number;
  completedReferrals: number;
}

interface Referral {
  id: string;
  referral_id: string;
  status: string;
  urgency: string;
  reason: string;
  notes?: string;
  specialist_notes?: string;
  appointment_date?: string;
  created_at: string;
  patient: {
    full_name: string;
    patient_id: string;
    date_of_birth: string;
    gender: string;
    medical_history?: string;
  };
  referring_doctor: {
    full_name: string;
    specialization?: string;
  };
  origin_hospital: {
    name: string;
    city: string;
    state: string;
  };
}

const SpecialistDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SpecialistStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    inProgressReferrals: 0,
    completedReferrals: 0
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [updateData, setUpdateData] = useState<{
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | '';
    specialist_notes: string;
    appointment_date: string;
  }>({
    status: '',
    specialist_notes: '',
    appointment_date: ''
  });

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile?.id]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch stats - referrals assigned to this specialist or at their hospital
      const fallbackStats = await Promise.all([
        supabase.from('referrals').select('id', { count: 'exact', head: true })
          .or(`target_specialist_id.eq.${profile.id},target_hospital_id.eq.${profile.hospital_id}`),
        supabase.from('referrals').select('id', { count: 'exact', head: true })
          .or(`target_specialist_id.eq.${profile.id},target_hospital_id.eq.${profile.hospital_id}`)
          .eq('status', 'pending'),
        supabase.from('referrals').select('id', { count: 'exact', head: true })
          .or(`target_specialist_id.eq.${profile.id},target_hospital_id.eq.${profile.hospital_id}`)
          .eq('status', 'in_progress'),
        supabase.from('referrals').select('id', { count: 'exact', head: true })
          .or(`target_specialist_id.eq.${profile.id},target_hospital_id.eq.${profile.hospital_id}`)
          .eq('status', 'completed')
      ]);

      setStats({
        totalReferrals: fallbackStats[0].count || 0,
        pendingReferrals: fallbackStats[1].count || 0,
        inProgressReferrals: fallbackStats[2].count || 0,
        completedReferrals: fallbackStats[3].count || 0
      });

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referral_id,
          status,
          urgency,
          reason,
          notes,
          specialist_notes,
          appointment_date,
          created_at,
          patient:patients(full_name, patient_id, date_of_birth, gender, medical_history),
          referring_doctor:profiles!referrals_referring_doctor_id_fkey(full_name, specialization),
          origin_hospital:hospitals!referrals_origin_hospital_id_fkey(name, city, state)
        `)
        .or(`target_specialist_id.eq.${profile.id},target_hospital_id.eq.${profile.hospital_id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      } else {
        setReferrals(referralsData as Referral[]);
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

  const updateReferralStatus = async () => {
    if (!selectedReferral || !updateData.status) return;

    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          status: updateData.status,
          specialist_notes: updateData.specialist_notes || null,
          appointment_date: updateData.appointment_date || null
        })
        .eq('id', selectedReferral.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Referral updated successfully"
        });
        setSelectedReferral(null);
        setUpdateData({ status: '', specialist_notes: '', appointment_date: '' });
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      toast({
        title: "Error",
        description: "Failed to update referral",
        variant: "destructive"
      });
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

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout 
      title="Specialist Dashboard" 
      description="Review and manage incoming patient referrals"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals}
            icon={FileText}
            description="All referrals received"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingReferrals}
            icon={Clock}
            description="Awaiting your review"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressReferrals}
            icon={AlertTriangle}
            description="Currently processing"
          />
          <StatCard
            title="Completed"
            value={stats.completedReferrals}
            icon={CheckCircle}
            description="Successfully processed"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Pending ({stats.pendingReferrals})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              <AlertTriangle className="w-4 h-4 mr-2" />
              In Progress ({stats.inProgressReferrals})
            </TabsTrigger>
            <TabsTrigger value="all">
              <FileText className="w-4 h-4 mr-2" />
              All Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Referrals</CardTitle>
                <CardDescription>
                  Referrals that require your immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading referrals...
                  </div>
                ) : referrals.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending referrals at this time.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.filter(r => r.status === 'pending').map((referral) => (
                      <div key={referral.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">{referral.referral_id}</span>
                            <Badge className={getUrgencyColor(referral.urgency)}>
                              {referral.urgency.toUpperCase()} Priority
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(referral.created_at)}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedReferral(referral);
                                setUpdateData({
                                  status: 'in_progress',
                                  specialist_notes: referral.specialist_notes || '',
                                  appointment_date: referral.appointment_date || ''
                                });
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">Patient Details</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <p><span className="font-medium">Name:</span> {referral.patient.full_name}</p>
                              <p><span className="font-medium">ID:</span> {referral.patient.patient_id}</p>
                              <p><span className="font-medium">Age:</span> {calculateAge(referral.patient.date_of_birth)} years</p>
                              <p><span className="font-medium">Gender:</span> {referral.patient.gender}</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">Referring Details</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <p><span className="font-medium">Doctor:</span> {referral.referring_doctor.full_name}</p>
                              {referral.referring_doctor.specialization && (
                                <p className="text-muted-foreground">{referral.referring_doctor.specialization}</p>
                              )}
                              <p><span className="font-medium">Hospital:</span> {referral.origin_hospital.name}</p>
                              <p className="text-muted-foreground">{referral.origin_hospital.city}, {referral.origin_hospital.state}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <p className="text-sm"><span className="font-medium">Reason for Referral:</span></p>
                          <p className="text-sm bg-muted p-2 rounded">{referral.reason}</p>
                          
                          {referral.notes && (
                            <>
                              <p className="text-sm"><span className="font-medium">Additional Notes:</span></p>
                              <p className="text-sm bg-muted p-2 rounded">{referral.notes}</p>
                            </>
                          )}
                          
                          {referral.patient.medical_history && (
                            <>
                              <p className="text-sm"><span className="font-medium">Medical History:</span></p>
                              <p className="text-sm bg-muted p-2 rounded">{referral.patient.medical_history}</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>In Progress Referrals</CardTitle>
                <CardDescription>
                  Referrals currently being processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  In progress referrals will be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Referrals</CardTitle>
                <CardDescription>
                  Complete history of referrals assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  All referrals history will be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Referral Modal/Dialog */}
        {selectedReferral && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-background p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Update Referral: {selectedReferral.referral_id}</CardTitle>
                <CardDescription>
                  Update the status and add specialist notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={updateData.status} onValueChange={(value) => setUpdateData({...updateData, status: value as 'pending' | 'in_progress' | 'completed' | 'cancelled' | ''})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Specialist Notes</label>
                  <Textarea
                    placeholder="Add your notes about this referral..."
                    value={updateData.specialist_notes}
                    onChange={(e) => setUpdateData({...updateData, specialist_notes: e.target.value})}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Appointment Date (Optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={updateData.appointment_date}
                    onChange={(e) => setUpdateData({...updateData, appointment_date: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedReferral(null)}>
                    Cancel
                  </Button>
                  <Button onClick={updateReferralStatus}>
                    Update Referral
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SpecialistDashboard;