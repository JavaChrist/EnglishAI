import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <Card className="p-2">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Start learning English</CardTitle>
        <CardDescription>
          Create your free account — it takes 30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
