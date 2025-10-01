import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Clock, AlertCircle, User, Hospital, Calendar } from 'lucide-react';

interface IncomingReferral {
  id: string;
  referral_id: string;
  status: string;
  urgency: string;
  reason: string;
  notes: string | null;
  created_at: string;
  appointment_date: string | null;
  patient: {
    full_name: string;
    patient_id: string;
    phone: string | null;
    email: string | null;
  };
  referring_doctor: {
    full_name: string;
    specialization: string | null;
  };
  origin_hospital: {
    name: string;
    city: string;
    state: string;
  };
  target_department: {
    name: string;
  };
}

const IncomingReferrals = () => {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<IncomingReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchIncomingReferrals();
    }
  }, [profile?.id]);

  const fetchIncomingReferrals = async () => {
    if (!profile?.id) return;

    try {
      // First, get the hospitals this doctor is assigned to
      const { data: assignedHospitals, error: hospitalsError } = await supabase
        .from('doctor_hospitals')
        .select('hospital_id')
        .eq('doctor_id', profile.id);

      if (hospitalsError) throw hospitalsError;

      if (!assignedHospitals || assignedHospitals.length === 0) {
        setReferrals([]);
        setLoading(false);
        return;
      }

      const hospitalIds = assignedHospitals.map(h => h.hospital_id);

      // Fetch referrals for all assigned hospitals
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          referral_id,
          status,
          urgency,
          reason,
          notes,
          created_at,
          appointment_date,
          patient:patients(full_name, patient_id, phone, email),
          referring_doctor:profiles!referrals_referring_doctor_id_fkey(full_name, specialization),
          origin_hospital:hospitals!referrals_origin_hospital_id_fkey(name, city, state),
          target_department:departments(name)
        `)
        .in('target_hospital_id', hospitalIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data as IncomingReferral[]);
    } catch (error) {
      console.error('Error fetching incoming referrals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch incoming referrals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    setUpdating(referralId);
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ 
          status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          ...(newStatus === 'completed' && { appointment_date: new Date().toISOString() })
        })
        .eq('id', referralId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Referral marked as ${newStatus.replace('_', ' ')}`
      });

      fetchIncomingReferrals();
    } catch (error) {
      console.error('Error updating referral status:', error);
      toast({
        title: "Error",
        description: "Failed to update referral status",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
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

  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const inProgressReferrals = referrals.filter(r => r.status === 'in_progress');
  const completedReferrals = referrals.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReferrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressReferrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReferrals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="w-5 h-5" />
            Incoming Referrals
          </CardTitle>
          <CardDescription>
            Referrals sent to your hospital that need review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading referrals...
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incoming referrals found.
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{referral.referral_id}</span>
                      <Badge className={getStatusColor(referral.status)}>
                        {formatStatus(referral.status)}
                      </Badge>
                      <Badge className={getUrgencyColor(referral.urgency)}>
                        {referral.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={referral.status}
                        onValueChange={(value) => updateReferralStatus(referral.id, value)}
                        disabled={updating === referral.id}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Patient:</span> {referral.patient.full_name}
                      </p>
                      <p className="ml-6 text-muted-foreground">ID: {referral.patient.patient_id}</p>
                      {referral.patient.phone && (
                        <p className="ml-6 text-muted-foreground">Phone: {referral.patient.phone}</p>
                      )}
                    </div>
                    <div>
                      <p><span className="font-medium">From:</span> Dr. {referral.referring_doctor.full_name}</p>
                      <p className="text-muted-foreground">
                        {referral.origin_hospital.name}, {referral.origin_hospital.city}
                      </p>
                      {referral.referring_doctor.specialization && (
                        <p className="text-muted-foreground">{referral.referring_doctor.specialization}</p>
                      )}
                    </div>
                    <div>
                      <p><span className="font-medium">Department:</span> {referral.target_department.name}</p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(referral.created_at)}
                      </p>
                      {referral.appointment_date && (
                        <p className="text-muted-foreground">
                          Completed: {formatDate(referral.appointment_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm"><span className="font-medium">Reason:</span> {referral.reason}</p>
                    {referral.notes && (
                      <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {referral.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomingReferrals;