import "server-only";

import { createServiceRoleClient } from "lib/supabase/serviceRole";

const usersPerPage = 1000;

export async function isRegisterEmailAvailable(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createServiceRoleClient();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: usersPerPage,
    });

    if (error) {
      throw new Error("Failed to check register email availability.");
    }

    if (
      data.users.some(
        (user) => user.email?.trim().toLowerCase() === normalizedEmail,
      )
    ) {
      return false;
    }

    if (data.nextPage === null) {
      return true;
    }

    page = data.nextPage;
  }
}
