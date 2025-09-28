-- Update RLS policy to allow doctors and admins to manage departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

CREATE POLICY "Medical staff can manage departments" 
ON departments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('doctor', 'admin')
  )
);