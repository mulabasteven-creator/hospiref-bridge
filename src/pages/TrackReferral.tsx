import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Heart, Search, ArrowLeft, Clock, User, Building, Calendar } from 'lucide-react';

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

const TrackReferral = () => {
  const [referralId, setReferralId] = useState('');
  const [referralDetails, setReferralDetails] = useState<ReferralDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setReferralId(idFromUrl);
      // Auto-search if ID is provided in URL
      setTimeout(() => {
        searchReferral(idFromUrl);
      }, 100);
    }
  }, [searchParams]);

  const searchReferral = async (idToSearch?: string) => {
    const searchId = idToSearch || referralId;
    if (!searchId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a referral ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use the database function for public tracking
      const { data, error } = await supabase
        .rpc('get_referral_public', { _referral_id: searchId });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching for the referral",
          variant: "destructive"
        });
        setReferralDetails(null);
      } else if (!data || data.length === 0) {
        toast({
          title: "Referral Not Found",
          description: "Please check the referral ID and try again",
          variant: "destructive"
        });
        setReferralDetails(null);
      } else {
        // Map the database response to our interface
        const referralData = data[0];
        const mappedData: ReferralDetails = {
          referral_id: referralData.referral_id,
          status: referralData.status,
          urgency: referralData.urgency,
          reason: referralData.reason,
          notes: referralData.notes,
          specialist_notes: null,
          appointment_date: referralData.appointment_date,
          created_at: referralData.created_at,
          patient: {
            full_name: referralData.patient_full_name,
            patient_id: referralData.patient_id
          },
          referring_doctor: {
            full_name: referralData.referring_doctor_name,
            specialization: null
          },
          target_specialist: referralData.target_specialist_name ? {
            full_name: referralData.target_specialist_name,
            specialization: null
          } : null,
          origin_hospital: {
            name: referralData.origin_hospital_name,
            city: referralData.origin_hospital_city,
            state: referralData.origin_hospital_state
          },
          target_hospital: {
            name: referralData.target_hospital_name,
            city: referralData.target_hospital_city,
            state: referralData.target_hospital_state
          },
          target_department: {
            name: referralData.target_department_name,
            description: referralData.target_department_description
          }
        };
        setReferralDetails(mappedData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Track Your Referral</CardTitle>
                  <CardDescription>
                    Enter your referral ID to check the status and details
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Search Form */}
        <Card>
          <CardContent className="p-6">
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
                <Button onClick={() => searchReferral()} disabled={loading}>
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
                <CardTitle>Referral Details</CardTitle>
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
            <CardContent className="p-6 space-y-6">
              {/* Basic Information */}
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
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Timeline</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p><span className="font-medium">Created:</span> {formatDate(referralDetails.created_at)}</p>
                    {referralDetails.appointment_date && (
                      <p><span className="font-medium">Appointment:</span> {formatDate(referralDetails.appointment_date)}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Hospital Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">From Hospital</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="font-medium">{referralDetails.origin_hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralDetails.origin_hospital.city}, {referralDetails.origin_hospital.state}
                    </p>
                    <p><span className="font-medium">Referring Doctor:</span> {referralDetails.referring_doctor.full_name}</p>
                    {referralDetails.referring_doctor.specialization && (
                      <p className="text-sm text-muted-foreground">{referralDetails.referring_doctor.specialization}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">To Hospital</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="font-medium">{referralDetails.target_hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralDetails.target_hospital.city}, {referralDetails.target_hospital.state}
                    </p>
                    <p><span className="font-medium">Department:</span> {referralDetails.target_department.name}</p>
                    {referralDetails.target_specialist && (
                      <>
                        <p><span className="font-medium">Specialist:</span> {referralDetails.target_specialist.full_name}</p>
                        {referralDetails.target_specialist.specialization && (
                          <p className="text-sm text-muted-foreground">{referralDetails.target_specialist.specialization}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical Information */}
              <div className="space-y-3">
                <h3 className="font-medium">Reason for Referral</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{referralDetails.reason}</p>
              </div>

              {referralDetails.notes && (
                <div className="space-y-3">
                  <h3 className="font-medium">Additional Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{referralDetails.notes}</p>
                </div>
              )}

              {referralDetails.specialist_notes && (
                <div className="space-y-3">
                  <h3 className="font-medium">Specialist Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{referralDetails.specialist_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!referralDetails && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Enter a referral ID above to view its details and current status
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackReferral;