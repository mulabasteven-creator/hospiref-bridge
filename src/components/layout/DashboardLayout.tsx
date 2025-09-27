import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  LogOut, 
  User, 
  Settings,
  Shield,
  UserCheck,
  Stethoscope
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const DashboardLayout = ({ children, title, description }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();

  const getRoleIcon = () => {
    switch (profile?.role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'doctor': return <UserCheck className="w-5 h-5" />;
      case 'specialist': return <Stethoscope className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleBadgeColor = () => {
    switch (profile?.role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'doctor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'specialist': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">HospiRef Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">{title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleBadgeColor()}>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon()}
                          <span>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;