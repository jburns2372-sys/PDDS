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
        body: JSON.stringify({ 
          userId, 
          userName, 
          amount,
          description: "2026 Annual Membership Dues",
          paymentType: "MEMBERSHIP_DUES",
          success_url: `${window.location.origin}/patriot-pondo/success`,
          cancel_url: `${window.location.origin}/patriot-pondo`
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to generate link");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Portal Error",
        description: "Could not initialize PayMongo link."
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
            <span>Secure Checkout</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={isProcessing}
      className="w-full mt-4 h-12 bg-[#002366] hover:bg-[#001a4d] text-white rounded-xl font-black text-[9px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <><Loader2 className="animate-spin h-4 w-4" /> HANDSHAKING...</>
      ) : (
        <><ShieldCheck className="h-4 w-4 text-accent" /> PAY ₱{amount} DUES NOW</>
      )}
    </Button>
  );
}
