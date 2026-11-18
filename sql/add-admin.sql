-- Give a trusted person Admin access (Admin button, drop animals, print QR codes).
-- They must have signed in to the website with Google at least once. Replace the email, then Run. Safe to run twice.
insert into admins (user_id)
select id from auth.users where email = 'teman@gmail.com'
on conflict do nothing;

-- Who is an admin right now?
select u.email, a.user_id from admins a join auth.users u on u.id = a.user_id;

-- Remove an admin (remove the two dashes at the start of the next two lines):
-- delete from admins where user_id = (select id from auth.users where email = 'teman@gmail.com');
