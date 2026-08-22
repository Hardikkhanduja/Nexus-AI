import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { useClerkSafe } from "@/lib/clerk";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useClerkSafe();

  React.useEffect(() => {
    if (isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, setLocation]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-[#08080B]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h1
            onClick={() => setLocation("/")}
            className="font-display text-3xl tracking-wider text-[#00FFB3] cursor-pointer hover:scale-105 transition-transform"
          >
            NEXUS AI
          </h1>
          <p className="font-sans text-xs text-[#FF4FD8] tracking-widest mt-1 uppercase font-bold">
            Create your Nexus Account
          </p>
        </div>

        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </motion.div>
    </div>
  );
}
