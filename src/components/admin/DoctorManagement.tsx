import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, Building2, Hospital, Plus, Edit2, Eye } from 'lucide-react';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  specialization: string | null;
  license_number: string | null;
  phone: string | null;
  hospital_assignments: Array<{
    hospital_id: string;
    hospital_name: string;
    hospital_city: string;
  }>;
  department_assignments: Array<{
    department_id: string;
    department_name: string;
    hospital_name: string;
  }>;
}

interface Hospital {
  id: string;
  name: string;
  city: string;
}

interface Department {
  id: string;
  name: string;
  hospital_id: string;
  hospital_name: string;
}

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHospital, setFilterHospital] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch doctors with their current assignments
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          specialization,
          license_number,
          phone
        `)
        .eq('role', 'doctor');

      if (doctorsError) throw doctorsError;

      // Fetch hospital assignments
      const { data: hospitalAssignments, error: hospitalError } = await supabase
        .from('doctor_hospitals')
        .select(`
          doctor_id,
          hospital_id
        `);

      if (hospitalError) {
        console.error('Hospital assignments error:', hospitalError);
        throw hospitalError;
      }

      // Fetch department assignments
      const { data: departmentAssignments, error: departmentError } = await supabase
        .from('doctor_departments')
        .select(`
          doctor_id,
          department_id,
          hospital_id
        `);

      if (departmentError) {
        console.error('Department assignments error:', departmentError);
        throw departmentError;
      }

      // Fetch all hospitals and departments for the assignment interface
      const [hospitalsResponse, departmentsResponse] = await Promise.all([
        supabase.from('hospitals').select('id, name, city').order('name'),
        supabase.from('departments').select('id, name, hospital_id').order('name')
      ]);

      if (hospitalsResponse.error) {
        console.error('Hospitals fetch error:', hospitalsResponse.error);
        throw hospitalsResponse.error;
      }
      if (departmentsResponse.error) {
        console.error('Departments fetch error:', departmentsResponse.error);
        throw departmentsResponse.error;
      }

      setHospitals(hospitalsResponse.data || []);
      setDepartments((departmentsResponse.data || []).map((dept: any) => {
        const h = (hospitalsResponse.data || []).find((x: any) => x.id === dept.hospital_id);
        return {
          id: dept.id,
          name: dept.name,
          hospital_id: dept.hospital_id,
          hospital_name: h?.name || 'Unknown Hospital'
        };
      }));

      // Combine doctor data with assignments
      const enrichedDoctors = (doctorsData || []).map((doctor: any) => {
        const docHospitals = (hospitalAssignments || [])
          .filter((ha: any) => ha.doctor_id === doctor.id)
          .map((ha: any) => {
            const h = (hospitalsResponse.data || []).find((x: any) => x.id === ha.hospital_id);
            return {
              hospital_id: ha.hospital_id,
              hospital_name: h?.name || 'Unknown',
              hospital_city: h?.city || 'Unknown'
            };
          });

        const docDepartments = (departmentAssignments || [])
          .filter((da: any) => da.doctor_id === doctor.id)
          .map((da: any) => {
            const d = (departmentsResponse.data || []).find((x: any) => x.id === da.department_id);
            const h = (hospitalsResponse.data || []).find((x: any) => x.id === (d?.hospital_id || da.hospital_id));
            return {
              department_id: da.department_id,
              department_name: d?.name || 'Unknown',
              hospital_name: h?.name || 'Unknown'
            };
          });

        return {
          ...doctor,
          hospital_assignments: docHospitals,
          department_assignments: docDepartments
        };
      });

      setDoctors(enrichedDoctors);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedHospitals(doctor.hospital_assignments.map(ha => ha.hospital_id));
    setSelectedDepartments(doctor.department_assignments.map(da => da.department_id));
    setDialogOpen(true);
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

  const saveAssignments = async () => {
    if (!selectedDoctor) return;

    setUpdating(true);
    try {
      // Delete existing assignments
      await Promise.all([
        supabase.from('doctor_hospitals').delete().eq('doctor_id', selectedDoctor.id),
        supabase.from('doctor_departments').delete().eq('doctor_id', selectedDoctor.id)
      ]);

      // Insert new hospital assignments
      if (selectedHospitals.length > 0) {
        const hospitalInserts = selectedHospitals.map(hospitalId => ({
          doctor_id: selectedDoctor.id,
          hospital_id: hospitalId
        }));

        const { error: hospitalError } = await supabase
          .from('doctor_hospitals')
          .insert(hospitalInserts);

        if (hospitalError) throw hospitalError;
      }

      // Insert new department assignments
      if (selectedDepartments.length > 0) {
        const departmentInserts = selectedDepartments.map(departmentId => {
          const dept = departments.find(d => d.id === departmentId);
          return {
            doctor_id: selectedDoctor.id,
            department_id: departmentId,
            hospital_id: dept?.hospital_id
          };
        });

        const { error: departmentError } = await supabase
          .from('doctor_departments')
          .insert(departmentInserts);

        if (departmentError) throw departmentError;
      }

      toast({
        title: "Success",
        description: "Doctor assignments updated successfully"
      });

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast({
        title: "Error",
        description: "Failed to update doctor assignments",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableDepartments = () => {
    return departments.filter(dept => selectedHospitals.includes(dept.hospital_id));
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHospital = !filterHospital || 
                           doctor.hospital_assignments.some(ha => ha.hospital_id === filterHospital);

    return matchesSearch && matchesHospital;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading doctors...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Doctor Management ({doctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors by name, email, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterHospital} onValueChange={setFilterHospital}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All hospitals</SelectItem>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredDoctors.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No doctors found matching your criteria.
              </p>
            ) : (
              filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{doctor.full_name}</h4>
                        {doctor.specialization && (
                          <Badge variant="secondary">
                            {doctor.specialization}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{doctor.email}</p>
                      {doctor.phone && (
                        <p className="text-sm text-muted-foreground mb-1">{doctor.phone}</p>
                      )}
                      {doctor.license_number && (
                        <p className="text-sm text-muted-foreground mb-2">
                          License: {doctor.license_number}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doctor.hospital_assignments.map((assignment, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {assignment.hospital_name} - {assignment.hospital_city}
                          </Badge>
                        ))}
                        {doctor.department_assignments.map((assignment, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Hospital className="w-3 h-3" />
                            {assignment.department_name} ({assignment.hospital_name})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignmentDialog(doctor)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Assignments - {selectedDoctor?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDoctor && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Hospital Assignments</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
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
              </div>

              {selectedHospitals.length > 0 && (
                <div className="space-y-2">
                  <Label>Department Assignments</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
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
                          <span className="text-muted-foreground">({department.hospital_name})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveAssignments} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Assignments'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorManagement;