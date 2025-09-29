import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, User, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { z } from 'zod';

interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_history: string | null;
  created_at: string;
  current_hospital: {
    name: string;
  } | null;
}

const patientSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100, "Name too long"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().max(20, "Phone number too long").optional(),
  email: z.string().email("Invalid email").max(255, "Email too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional(),
  emergency_contact_name: z.string().max(100, "Emergency contact name too long").optional(),
  emergency_contact_phone: z.string().max(20, "Emergency contact phone too long").optional(),
  medical_history: z.string().max(2000, "Medical history too long").optional(),
});

const PatientManagement = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          patient_id,
          full_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          medical_history,
          created_at,
          current_hospital:hospitals(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data as Patient[]);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = patientSchema.parse({
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        medical_history: formData.medical_history || undefined,
      });

      const { data, error } = await supabase
        .from('patients')
        .insert([{
          full_name: validatedData.full_name,
          date_of_birth: validatedData.date_of_birth,
          gender: validatedData.gender,
          phone: validatedData.phone || null,
          email: validatedData.email || null,
          address: validatedData.address || null,
          emergency_contact_name: validatedData.emergency_contact_name || null,
          emergency_contact_phone: validatedData.emergency_contact_phone || null,
          medical_history: validatedData.medical_history || null,
        } as any])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient created successfully"
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        toast({
          title: "Validation Error",
          description: fieldErrors,
          variant: "destructive"
        });
      } else {
        console.error('Error creating patient:', error);
        toast({
          title: "Error",
          description: "Failed to create patient",
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      phone: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_history: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Management
            </CardTitle>
            <CardDescription>
              Register and manage patient information
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value: 'male' | 'female' | 'other') => 
                        setFormData({ ...formData, gender: value })
                      }
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
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical_history">Medical History</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Create Patient</Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No patients found. Add your first patient to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map((patient) => (
              <div key={patient.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {patient.patient_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Age: {calculateAge(patient.date_of_birth)}
                    </Badge>
                    <Badge variant="secondary">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>DOB: {formatDate(patient.date_of_birth)}</span>
                  </div>
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                  {patient.emergency_contact_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Emergency: {patient.emergency_contact_name}</span>
                    </div>
                  )}
                  {patient.current_hospital && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Hospital:</span>
                      <span>{patient.current_hospital.name}</span>
                    </div>
                  )}
                </div>
                
                {patient.medical_history && (
                  <div className="mt-3 p-3 bg-muted rounded">
                    <h4 className="font-medium text-sm mb-1">Medical History:</h4>
                    <p className="text-sm text-muted-foreground">{patient.medical_history}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientManagement;