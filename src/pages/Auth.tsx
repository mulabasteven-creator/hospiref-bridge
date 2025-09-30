import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Shield, UserCheck, User, Hospital, Building2 } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  city: string;
}

interface Department {
  id: string;
  name: string;
  hospital_id: string;
}

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'patient',
    specialization: '',
    licenseNumber: ''
  });
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSignUp && (formData.role === 'doctor' || formData.role === 'specialist')) {
      fetchHospitalsAndDepartments();
    }
  }, [isSignUp, formData.role]);

  const fetchHospitalsAndDepartments = async () => {
    setLoadingData(true);
    try {
      const [hospitalsResponse, departmentsResponse] = await Promise.all([
        supabase.from('hospitals').select('id, name, city').order('name'),
        supabase.from('departments').select('id, name, hospital_id').order('name')
      ]);

      if (hospitalsResponse.error) throw hospitalsResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;

      setHospitals(hospitalsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const userData: any = {
          full_name: formData.fullName,
          role: formData.role,
          phone: formData.phone || undefined
        };

        if (formData.role === 'doctor' || formData.role === 'specialist') {
          userData.specialization = formData.specialization || undefined;
          userData.license_number = formData.licenseNumber || undefined;
          userData.selected_hospitals = selectedHospitals;
          userData.selected_departments = selectedDepartments;
        }

        await signUp(formData.email, formData.password, userData);
      } else {
        await signIn(formData.email, formData.password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalToggle = (hospitalId: string) => {
    setSelectedHospitals(prev => 
      prev.includes(hospitalId) 
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
    
    // Remove departments from unselected hospitals
    setSelectedDepartments(prev => 
      prev.filter(deptId => {
        const dept = departments.find(d => d.id === deptId);
        return dept && (selectedHospitals.includes(dept.hospital_id) || hospitalId === dept.hospital_id);
      })
    );
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const getAvailableDepartments = () => {
    return departments.filter(dept => selectedHospitals.includes(dept.hospital_id));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'doctor': return <UserCheck className="w-4 h-4" />;
      case 'specialist': return <Heart className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Manage hospitals, departments, and users';
      case 'doctor': return 'Create referrals and manage patients';
      case 'specialist': return 'Receive and process referrals';
      case 'patient': return 'Track your referrals and medical history';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl font-bold">HospiRef</CardTitle>
          </div>
          <CardDescription className="text-center">
            Hospital Referral Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => {
                    setFormData({...formData, role: value});
                    setSelectedHospitals([]);
                    setSelectedDepartments([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon('patient')}
                          <span>Patient</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="doctor">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon('doctor')}
                          <span>Doctor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="specialist">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon('specialist')}
                          <span>Specialist</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon('admin')}
                          <span>Administrator</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getRoleDescription(formData.role)}
                  </p>
                </div>

                {(formData.role === 'doctor' || formData.role === 'specialist') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        placeholder="e.g., Cardiology, Neurology"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="Medical license number"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        required
                      />
                    </div>
                    
                    {loadingData ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading hospitals and departments...
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Select Hospital(s)</Label>
                          <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                            {hospitals.map((hospital) => (
                              <div key={hospital.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`hospital-${hospital.id}`}
                                  checked={selectedHospitals.includes(hospital.id)}
                                  onCheckedChange={() => handleHospitalToggle(hospital.id)}
                                />
                                <Label htmlFor={`hospital-${hospital.id}`} className="text-sm flex items-center space-x-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>{hospital.name} - {hospital.city}</span>
                                </Label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select one or more hospitals where you work
                          </p>
                        </div>

                        {selectedHospitals.length > 0 && (
                          <div className="space-y-2">
                            <Label>Select Department(s)</Label>
                            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                              {getAvailableDepartments().map((department) => (
                                <div key={department.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`dept-${department.id}`}
                                    checked={selectedDepartments.includes(department.id)}
                                    onCheckedChange={() => handleDepartmentToggle(department.id)}
                                  />
                                  <Label htmlFor={`dept-${department.id}`} className="text-sm flex items-center space-x-1">
                                    <Hospital className="w-3 h-3" />
                                    <span>{department.name}</span>
                                    <span className="text-muted-foreground">
                                      ({hospitals.find(h => h.id === department.hospital_id)?.name})
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Select your department(s) in the selected hospitals
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || (formData.role === 'doctor' && selectedHospitals.length === 0)}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/track')}
              className="text-sm"
            >
              Track a referral without account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;