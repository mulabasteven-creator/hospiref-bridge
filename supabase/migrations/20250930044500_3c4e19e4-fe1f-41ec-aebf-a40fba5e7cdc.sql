-- Create junction tables for many-to-many relationships between doctors and hospitals/departments
CREATE TABLE public.doctor_hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, hospital_id)
);

CREATE TABLE public.doctor_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, department_id, hospital_id)
);

-- Enable RLS on new tables
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_hospitals
CREATE POLICY "Doctors can view their own hospital assignments" 
ON public.doctor_hospitals 
FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can manage all doctor hospital assignments" 
ON public.doctor_hospitals 
FOR ALL 
USING (has_profile_role(auth.uid(), 'admin'::user_role));

-- RLS policies for doctor_departments  
CREATE POLICY "Doctors can view their own department assignments" 
ON public.doctor_departments 
FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Admins can manage all doctor department assignments" 
ON public.doctor_departments 
FOR ALL 
USING (has_profile_role(auth.uid(), 'admin'::user_role));