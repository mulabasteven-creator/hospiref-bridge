-- Function to allow public tracking of referrals by referral_id
CREATE OR REPLACE FUNCTION public.get_referral_public(_referral_id text)
RETURNS TABLE (
  referral_id text,
  status public.referral_status,
  urgency public.urgency_level,
  reason text,
  notes text,
  appointment_date timestamptz,
  created_at timestamptz,
  patient_full_name text,
  patient_id text,
  referring_doctor_name text,
  target_specialist_name text,
  origin_hospital_name text,
  origin_hospital_city text,
  origin_hospital_state text,
  target_hospital_name text,
  target_hospital_city text,
  target_hospital_state text,
  target_department_name text,
  target_department_description text
) AS $$
  SELECT 
    r.referral_id,
    r.status,
    r.urgency,
    r.reason,
    r.notes,
    r.appointment_date,
    r.created_at,
    p.full_name AS patient_full_name,
    p.patient_id,
    d.full_name AS referring_doctor_name,
    s.full_name AS target_specialist_name,
    oh.name AS origin_hospital_name,
    oh.city AS origin_hospital_city,
    oh.state AS origin_hospital_state,
    th.name AS target_hospital_name,
    th.city AS target_hospital_city,
    th.state AS target_hospital_state,
    td.name AS target_department_name,
    td.description AS target_department_description
  FROM public.referrals r
  JOIN public.patients p ON p.id = r.patient_id
  LEFT JOIN public.profiles d ON d.id = r.referring_doctor_id
  LEFT JOIN public.profiles s ON s.id = r.target_specialist_id
  JOIN public.hospitals oh ON oh.id = r.origin_hospital_id
  JOIN public.hospitals th ON th.id = r.target_hospital_id
  JOIN public.departments td ON td.id = r.target_department_id
  WHERE r.referral_id = UPPER(_referral_id)
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;