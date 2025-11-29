import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { ChevronLeft, Mail, MapPin, Phone, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    pgAddress: "",
    pgLocation: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            pgAddress: formData.pgAddress,
            pgLocation: formData.pgLocation,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Registration failed");
        }

        setIsLoading(false);
        setStep(3);
      } catch (err) {
        setError((err as any).message);
        setIsLoading(false);
      }
    } else if (step === 3) {
      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        setError("Please enter all 6 digits");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: otpCode,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "OTP verification failed");
        }

        setIsLoading(false);
        setLocation("/dashboard");
      } catch (err) {
        setError((err as any).message);
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto border-x border-border shadow-2xl relative">
      <header className="bg-card border-b border-border p-4 flex items-center h-16 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? setLocation("/") : setStep(prev => prev - 1 as any)}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg ml-2">
          {step === 1 ? "Create Account" : step === 2 ? "Set Password" : "Verification"}
        </h1>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="flex justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {s}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {s === 1 ? "Details" : s === 2 ? "Security" : "Verify"}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm" data-testid="error-message">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleNext}
              className="space-y-6"
            >
              {step === 1 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          placeholder="Enter your full name" 
                          className="pl-10 bg-card" 
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required 
                          data-testid="input-register-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="mobile" 
                          type="tel" 
                          placeholder="+91 98765 43210" 
                          className="pl-10 bg-card" 
                          value={formData.mobile}
                          onChange={(e) => handleInputChange("mobile", e.target.value)}
                          required 
                          data-testid="input-register-mobile"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="you@example.com" 
                          className="pl-10 bg-card" 
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required 
                          data-testid="input-register-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">PG Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="address" 
                          placeholder="Building No, Street Name" 
                          className="pl-10 bg-card" 
                          value={formData.pgAddress}
                          onChange={(e) => handleInputChange("pgAddress", e.target.value)}
                          required 
                          data-testid="input-register-address"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">PG Location (City/Area)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          placeholder="e.g. Koramangala, Bangalore" 
                          className="pl-10 bg-card" 
                          value={formData.pgLocation}
                          onChange={(e) => handleInputChange("pgLocation", e.target.value)}
                          required 
                          data-testid="input-register-location"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button type="submit" className="w-full h-12 text-base" data-testid="button-register-next">
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-12 border-muted"
                      onClick={handleGoogleLogin}
                      data-testid="button-register-google"
                    >
                      <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                      </svg>
                      Google
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Create Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Min 8 characters" 
                          className="pl-10 pr-10 bg-card" 
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required 
                          data-testid="input-register-password"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Re-enter password" 
                          className="pl-10 bg-card" 
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          required 
                          data-testid="input-register-confirmpassword"
                        />
                      </div>
                    </div>

                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      <li>At least 8 characters long</li>
                      <li>Contains at least one number</li>
                      <li>Contains at least one special character</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading} data-testid="button-register-sendotp">
                      {isLoading ? "Processing..." : "Send OTP"}
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="text-center space-y-6">
                  <div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl">Verify your Account</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      We've sent a 6-digit code to<br/>
                      <span className="font-medium text-foreground">{formData.email}</span> and <span className="font-medium text-foreground">{formData.mobile}</span>
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <Input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        className="w-10 h-12 text-center text-lg font-bold bg-card"
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          handleOtpChange(idx, val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && idx > 0) {
                            const prevInput = document.getElementById(`otp-${idx - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        data-testid={`input-otp-${idx}`}
                      />
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Didn't receive code? <button type="button" className="text-primary font-medium hover:underline" data-testid="button-resend-otp">Resend</button>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base" disabled={isLoading} data-testid="button-register-verify">
                    {isLoading ? "Verifying..." : "Verify & Register"}
                  </Button>
                </div>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
