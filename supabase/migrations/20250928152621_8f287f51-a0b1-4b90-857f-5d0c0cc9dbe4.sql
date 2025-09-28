-- Update RLS policy to allow doctors, specialists, and admins to create referrals
DROP POLICY IF EXISTS "Doctors can create referrals" ON referrals;

CREATE POLICY "Medical staff can create referrals" 
ON referrals 
FOR INSERT 
WITH CHECK (
  referring_doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('doctor', 'specialist', 'admin')
  )
);