-- Fix RLS infinite recursion on profiles by using a SECURITY DEFINER function
-- 1) Create a helper function that checks a user's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.has_profile_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.role = _role
  );
$$;

-- 2) Replace recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_profile_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.has_profile_role(auth.uid(), 'admin'));

-- Keep existing non-recursive self policies as-is
-- (Users can view/update their own profile)
