import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Hospital, Users } from 'lucide-react';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  specialization: string | null;
  hospital_id: string | null;
  hospital?: {
    name: string;
    city: string;
  };
}

interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
}

const DoctorAllocation = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsResponse, hospitalsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            specialization,
            hospital_id,
            hospital:hospitals(name, city)
          `)
          .eq('role', 'doctor'),
        supabase
          .from('hospitals')
          .select('id, name, city, state')
          .order('name')
      ]);

      if (doctorsResponse.error) throw doctorsResponse.error;
      if (hospitalsResponse.error) throw hospitalsResponse.error;

      setDoctors(doctorsResponse.data || []);
      setHospitals(hospitalsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctors and hospitals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDoctorHospital = async (doctorId: string, hospitalId: string | null) => {
    setUpdating(doctorId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hospital_id: hospitalId })
        .eq('id', doctorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor hospital allocation updated successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error updating doctor hospital:', error);
      toast({
        title: "Error",
        description: "Failed to update doctor hospital allocation",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const unallocatedDoctors = doctors.filter(d => !d.hospital_id);
  const allocatedDoctors = doctors.filter(d => d.hospital_id);

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
      {unallocatedDoctors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Unallocated Doctors ({unallocatedDoctors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unallocatedDoctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{doctor.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{doctor.email}</p>
                    {doctor.specialization && (
                      <Badge variant="secondary" className="mt-1">
                        {doctor.specialization}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => updateDoctorHospital(doctor.id, value)}
                      disabled={updating === doctor.id}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Allocated Doctors ({allocatedDoctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocatedDoctors.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No doctors have been allocated to hospitals yet.
              </p>
            ) : (
              allocatedDoctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{doctor.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{doctor.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {doctor.specialization && (
                        <Badge variant="secondary">
                          {doctor.specialization}
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Hospital className="w-3 h-3" />
                        {doctor.hospital?.name} - {doctor.hospital?.city}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={doctor.hospital_id || ""}
                      onValueChange={(value) => updateDoctorHospital(doctor.id, value || null)}
                      disabled={updating === doctor.id}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Change hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Remove allocation</SelectItem>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAllocation;