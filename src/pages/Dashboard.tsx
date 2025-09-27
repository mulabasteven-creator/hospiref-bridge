import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import SpecialistDashboard from '@/components/dashboards/SpecialistDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading your dashboard...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'specialist':
        return <SpecialistDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Card>
              <CardContent className="p-6">
                <p>Unknown user role: {profile.role}</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;