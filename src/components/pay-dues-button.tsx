"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard } from "lucide-react";

interface PayDuesButtonProps {
  userId: string;
  userName: string;
  amount: number;
}

export function PayDuesButton({ userId, userName, amount }: PayDuesButtonProps) {
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
        // Redirect the user to the secure PayMongo GCash/Maya portal
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to generate payment link");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast({
        title: "PAYMENT ERROR",
        description: "Could not connect to the payment gateway. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false); // Only stop loading if it fails; if success, they are redirecting
    }
  };

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={isProcessing}
      className="w-full mt-4 h-14 bg-[#002366] hover:bg-[#001a4d] text-white rounded-xl font-black text-lg tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="animate-spin h-6 w-6" />
          <span>CONNECTING TO BANK...</span>
        </>
      ) : (
        <>
          <CreditCard className="h-6 w-6" />
          <span>PAY ₱{amount} NOW</span>
        </>
      )}
    </Button>
  );
}