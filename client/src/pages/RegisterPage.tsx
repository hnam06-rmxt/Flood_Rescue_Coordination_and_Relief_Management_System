import { AuthPageFrame } from "../modules/auth/AuthPageFrame";
import { RegisterForm } from "../modules/auth/RegisterForm";

export function RegisterPage() {
  return (
    <AuthPageFrame
      eyebrow="Flood Rescue System"
      title="Create a citizen account"
      description="This form maps directly to the current backend register endpoint and stores the returned JWT session."
      alternatePrompt="Already have an account?"
      alternateHref="/login"
      alternateLabel="Go to login"
    >
      <RegisterForm />
    </AuthPageFrame>
  );
}
