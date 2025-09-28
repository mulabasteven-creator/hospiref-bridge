import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Calendar } from 'lucide-react';

interface Referral {
  id: string;
  referral_id: string;
  patient_id: string;
  referring_doctor_id: string;
  target_hospital_id: string;
  target_department_id: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled' | 'in_progress';
  appointment_date?: string;
  created_at: string;
  patients?: {
    full_name: string;
    patient_id: string;
  };
  hospitals?: {
    name: string;
  };
  departments?: {
    name: string;
  };
}

interface Hospital {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  hospital_id: string;
}

interface Patient {
  id: string;
  full_name: string;
  patient_id: string;
}

const ReferralManagement = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('');

const [formData, setFormData] = useState({
    // Patient info
    patient_full_name: '',
    patient_date_of_birth: '',
    patient_gender: 'male' as 'male' | 'female' | 'other',
    patient_phone: '',
    patient_email: '',
    patient_address: '',
    patient_emergency_contact_name: '',
    patient_emergency_contact_phone: '',
    patient_medical_history: '',
    // Referral info
    target_hospital_id: '',
    target_department_id: '',
    reason: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: ''
  });
  
  const [createdReferralId, setCreatedReferralId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referralsResult, hospitalsResult, departmentsResult, patientsResult] = await Promise.all([
        supabase
          .from('referrals')
          .select(`
            *,
            patients!inner(full_name, patient_id),
            hospitals!referrals_target_hospital_id_fkey(name),
            departments!inner(name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('hospitals').select('id, name').order('name'),
        supabase.from('departments').select('id, name, hospital_id').order('name'),
        supabase.from('patients').select('id, full_name, patient_id').order('full_name')
      ]);

      if (referralsResult.error) throw referralsResult.error;
      if (hospitalsResult.error) throw hospitalsResult.error;
      if (departmentsResult.error) throw departmentsResult.error;
      if (patientsResult.error) throw patientsResult.error;

      setReferrals(referralsResult.data || []);
      setHospitals(hospitalsResult.data || []);
      setDepartments(departmentsResult.data || []);
      setPatients(patientsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No authenticated user');

      // First create the patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          full_name: formData.patient_full_name,
          date_of_birth: formData.patient_date_of_birth,
          gender: formData.patient_gender as 'male' | 'female' | 'other',
          phone: formData.patient_phone || null,
          email: formData.patient_email || null,
          address: formData.patient_address || null,
          emergency_contact_name: formData.patient_emergency_contact_name || null,
          emergency_contact_phone: formData.patient_emergency_contact_phone || null,
          medical_history: formData.patient_medical_history || null,
          current_hospital_id: formData.target_hospital_id || null
        } as any)
        .select()
        .single();
      
      if (patientError) throw patientError;

      // Then create the referral
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .insert([{
          patient_id: patientData.id,
          target_hospital_id: formData.target_hospital_id,
          target_department_id: formData.target_department_id,
          reason: formData.reason,
          urgency: formData.urgency,
          notes: formData.notes,
          referring_doctor_id: currentUser.user.id,
          origin_hospital_id: formData.target_hospital_id
        } as any])
        .select('referral_id')
        .single();
      
      if (referralError) throw referralError;
      
      setCreatedReferralId(referralData.referral_id);
      
      toast({
        title: "Success",
        description: `Referral created successfully! ID: ${referralData.referral_id}`
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating referral:', error);
      toast({
        title: "Error",
        description: "Failed to create referral",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patient_full_name: '',
      patient_date_of_birth: '',
      patient_gender: 'male',
      patient_phone: '',
      patient_email: '',
      patient_address: '',
      patient_emergency_contact_name: '',
      patient_emergency_contact_phone: '',
      patient_medical_history: '',
      target_hospital_id: '',
      target_department_id: '',
      reason: '',
      urgency: 'medium',
      notes: ''
    });
    setSelectedHospital('');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      accepted: 'default',
      completed: 'default',
      rejected: 'destructive',
      cancelled: 'destructive',
      in_progress: 'default'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;
    
    return <Badge variant={variants[urgency as keyof typeof variants] || 'secondary'}>{urgency}</Badge>;
  };

  const filteredDepartments = departments.filter(dept => dept.hospital_id === selectedHospital);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Referral Management</CardTitle>
              <CardDescription>
                View all referrals and create new ones
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Referral</DialogTitle>
                  <DialogDescription>
                    Create a new patient referral to a specialist or another hospital.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateReferral} className="space-y-4 pb-24">
                  <div className="grid gap-4 py-4">
                    {/* Patient Information */}
                    <div className="space-y-4 border-b pb-4">
                      <h4 className="font-medium">Patient Information</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient_full_name">Full Name *</Label>
                          <Input
                            id="patient_full_name"
                            value={formData.patient_full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_full_name: e.target.value }))}
                            placeholder="Enter patient full name"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="patient_date_of_birth">Date of Birth *</Label>
                          <Input
                            id="patient_date_of_birth"
                            type="date"
                            value={formData.patient_date_of_birth}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_date_of_birth: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient_gender">Gender *</Label>
                          <Select 
                            value={formData.patient_gender} 
                            onValueChange={(value: 'male' | 'female' | 'other') => 
                              setFormData(prev => ({ ...prev, patient_gender: value }))
                            }
                            required
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="patient_phone">Phone</Label>
                          <Input
                            id="patient_phone"
                            value={formData.patient_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient_email">Email</Label>
                          <Input
                            id="patient_email"
                            type="email"
                            value={formData.patient_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
                            placeholder="Enter email address"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="patient_address">Address</Label>
                          <Input
                            id="patient_address"
                            value={formData.patient_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_address: e.target.value }))}
                            placeholder="Enter address"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                          <Input
                            id="emergency_contact_name"
                            value={formData.patient_emergency_contact_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_emergency_contact_name: e.target.value }))}
                            placeholder="Enter emergency contact name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                          <Input
                            id="emergency_contact_phone"
                            value={formData.patient_emergency_contact_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, patient_emergency_contact_phone: e.target.value }))}
                            placeholder="Enter emergency contact phone"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medical_history">Medical History</Label>
                        <Textarea
                          id="medical_history"
                          value={formData.patient_medical_history}
                          onChange={(e) => setFormData(prev => ({ ...prev, patient_medical_history: e.target.value }))}
                          placeholder="Enter relevant medical history"
                        />
                      </div>
                    </div>

                    {/* Referral Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Referral Information</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hospital">Target Hospital *</Label>
                        <Select 
                          value={formData.target_hospital_id} 
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, target_hospital_id: value, target_department_id: '' }));
                            setSelectedHospital(value);
                          }}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            {hospitals.map((hospital) => (
                              <SelectItem key={hospital.id} value={hospital.id}>
                                {hospital.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select 
                          value={formData.target_department_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, target_department_id: value }))}
                          required
                          disabled={!selectedHospital}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDepartments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency *</Label>
                        <Select 
                          value={formData.urgency} 
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                            setFormData(prev => ({ ...prev, urgency: value }))
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Referral *</Label>
                        <Textarea
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Enter reason for referral"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes or special instructions"
                        />
                      </div>
                    </div>
                  </div>
                  
                  
                  <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Referral</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show created referral ID for tracking */}
          {createdReferralId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-medium text-green-800">Referral Created Successfully!</h4>
              </div>
              <p className="text-green-700 mt-2">
                <strong>Referral ID:</strong> {createdReferralId}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Share this ID with the patient for tracking purposes.
              </p>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/track-referral?id=${createdReferralId}`, '_blank')}
                >
                  Track This Referral
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">Loading referrals...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referral ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Target Hospital</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.referral_id}</TableCell>
                    <TableCell>
                      {referral.patients?.full_name} ({referral.patients?.patient_id})
                    </TableCell>
                    <TableCell>{referral.hospitals?.name}</TableCell>
                    <TableCell>{referral.departments?.name}</TableCell>
                    <TableCell>{getUrgencyBadge(referral.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                        onClick={() => window.open(`/track-referral?id=${referral.referral_id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralManagement;