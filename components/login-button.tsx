"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useAuth } from "@/context/auth-context";
import { GoogleIcon } from "@/components/icons";

export const LoginButton = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSignIn = async () => {
    setIsActionLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in failed:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsActionLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (user) {
    return (
      <Button 
        variant="secondary" 
        onPress={handleLogout}
        isDisabled={isActionLoading}
      >
        {isActionLoading ? (
          <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin"></div>
        ) : (
          "Logout"
        )}
      </Button>
    );
  }

  return (
    <Button 
      variant="primary" 
      onPress={handleSignIn}
      className="flex items-center gap-2"
      isDisabled={isActionLoading}
    >
      {isActionLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          <GoogleIcon size={16} />
          Sign in with Google
        </>
      )}
    </Button>
  );
};
