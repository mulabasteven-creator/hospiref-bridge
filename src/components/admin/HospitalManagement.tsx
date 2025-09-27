import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
}

interface HospitalForm {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
}

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<HospitalForm>({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast({
        title: "Error",
        description: "Failed to load hospitals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('hospitals')
        .insert([formData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Hospital added successfully"
      });
      
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: ''
      });
      fetchHospitals();
    } catch (error) {
      console.error('Error adding hospital:', error);
      toast({
        title: "Error",
        description: "Failed to add hospital",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof HospitalForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hospital Management</CardTitle>
            <CardDescription>
              Manage hospital facilities and their information
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Hospital</DialogTitle>
                <DialogDescription>
                  Enter the hospital details to add it to the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hospital Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter hospital name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter hospital address"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Region *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State/Region"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Hospital</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading hospitals...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.map((hospital) => (
                <TableRow key={hospital.id}>
                  <TableCell className="font-medium">{hospital.name}</TableCell>
                  <TableCell>{hospital.city}, {hospital.state}</TableCell>
                  <TableCell>{hospital.phone}</TableCell>
                  <TableCell>{hospital.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
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
  );
};

export default HospitalManagement;