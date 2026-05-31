import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "登录用户";

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            已登录：{email}
          </Typography>
          <Typography sx={{ mt: 4 }}>
            这里是受保护页面的占位内容。正式的账本、账户、分类和记账功能将在后续 Issue 中实现。
          </Typography>

          <Box component="form" action={logout} sx={{ mt: 4 }}>
            <Button type="submit" variant="outlined">
              登出
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
