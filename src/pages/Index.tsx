import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Building, Users, FileText, Search, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Heart className="w-12 h-12 text-primary" />
              <h1 className="text-5xl font-bold text-foreground">HospiRef</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Streamline patient referrals across healthcare networks. Connect hospitals, 
              doctors, specialists, and patients in one comprehensive management system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="min-w-[200px]">
                <Users className="w-5 h-5 mr-2" />
                Access Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/track-referral')}
                className="min-w-[200px]"
              >
                <Search className="w-5 h-5 mr-2" />
                Track Referral
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Complete Referral Management Solution
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for healthcare professionals and patients to ensure seamless communication 
            and efficient patient care coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Admin Features */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Building className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-lg">Admin Portal</CardTitle>
                  <Badge variant="secondary">System Management</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Manage hospitals, departments, specialists, and users. 
                Generate reports and monitor system-wide performance.
              </CardDescription>
              <ul className="mt-3 text-xs space-y-1 text-muted-foreground">
                <li>• Hospital & department management</li>
                <li>• User role assignment</li>
                <li>• Analytics & reporting</li>
                <li>• System configuration</li>
              </ul>
            </CardContent>
          </Card>

          {/* Doctor Features */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Doctor Portal</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Referral Creation</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Create referrals, manage patients, and track referral outcomes. 
                Connect patients with specialists across the network.
              </CardDescription>
              <ul className="mt-3 text-xs space-y-1 text-muted-foreground">
                <li>• Patient management</li>
                <li>• Referral creation & tracking</li>
                <li>• Cross-hospital referrals</li>
                <li>• Medical history access</li>
              </ul>
            </CardContent>
          </Card>

          {/* Specialist Features */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-lg">Specialist Portal</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Review & Process</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Review incoming referrals, update patient status, and manage 
                appointments. Collaborate with referring physicians.
              </CardDescription>
              <ul className="mt-3 text-xs space-y-1 text-muted-foreground">
                <li>• Referral review & processing</li>
                <li>• Status updates & notes</li>
                <li>• Appointment scheduling</li>
                <li>• Care plan communication</li>
              </ul>
            </CardContent>
          </Card>

          {/* Patient Features */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Search className="w-8 h-8 text-orange-600" />
                <div>
                  <CardTitle className="text-lg">Patient Portal</CardTitle>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Track Progress</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Track referral status in real-time using unique referral IDs. 
                Stay informed about your healthcare journey.
              </CardDescription>
              <ul className="mt-3 text-xs space-y-1 text-muted-foreground">
                <li>• Real-time status tracking</li>
                <li>• Referral history</li>
                <li>• Appointment notifications</li>
                <li>• Healthcare journey visibility</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-8 opacity-90">
              Join the network of healthcare professionals streamlining patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="min-w-[200px]"
              >
                Sign In / Register
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/track-referral')}
                className="min-w-[200px] bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Track a Referral
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold">HospiRef</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Hospital Referral Management System - Connecting healthcare, improving outcomes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
