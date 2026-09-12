import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "institute.admin@exagoal.demo", password: "ExaGo-Institute-2026!", portal: "institute", name: "Dr. Suresh Sharma" },
  { email: "student01@exagoal.demo", password: "ExaGo-Student01-2026!", portal: "student", name: "Aarav Kulkarni" },
  { email: "student02@exagoal.demo", password: "ExaGo-Student02-2026!", portal: "student", name: "Ananya Deshmukh" },
  { email: "student03@exagoal.demo", password: "ExaGo-Student03-2026!", portal: "student", name: "Rohan Patil" },
  { email: "student04@exagoal.demo", password: "ExaGo-Student04-2026!", portal: "student", name: "Isha Joshi" },
  { email: "student05@exagoal.demo", password: "ExaGo-Student05-2026!", portal: "student", name: "Vedant Shinde" },
  { email: "student06@exagoal.demo", password: "ExaGo-Student06-2026!", portal: "student", name: "Meera Pawar" },
  { email: "student07@exagoal.demo", password: "ExaGo-Student07-2026!", portal: "student", name: "Kabir More" },
  { email: "student08@exagoal.demo", password: "ExaGo-Student08-2026!", portal: "student", name: "Sara Khan" },
  { email: "student09@exagoal.demo", password: "ExaGo-Student09-2026!", portal: "student", name: "Aditya Jadhav" },
  { email: "student10@exagoal.demo", password: "ExaGo-Student10-2026!", portal: "student", name: "Niyati Bhosale" },
];

for (const user of users) {
  const { data: existing } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const found = existing.users.find((item) => item.email?.toLowerCase() === user.email.toLowerCase());
  const metadata = { portal: user.portal, full_name: user.name, institute_id: "default-institute" };

  if (found) {
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    console.log(`updated ${user.email}`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    console.log(`created ${user.email}`);
  }
}

console.log("Demo accounts ready.");
