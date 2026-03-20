"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayDuesButtonProps {
  userId: string;
  userName: string;
  amount: number;
  variant?: "default" | "outline" | "tactical";
}

/**
 * @fileOverview PayMongo Dues Authorization Button.
 * Handles the secure handshake with the PayMongo API to generate checkout links.
 */
export function PayDuesButton({ userId, userName, amount, variant = "default" }: PayDuesButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!userId || amount <= 0) return;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/paymongo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, amount }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect the Patriot to the secure PayMongo GCash/Maya portal
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to generate payment link");
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast({
        variant: "destructive",
        title: "Deployment Error",
        description: "Could not initialize PayMongo link. Please try again."
      });
      setIsProcessing(false);
    }
  };

  if (variant === "tactical") {
    return (
      <Button 
        onClick={handleCheckout} 
        disabled={isProcessing}
        className="w-full h-14 bg-[#002366] hover:bg-[#001a4d] text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin h-6 w-6" />
            <span>AUTHORIZING...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-6 w-6" />
            <span>Authorize Payment via PayMongo</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={isProcessing}
      className="w-full mt-4 h-12 bg-[#002366] hover:bg-[#001a4d] text-white rounded-xl font-black text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          <span>HANDSHAKING...</span>
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>PAY ₱{amount} DUES NOW</span>
        </>
      )}
    </Button>
  );
}
