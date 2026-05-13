
REVOKE EXECUTE ON FUNCTION public.handle_payment_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_booking_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_withdrawal_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_agent_role_on_verify() FROM PUBLIC, anon, authenticated;
