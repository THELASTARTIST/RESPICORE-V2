// app/(auth)/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = { title: "RespiCore - Sign In" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
