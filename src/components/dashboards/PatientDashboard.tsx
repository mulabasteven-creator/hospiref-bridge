import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
  Activity
} from 'lucide-react';

interface ReferralDetails {
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
  };
  referring_doctor: {
    full_name: string;
    specialization?: string;
  };
  target_specialist?: {
    full_name: string;
    specialization?: string;
  };
  origin_hospital: {
    name: string;
    city: string;
    state: string;
  };
  target_hospital: {
    name: string;
    city: string;
    state: string;
  };
  target_department: {
    name: string;
    description?: string;
  };
}

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [referralId, setReferralId] = useState('');
  const [referralDetails, setReferralDetails] = useState<ReferralDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const searchReferral = async () => {
    if (!referralId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a referral ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          referral_id,
          status,
          urgency,
          reason,
          notes,
          specialist_notes,
          appointment_date,
          created_at,
          patient:patients(full_name, patient_id),
          referring_doctor:profiles!referrals_referring_doctor_id_fkey(full_name, specialization),
          target_specialist:profiles!referrals_target_specialist_id_fkey(full_name, specialization),
          origin_hospital:hospitals!referrals_origin_hospital_id_fkey(name, city, state),
          target_hospital:hospitals!referrals_target_hospital_id_fkey(name, city, state),
          target_department:departments(name, description)
        `)
        .eq('referral_id', referralId.toUpperCase())
        .single();

      if (error) {
        toast({
          title: "Referral Not Found",
          description: "Please check the referral ID and try again",
          variant: "destructive"
        });
        setReferralDetails(null);
      } else {
        setReferralDetails(data as ReferralDetails);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for the referral",
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout 
      title="Patient Portal" 
      description="Track your referrals and manage your healthcare journey"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Welcome, {profile?.full_name}</CardTitle>
                <CardDescription>
                  Track your medical referrals and stay updated on your healthcare journey
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Track Your Referral</CardTitle>
            <CardDescription>
              Enter your referral ID to view the current status and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="referralId">Referral ID</Label>
                <Input
                  id="referralId"
                  type="text"
                  placeholder="Enter referral ID (e.g., REF-2024-123456)"
                  value={referralId}
                  onChange={(e) => setReferralId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={searchReferral} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Details */}
        {referralDetails && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(referralDetails.status)}
                  <div>
                    <CardTitle>Referral: {referralDetails.referral_id}</CardTitle>
                    <CardDescription>
                      Created on {formatDate(referralDetails.created_at)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getStatusColor(referralDetails.status)}>
                    {formatStatus(referralDetails.status)}
                  </Badge>
                  <Badge className={getUrgencyColor(referralDetails.urgency)}>
                    {referralDetails.urgency.toUpperCase()} Priority
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Timeline */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-3">Current Status</h3>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(referralDetails.status)}
                  <div>
                    <p className="font-medium">{formatStatus(referralDetails.status)}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralDetails.status === 'pending' && 'Your referral is waiting for specialist review'}
                      {referralDetails.status === 'in_progress' && 'Your referral is being processed by the specialist'}
                      {referralDetails.status === 'completed' && 'Your referral has been completed'}
                      {referralDetails.status === 'cancelled' && 'Your referral has been cancelled'}
                    </p>
                  </div>
                </div>
                {referralDetails.appointment_date && (
                  <div className="mt-3 p-3 bg-background rounded border">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium">Scheduled Appointment</span>
                    </div>
                    <p className="text-sm mt-1">{formatDate(referralDetails.appointment_date)}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Patient & Hospital Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Patient Information</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p><span className="font-medium">Name:</span> {referralDetails.patient.full_name}</p>
                    <p><span className="font-medium">Patient ID:</span> {referralDetails.patient.patient_id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Referring Hospital</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="font-medium">{referralDetails.origin_hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralDetails.origin_hospital.city}, {referralDetails.origin_hospital.state}
                    </p>
                    <p><span className="font-medium">Doctor:</span> {referralDetails.referring_doctor.full_name}</p>
                    {referralDetails.referring_doctor.specialization && (
                      <p className="text-sm text-muted-foreground">{referralDetails.referring_doctor.specialization}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Target Hospital Information */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Referred To</span>
                </div>
                <div className="pl-6 space-y-3">
                  <div>
                    <p className="font-medium">{referralDetails.target_hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralDetails.target_hospital.city}, {referralDetails.target_hospital.state}
                    </p>
                  </div>
                  <div>
                    <p><span className="font-medium">Department:</span> {referralDetails.target_department.name}</p>
                    {referralDetails.target_department.description && (
                      <p className="text-sm text-muted-foreground">{referralDetails.target_department.description}</p>
                    )}
                  </div>
                  {referralDetails.target_specialist && (
                    <div>
                      <p><span className="font-medium">Specialist:</span> {referralDetails.target_specialist.full_name}</p>
                      {referralDetails.target_specialist.specialization && (
                        <p className="text-sm text-muted-foreground">{referralDetails.target_specialist.specialization}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Medical Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Reason for Referral</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{referralDetails.reason}</p>
                  </div>
                </div>

                {referralDetails.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Additional Notes</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">{referralDetails.notes}</p>
                    </div>
                  </div>
                )}

                {referralDetails.specialist_notes && (
                  <div>
                    <h3 className="font-medium mb-2">Specialist Notes</h3>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                      <p className="text-sm">{referralDetails.specialist_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Contact information and support resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">Questions about your referral?</span><br />
                Contact your referring doctor or the target hospital directly.
              </p>
              <p className="text-sm">
                <span className="font-medium">Technical support:</span><br />
                If you're having trouble accessing your referral information, please contact our support team.
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Referral Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;